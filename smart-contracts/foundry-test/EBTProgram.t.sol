// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";
import "../contracts/EBTProgram.sol";
import "../contracts/ERC6551Registry.sol";
import "../contracts/ERC6551Account.sol";
import "../contracts/FoodStamps.sol";
import "../contracts/LiquidityVault.sol";
import "../contracts/TeamVesting.sol";
import "../contracts/EBTApplication.sol";

contract EBTProgramTest is Test {
    EBTProgram internal program;
    ERC6551Registry internal registry;
    ERC6551Account internal accountImpl;
    FoodStamps internal food;
    LiquidityVault internal vault;
    TeamVesting internal vesting;
    EBTApplication internal app;

    address internal user = address(0xBEEF);
    address internal protocolCaller = address(0xCAFE);
    address internal treasury = address(0x1234);
    address internal marketing = address(0xDEAD);
    address internal teamWallet = address(0xFEED);
    string internal userId = "user1";

    uint256 internal constant MIN_PRICE = 0.02 ether;
    uint256 internal constant MAX_PRICE = 2 ether;
    uint256 internal constant BASE_TOKENS = 20_000 * 1e18;

    function setUp() public {
        app = new EBTApplication();
        food = new FoodStamps();
        registry = new ERC6551Registry();
        accountImpl = new ERC6551Account();
        vault = new LiquidityVault(address(food));
        vesting = new TeamVesting(address(food));

        program = new EBTProgram(address(registry), address(app));

        // Set implementation directly on registry before transferring ownership
        registry.setImplementation(address(accountImpl));
        registry.transferOwnership(address(program));

        // Initialize the contract with all required addresses
        program.initialize(
            address(vault),
            protocolCaller,
            treasury,
            marketing,
            teamWallet,
            address(accountImpl),
            address(food)
        );

        // Set up vault
        vault.setEBTProgram(address(program));

        // Initial distribution - send tokens to vault
        food.initialDistribution(
            address(vault),
            address(vesting),
            marketing,
            address(program)
        );

        app.setProgramAsAdmin(address(program));

        // prepare user and approval
        vm.deal(user, 10 ether);
        vm.prank(user);
        app.apply4EBT("user", "pic", "tw", 100, userId);
        app.approveUsers(_single(userId));

        // Set user score for claims (500 = 50% bonus)
        app.setUserScore(userId, 500);
    }

    function testMintCreatesAccountAndDistributesTokens() public {
        vm.roll(5);

        vm.prank(user);
        program.mint{value: MIN_PRICE}(userId);

        assertEq(program.ownerOf(1), user, "owner should be minter");
        assertEq(address(program).balance, MIN_PRICE, "contract should hold mint price");

        address tba = program.getTBA(1);
        assertTrue(tba != address(0), "TBA should exist");

        // Verify token distribution
        assertEq(food.balanceOf(tba), BASE_TOKENS, "TBA should receive base tokens");
    }

    function testMintWithDynamicPricing() public {
        // Test various price points
        uint256[] memory prices = new uint256[](4);
        prices[0] = 0.02 ether;   // Min - 20,000 tokens
        prices[1] = 0.1 ether;    // 100,000 tokens
        prices[2] = 0.5 ether;    // 500,000 tokens
        prices[3] = 2 ether;      // Max - 2,000,000 tokens

        // Use explicit block counter to avoid Foundry vm.roll quirk
        uint256 currentBlock = 5;

        for (uint256 i = 0; i < prices.length; i++) {
            // Use unique user IDs that won't conflict
            string memory uid = string(abi.encodePacked("dynuser", vm.toString(i)));
            address userAddr = address(uint160(0x2000 + i));

            vm.deal(userAddr, 10 ether);
            vm.prank(userAddr);
            app.apply4EBT(uid, "pic", "tw", 100, uid);
            app.approveUsers(_single(uid));

            currentBlock += 5;
            vm.roll(currentBlock);
            vm.prank(userAddr);
            program.mint{value: prices[i]}(uid);

            address tba = program.getTBA(i + 1);
            uint256 expectedTokens = (prices[i] * BASE_TOKENS) / MIN_PRICE;
            assertEq(food.balanceOf(tba), expectedTokens, "Token amount should scale with price");
        }
    }

    function testMintRequiresApproval() public {
        string memory notApproved = "nope";
        vm.deal(user, 1 ether);
        vm.roll(5);  // Need to be past block 0 for mint
        vm.prank(user);
        vm.expectRevert(EBTProgram.NotApproved.selector);
        program.mint{value: MIN_PRICE}(notApproved);
    }

    function testMintEnforcesPriceRange() public {
        vm.deal(user, 10 ether);
        vm.roll(5);

        // Below minimum
        vm.prank(user);
        vm.expectRevert(EBTProgram.PriceBelowMinimum.selector);
        program.mint{value: MIN_PRICE - 1}(userId);

        // Above maximum
        vm.prank(user);
        vm.expectRevert(EBTProgram.PriceAboveMaximum.selector);
        program.mint{value: MAX_PRICE + 1}(userId);
    }

    function testMintEnforcesPrecision() public {
        vm.deal(user, 10 ether);
        vm.roll(5);

        // Invalid precision (not multiple of 0.001 ETH)
        vm.prank(user);
        vm.expectRevert(EBTProgram.InvalidPricePrecision.selector);
        program.mint{value: 0.0215 ether}(userId);
    }

    function testSecondMintSameAddressFails() public {
        vm.roll(5);
        vm.prank(user);
        program.mint{value: MIN_PRICE}(userId);

        vm.roll(block.number + 5);
        vm.prank(user);
        vm.expectRevert(EBTProgram.AlreadyMinted.selector);
        program.mint{value: MIN_PRICE}(userId);
    }

    function testBlacklistedCannotMint() public {
        address badUser = address(0xBAD);
        vm.deal(badUser, 1 ether);
        vm.prank(badUser);
        app.apply4EBT("bad", "pic", "tw", 100, "bad");
        app.approveUsers(_single("bad"));
        program.setBlacklistStatus(_addrArray(badUser), true);

        vm.roll(5);
        vm.prank(badUser);
        vm.expectRevert(EBTProgram.Blacklisted.selector);
        program.mint{value: MIN_PRICE}("bad");
    }

    function testHonorsThreeBlockGapBetweenMints() public {
        vm.roll(5);
        vm.prank(user);
        program.mint{value: MIN_PRICE}(userId);

        address user2 = address(0xA11CE);
        string memory userId2 = "user2";
        vm.deal(user2, 1 ether);
        vm.prank(user2);
        app.apply4EBT("user2", "pic", "tw", 100, userId2);
        app.approveUsers(_single(userId2));

        vm.roll(program.lastMintBlock() + 1);
        vm.prank(user2);
        vm.expectRevert(bytes("Wait 3 blocks"));
        program.mint{value: MIN_PRICE}(userId2);

        vm.roll(program.lastMintBlock() + 4);
        vm.prank(user2);
        program.mint{value: MIN_PRICE}(userId2);
        assertEq(program.ownerOf(2), user2);
    }

    function testProtocolOnlyClaimWithScoreMultiplier() public {
        vm.roll(5);
        vm.prank(user);
        program.mint{value: MIN_PRICE}(userId);

        uint256 mintedAt = block.timestamp;
        address tba = program.getTBA(1);
        uint256 initialBalance = food.balanceOf(tba);

        // Wait 30 days
        vm.warp(mintedAt + 31 days);

        // Non-protocol caller should fail
        vm.prank(user);
        vm.expectRevert(EBTProgram.OnlyProtocol.selector);
        program.claim(1);

        // Protocol caller - score 500 is already set in setUp
        vm.prank(protocolCaller);
        program.claim(1);

        // Base tokens + 50% bonus (score 500 = 50%)
        uint256 expectedClaim = BASE_TOKENS + (BASE_TOKENS * 500 / 1000);
        assertEq(food.balanceOf(tba), initialBalance + expectedClaim, "Should receive base + bonus");

        (,uint256 claimCount,,,,) = program.tokenData(1);
        assertEq(claimCount, 1, "Claim count should be 1");
    }

    function testMaxThreeClaims() public {
        vm.roll(5);
        vm.prank(user);
        program.mint{value: MIN_PRICE}(userId);

        uint256 mintedAt = block.timestamp;
        for (uint256 i = 0; i < 3; i++) {
            vm.warp(mintedAt + (31 days * (i + 1)));
            vm.prank(protocolCaller);
            program.claim(1);
        }

        vm.warp(mintedAt + 200 days);
        vm.prank(protocolCaller);
        vm.expectRevert(EBTProgram.ClaimLimitReached.selector);
        program.claim(1);
    }

    function testReapplicationFlow() public {
        vm.roll(5);
        vm.prank(user);
        program.mint{value: MIN_PRICE}(userId);

        uint256 mintedAt = block.timestamp;

        // Complete 3 claims
        for (uint256 i = 0; i < 3; i++) {
            vm.warp(mintedAt + (31 days * (i + 1)));
            vm.prank(protocolCaller);
            program.claim(1);
        }

        // Request reapplication
        vm.prank(user);
        program.reapply(1);

        (,,,,EBTProgram.ReapplicationStatus status,) = program.tokenData(1);
        assertEq(uint(status), uint(EBTProgram.ReapplicationStatus.PENDING));

        // Admin approves with reduced base amount
        uint256 newBaseAmount = 10_000 * 1e18;
        program.approveReapplication(1, newBaseAmount);

        (,uint256 claimCount,,,EBTProgram.ReapplicationStatus newStatus,) = program.tokenData(1);
        assertEq(claimCount, 0, "Claim count should be reset");
        assertEq(uint(newStatus), uint(EBTProgram.ReapplicationStatus.APPROVED));

        // Can now claim again
        vm.warp(block.timestamp + 31 days);
        vm.prank(protocolCaller);
        program.claim(1);

        (,uint256 finalClaimCount,,,,) = program.tokenData(1);
        assertEq(finalClaimCount, 1, "Should have 1 claim after reapplication");
    }

    function testHardCapEnforced() public {
        // Create a fresh program instance with hard cap = soft cap = MIN_PRICE
        EBTApplication newApp = new EBTApplication();
        FoodStamps newFood = new FoodStamps();
        ERC6551Registry newRegistry = new ERC6551Registry();
        ERC6551Account newAccountImpl = new ERC6551Account();
        LiquidityVault newVault = new LiquidityVault(address(newFood));
        TeamVesting newVesting = new TeamVesting(address(newFood));

        EBTProgram newProgram = new EBTProgram(address(newRegistry), address(newApp));

        newRegistry.setImplementation(address(newAccountImpl));
        newRegistry.transferOwnership(address(newProgram));

        // Set caps BEFORE initialize (as required by security fix)
        newProgram.setCaps(MIN_PRICE, MIN_PRICE);

        newProgram.initialize(
            address(newVault),
            protocolCaller,
            treasury,
            marketing,
            teamWallet,
            address(newAccountImpl),
            address(newFood)
        );

        newVault.setEBTProgram(address(newProgram));
        newFood.initialDistribution(
            address(newVault),
            address(newVesting),
            marketing,
            address(newProgram)
        );

        newApp.setProgramAsAdmin(address(newProgram));

        // Prepare first user
        string memory userId1 = "hardcap_user1";
        address user1 = address(0x3333);
        vm.deal(user1, 1 ether);
        vm.prank(user1);
        newApp.apply4EBT("user1", "pic", "tw", 100, userId1);
        newApp.approveUsers(_single(userId1));

        vm.roll(5);
        vm.prank(user1);
        newProgram.mint{value: MIN_PRICE}(userId1);

        // Verify fundraising auto-closed when hard cap was reached
        assertTrue(newProgram.fundraisingClosed(), "Fundraising should auto-close at hard cap");

        address user2 = address(0x2222);
        string memory userId2 = "hardcap_user2";
        vm.deal(user2, 1 ether);
        vm.prank(user2);
        newApp.apply4EBT("user2", "pic", "tw", 100, userId2);
        newApp.approveUsers(_single(userId2));

        vm.roll(block.number + 5);
        vm.prank(user2);
        // After hard cap is hit, fundraising is closed so mints fail with "Fundraising closed"
        vm.expectRevert("Fundraising closed");
        newProgram.mint{value: MIN_PRICE}(userId2);
    }

    function testETHDistributionAfterFundraising() public {
        // Create a new program instance with custom fundraising period
        EBTApplication newApp = new EBTApplication();
        FoodStamps newFood = new FoodStamps();
        ERC6551Registry newRegistry = new ERC6551Registry();
        ERC6551Account newAccountImpl = new ERC6551Account();
        LiquidityVault newVault = new LiquidityVault(address(newFood));
        TeamVesting newVesting = new TeamVesting(address(newFood));

        EBTProgram newProgram = new EBTProgram(address(newRegistry), address(newApp));

        newRegistry.setImplementation(address(newAccountImpl));
        newRegistry.transferOwnership(address(newProgram));

        // Set fundraising period BEFORE initialize (as required by security fix)
        newProgram.setFundraisingPeriod(7 days);
        newProgram.setCaps(MIN_PRICE, 10 ether);

        newProgram.initialize(
            address(newVault),
            protocolCaller,
            treasury,
            marketing,
            teamWallet,
            address(newAccountImpl),
            address(newFood)
        );

        newVault.setEBTProgram(address(newProgram));
        newFood.initialDistribution(
            address(newVault),
            address(newVesting),
            marketing,
            address(newProgram)
        );

        newApp.setProgramAsAdmin(address(newProgram));

        // Prepare user
        vm.deal(user, 10 ether);
        vm.prank(user);
        newApp.apply4EBT("user", "pic", "tw", 100, userId);
        newApp.approveUsers(_single(userId));

        // Mint to reach soft cap
        vm.roll(5);
        vm.prank(user);
        newProgram.mint{value: MIN_PRICE}(userId);

        // End fundraising
        vm.warp(block.timestamp + 8 days);
        newProgram.closeFundraising();

        assertTrue(newProgram.fundraisingClosed(), "Fundraising should be closed");

        // Distribute ETH
        uint256 treasuryBefore = treasury.balance;
        uint256 marketingBefore = marketing.balance;
        uint256 teamBefore = teamWallet.balance;
        uint256 vaultBefore = address(newVault).balance;

        newProgram.distributeETH();

        // Verify distributions (65/20/10/5)
        assertGt(address(newVault).balance, vaultBefore, "Vault should receive 65%");
        assertGt(marketing.balance, marketingBefore, "Marketing should receive 20%");
        assertGt(treasury.balance, treasuryBefore, "Treasury should receive 10%");
        assertGt(teamWallet.balance, teamBefore, "Team should receive 5%");
    }

    function testInitializationRequired() public {
        // Create a new uninitialized program
        EBTProgram uninitProgram = new EBTProgram(address(registry), address(app));

        vm.deal(user, 1 ether);
        vm.roll(5);
        vm.prank(user);
        vm.expectRevert(EBTProgram.NotInitialized.selector);
        uninitProgram.mint{value: MIN_PRICE}(userId);
    }

    function testCannotInitializeTwice() public {
        vm.expectRevert(EBTProgram.AlreadyInitialized.selector);
        program.initialize(
            address(vault),
            protocolCaller,
            treasury,
            marketing,
            teamWallet,
            address(accountImpl),
            address(food)
        );
    }

    function _single(string memory id) internal pure returns (string[] memory ids) {
        ids = new string[](1);
        ids[0] = id;
    }

    function _addrArray(address a) internal pure returns (address[] memory arr) {
        arr = new address[](1);
        arr[0] = a;
    }
}
