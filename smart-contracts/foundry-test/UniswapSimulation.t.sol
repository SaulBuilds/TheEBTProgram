// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";
import "forge-std/console.sol";

import "../contracts/EBTProgram.sol";
import "../contracts/ERC6551Registry.sol";
import "../contracts/ERC6551Account.sol";
import "../contracts/FoodStamps.sol";
import "../contracts/LiquidityVault.sol";
import "../contracts/TeamVesting.sol";
import "../contracts/EBTApplication.sol";
import "../contracts/MarketingVesting.sol";

/// @title Mock Uniswap V3 Router for simulation
/// @notice Simulates swap functionality for testing
contract MockSwapRouter {
    event SwapExecuted(address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut);

    // Simulate 1 ETH = 100,000 FOOD tokens exchange rate
    uint256 public constant FOOD_PER_ETH = 100_000 * 1e18;

    function exactInput(bytes calldata path, address recipient, uint256 deadline, uint256 amountIn, uint256 minAmountOut)
        external
        payable
        returns (uint256 amountOut)
    {
        // Simulate swap: 1 ETH = 100k FOOD
        amountOut = (amountIn * FOOD_PER_ETH) / 1e18;
        require(amountOut >= minAmountOut, "Insufficient output");

        emit SwapExecuted(address(0), address(0), amountIn, amountOut);
        return amountOut;
    }

    receive() external payable {}
}

/// @title Mock WETH for simulation
contract MockWETH {
    string public name = "Wrapped Ether";
    string public symbol = "WETH";
    uint8 public decimals = 18;

    mapping(address => uint256) public balanceOf;

    function deposit() external payable {
        balanceOf[msg.sender] += msg.value;
    }

    function withdraw(uint256 amount) external {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        payable(msg.sender).transfer(amount);
    }

    receive() external payable {
        balanceOf[msg.sender] += msg.value;
    }
}

/// @title Uniswap and Liquidity Provision Simulation
/// @notice Tests DEX integration, liquidity provision, and buyback mechanics
contract UniswapSimulation is Test {
    // Core Contracts
    EBTProgram public program;
    ERC6551Registry public registry;
    ERC6551Account public accountImpl;
    FoodStamps public food;
    LiquidityVault public vault;
    TeamVesting public teamVesting;
    EBTApplication public application;

    // Mock DEX
    MockSwapRouter public swapRouter;
    MockWETH public weth;

    // Test Accounts
    address public owner;
    address public protocolCaller;
    address public treasury;
    address public marketing;
    address public teamWallet;

    // Test users for minting
    address[] public mintTestUsers;
    uint256 constant NUM_TEST_USERS = 50;

    function setUp() public {
        owner = address(this);
        protocolCaller = makeAddr("protocolCaller");
        treasury = makeAddr("treasury");
        marketing = makeAddr("marketing");
        teamWallet = makeAddr("teamWallet");

        // Deploy mock DEX
        swapRouter = new MockSwapRouter();
        weth = new MockWETH();

        // Deploy core contracts
        _deployContracts();
        _configureContracts();
        _generateTestUsers();

        console.log("=== UNISWAP SIMULATION SETUP ===");
        console.log("SwapRouter:", address(swapRouter));
        console.log("WETH:", address(weth));
    }

    function _deployContracts() internal {
        application = new EBTApplication();
        food = new FoodStamps();
        registry = new ERC6551Registry();
        accountImpl = new ERC6551Account();
        vault = new LiquidityVault(address(food));
        teamVesting = new TeamVesting(address(food));
        registry.setImplementation(address(accountImpl));
        program = new EBTProgram(address(registry), address(application));
    }

    function _configureContracts() internal {
        registry.transferOwnership(address(program));

        // Set fundraising params BEFORE initialize (required by security fix)
        program.setFundraisingPeriod(30 days);
        program.setCaps(1 ether, 100 ether);

        program.initialize(
            address(vault),
            protocolCaller,
            treasury,
            marketing,
            teamWallet,
            address(accountImpl),
            address(food)
        );

        vault.setEBTProgram(address(program));
        vault.setSwapRouter(address(swapRouter));
        vault.setTokenAddresses(address(weth), address(0), address(0));

        teamVesting.setTeamWallet(teamWallet);

        food.initialDistribution(
            address(vault),
            address(teamVesting),
            marketing,
            address(program)
        );

        application.setProgramAsAdmin(address(program));
    }

    function _generateTestUsers() internal {
        for (uint256 i = 0; i < NUM_TEST_USERS; i++) {
            address user = address(uint160(uint256(keccak256(abi.encodePacked("testuser", i)))));
            mintTestUsers.push(user);
            vm.deal(user, 10 ether);

            string memory userId = string(abi.encodePacked("USER_", vm.toString(i)));

            vm.prank(user);
            application.apply4EBT(
                string(abi.encodePacked("username_", vm.toString(i))),
                "https://example.com/pic.png",
                "@user",
                500,
                userId
            );

            string[] memory ids = new string[](1);
            ids[0] = userId;
            application.approveUsers(ids);
        }
    }

    // ============ Liquidity Provision Tests ============

    function testLiquidityProvisionAfterFundraising() public {
        console.log("\n=== TEST: LIQUIDITY PROVISION ===");

        // Mint some NFTs to raise ETH
        _mintMultipleNFTs(20);

        // Close fundraising
        vm.warp(block.timestamp + 31 days);
        program.closeFundraising();

        // Distribute ETH
        program.distributeETH();

        uint256 vaultETH = address(vault).balance;
        console.log("Vault ETH after distribution:", vaultETH / 1e18);

        // Add liquidity
        uint256 tokenAmount = 1_000_000 * 1e18; // 1M tokens
        uint256 ethAmount = vaultETH / 2; // Half the ETH

        vault.addLiquidity(address(swapRouter), tokenAmount, ethAmount);

        console.log("Liquidity added:");
        console.log("  Tokens:", tokenAmount / 1e18);
        console.log("  ETH:", ethAmount / 1e18);
    }

    function testMonthlyBuybackOperation() public {
        console.log("\n=== TEST: MONTHLY BUYBACK ===");

        // Mint NFTs to get ETH
        _mintMultipleNFTs(30);

        // Close and distribute
        vm.warp(block.timestamp + 31 days);
        program.closeFundraising();
        program.distributeETH();

        uint256 vaultETHBefore = address(vault).balance;
        console.log("Vault ETH before buyback:", vaultETHBefore / 1e18);

        // Execute monthly operation
        vault.monthlyOperation();

        console.log("Monthly operation executed");
        console.log("Next operation available:", block.timestamp + 30 days);

        // Try to run again (should fail)
        vm.expectRevert(LiquidityVault.TooSoonForMonthlyOp.selector);
        vault.monthlyOperation();

        // Warp 30 days and try again
        vm.warp(block.timestamp + 31 days);
        // Would need more ETH deposited to run again successfully
    }

    // ============ Marketing Vesting Tests ============

    function testMarketingVestingCreation() public {
        console.log("\n=== TEST: MARKETING VESTING ===");

        address kol1 = makeAddr("kol1");
        address kol2 = makeAddr("kol2");
        address ambassador = makeAddr("ambassador");

        // Create individual vesting
        address vesting1 = vault.createMarketingVesting(
            kol1,
            10_000_000 * 1e18, // 10M tokens
            90 days,
            true,
            "TopKOL",
            "KOL"
        );

        console.log("Created KOL vesting:", vesting1);
        console.log("  Beneficiary:", kol1);
        console.log("  Allocation:", 10_000_000, "tokens");

        // Create batch vesting
        address[] memory beneficiaries = new address[](2);
        beneficiaries[0] = kol2;
        beneficiaries[1] = ambassador;

        uint256[] memory allocations = new uint256[](2);
        allocations[0] = 5_000_000 * 1e18;
        allocations[1] = 2_000_000 * 1e18;

        string[] memory names = new string[](2);
        names[0] = "KOL2";
        names[1] = "Ambassador1";

        string[] memory types = new string[](2);
        types[0] = "KOL";
        types[1] = "Ambassador";

        vault.batchCreateMarketingVesting(
            beneficiaries,
            allocations,
            90 days,
            true,
            names,
            types
        );

        console.log("\nBatch vesting created for 2 partners");
        console.log("Total marketing vestings:", vault.getMarketingVestingCount());

        // Check total allocated
        (uint256 totalContracts, uint256 totalAllocated,) = vault.getMarketingStats();
        console.log("Total contracts:", totalContracts);
        console.log("Total allocated:", totalAllocated / 1e18, "tokens");
    }

    function testMarketingVestingClaimFlow() public {
        console.log("\n=== TEST: VESTING CLAIM FLOW ===");

        address beneficiary = makeAddr("beneficiary");
        uint256 allocation = 1_000_000 * 1e18; // 1M tokens

        address vestingAddr = vault.createMarketingVesting(
            beneficiary,
            allocation,
            90 days,
            false,
            "TestPartner",
            "KOL"
        );

        MarketingVesting vesting = MarketingVesting(vestingAddr);

        // Check initial state
        uint256 claimable = vesting.claimable();
        assertEq(claimable, 0, "Should not be claimable at start");
        console.log("Initial claimable:", claimable / 1e18);

        // Warp 45 days (50% vested)
        vm.warp(block.timestamp + 45 days);
        claimable = vesting.claimable();
        uint256 expected = allocation / 2;
        assertApproxEqAbs(claimable, expected, 1e18, "Should be ~50% claimable");
        console.log("After 45 days claimable:", claimable / 1e18);

        // Claim
        vm.prank(beneficiary);
        vesting.claim();

        uint256 balance = food.balanceOf(beneficiary);
        console.log("Beneficiary balance after claim:", balance / 1e18);

        // Warp to end
        vm.warp(block.timestamp + 50 days);
        claimable = vesting.claimable();
        console.log("Final claimable:", claimable / 1e18);

        vm.prank(beneficiary);
        vesting.claim();

        balance = food.balanceOf(beneficiary);
        assertApproxEqAbs(balance, allocation, 1e18, "Should have full allocation");
        console.log("Final beneficiary balance:", balance / 1e18);
    }

    function testMarketingVestingRevocation() public {
        console.log("\n=== TEST: VESTING REVOCATION ===");

        address beneficiary = makeAddr("beneficiary");
        uint256 allocation = 1_000_000 * 1e18;

        address vestingAddr = vault.createMarketingVesting(
            beneficiary,
            allocation,
            90 days,
            true, // revocable
            "RevocablePartner",
            "KOL"
        );

        // Warp 30 days (33% vested)
        vm.warp(block.timestamp + 30 days);

        // Beneficiary claims vested portion
        MarketingVesting vesting = MarketingVesting(vestingAddr);
        vm.prank(beneficiary);
        vesting.claim();

        uint256 beneficiaryBalance = food.balanceOf(beneficiary);
        console.log("Beneficiary claimed:", beneficiaryBalance / 1e18);

        // Vault balance before revoke
        uint256 vaultBefore = food.balanceOf(address(vault));

        // Revoke remaining
        vault.revokeMarketingVesting(vestingAddr);

        uint256 vaultAfter = food.balanceOf(address(vault));
        uint256 returned = vaultAfter - vaultBefore;
        console.log("Returned to vault:", returned / 1e18);

        // Verify total conservation
        assertApproxEqAbs(beneficiaryBalance + returned, allocation, 1e18, "Tokens should be conserved");
    }

    // ============ Team Vesting Tests ============

    function testTeamVestingSchedule() public {
        console.log("\n=== TEST: TEAM VESTING ===");

        // Use explicit timestamp to avoid Foundry quirks
        uint256 tgeTime = 1000;
        vm.warp(tgeTime);

        // Start TGE
        teamVesting.startTGE();
        console.log("TGE started");

        uint256 teamTotal = food.balanceOf(address(teamVesting));
        console.log("Team vesting balance:", teamTotal / 1e18);

        // Team claims TGE (1%)
        uint256 teamBalanceBefore = food.balanceOf(teamWallet);
        teamVesting.claim(); // Anyone can call, tokens go to teamWallet

        uint256 tgeClaimed = food.balanceOf(teamWallet) - teamBalanceBefore;
        console.log("TGE claimed (1%):", tgeClaimed / 1e18);

        // Month 1
        vm.warp(tgeTime + 31 days);
        teamBalanceBefore = food.balanceOf(teamWallet);
        teamVesting.claim();
        uint256 month1 = food.balanceOf(teamWallet) - teamBalanceBefore;
        console.log("Month 1 claimed:", month1 / 1e18);

        // Month 2
        vm.warp(tgeTime + 62 days);
        teamBalanceBefore = food.balanceOf(teamWallet);
        teamVesting.claim();
        uint256 month2 = food.balanceOf(teamWallet) - teamBalanceBefore;
        console.log("Month 2 claimed:", month2 / 1e18);

        // Month 3
        vm.warp(tgeTime + 93 days);
        teamBalanceBefore = food.balanceOf(teamWallet);
        teamVesting.claim();
        uint256 month3 = food.balanceOf(teamWallet) - teamBalanceBefore;
        console.log("Month 3 claimed:", month3 / 1e18);

        // Month 4
        vm.warp(tgeTime + 124 days);
        teamBalanceBefore = food.balanceOf(teamWallet);
        teamVesting.claim();
        uint256 month4 = food.balanceOf(teamWallet) - teamBalanceBefore;
        console.log("Month 4 claimed:", month4 / 1e18);

        uint256 totalClaimed = food.balanceOf(teamWallet);
        console.log("\nTotal team claimed:", totalClaimed / 1e18);
        console.log("Remaining in vesting:", food.balanceOf(address(teamVesting)) / 1e18);
    }

    // ============ Emergency Functions Tests ============

    function testEmergencyWithdrawTokens() public {
        console.log("\n=== TEST: EMERGENCY WITHDRAW TOKENS ===");

        uint256 vaultBalance = food.balanceOf(address(vault));
        console.log("Vault balance before:", vaultBalance / 1e18);

        address emergencyRecipient = makeAddr("emergency");
        uint256 withdrawAmount = 1_000_000 * 1e18;

        vault.emergencyWithdrawTokens(emergencyRecipient, withdrawAmount);

        assertEq(food.balanceOf(emergencyRecipient), withdrawAmount, "Emergency withdraw failed");
        console.log("Withdrawn to emergency:", withdrawAmount / 1e18);
    }

    function testEmergencyWithdrawETH() public {
        console.log("\n=== TEST: EMERGENCY WITHDRAW ETH ===");

        // Mint to get ETH in vault
        _mintMultipleNFTs(10);

        vm.warp(block.timestamp + 31 days);
        program.closeFundraising();
        program.distributeETH();

        uint256 vaultETH = address(vault).balance;
        console.log("Vault ETH before:", vaultETH / 1e18);

        address payable emergencyRecipient = payable(makeAddr("emergency"));
        uint256 withdrawAmount = vaultETH / 2;

        vault.emergencyWithdrawETH(emergencyRecipient, withdrawAmount);

        assertEq(emergencyRecipient.balance, withdrawAmount, "Emergency ETH withdraw failed");
        console.log("Withdrawn ETH:", withdrawAmount / 1e18);
    }

    // ============ Helper Functions ============

    function _mintMultipleNFTs(uint256 count) internal {
        // Start at block 5 to ensure we're past initial block 0
        uint256 currentBlock = 5;
        vm.roll(currentBlock);

        for (uint256 i = 0; i < count && i < mintTestUsers.length; i++) {
            // Move forward 4 blocks for each mint (threeBlocksAfterLastMint modifier)
            currentBlock += 4;
            vm.roll(currentBlock);

            string memory userId = string(abi.encodePacked("USER_", vm.toString(i)));
            vm.prank(mintTestUsers[i]);
            program.mint{value: 0.1 ether}(userId);
        }
    }
}
