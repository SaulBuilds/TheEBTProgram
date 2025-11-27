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

/// @title Mock Uniswap V3 Router for realistic LP simulation
contract MockUniswapV3Router {
    event LiquidityProvided(address token0, address token1, uint256 amount0, uint256 amount1, address pool);
    event SwapExecuted(address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut);

    uint256 public constant FOOD_PER_ETH = 100_000 * 1e18;

    mapping(address => mapping(address => address)) public pools;
    uint256 public poolCount;

    function createPool(address token0, address token1, uint24 fee) external returns (address pool) {
        pool = address(uint160(uint256(keccak256(abi.encodePacked(token0, token1, fee, poolCount++)))));
        pools[token0][token1] = pool;
        pools[token1][token0] = pool;
        return pool;
    }

    function addLiquidity(
        address token0,
        address token1,
        uint256 amount0,
        uint256 amount1
    ) external payable returns (address pool) {
        pool = pools[token0][token1];
        if (pool == address(0)) {
            pool = address(uint160(uint256(keccak256(abi.encodePacked(token0, token1, poolCount++)))));
            pools[token0][token1] = pool;
            pools[token1][token0] = pool;
        }
        emit LiquidityProvided(token0, token1, amount0, amount1, pool);
        return pool;
    }

    function swap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut
    ) external payable returns (uint256 amountOut) {
        if (tokenIn == address(0)) {
            amountOut = (amountIn * FOOD_PER_ETH) / 1e18;
        } else {
            amountOut = (amountIn * 1e18) / FOOD_PER_ETH;
        }
        require(amountOut >= minAmountOut, "Slippage exceeded");
        emit SwapExecuted(tokenIn, tokenOut, amountIn, amountOut);
        return amountOut;
    }

    receive() external payable {}
}

/// @title Mock WETH for testing
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

/// @title Deployment Scenario Tests
/// @notice Tests various fundraising scenarios: soft cap failure, low liquidity, and blowout
contract DeploymentScenarios is Test {
    // Core Contracts
    EBTProgram public program;
    ERC6551Registry public registry;
    ERC6551Account public accountImpl;
    FoodStamps public food;
    LiquidityVault public vault;
    TeamVesting public teamVesting;
    EBTApplication public application;

    // Mock DEX
    MockUniswapV3Router public router;
    MockWETH public weth;

    // Test Accounts
    address public owner;
    address public protocolCaller;
    address public treasury;
    address public marketing;
    address public teamWallet;

    // Scenario tracking
    struct ScenarioReport {
        string name;
        uint256 totalRaised;
        uint256 softCap;
        uint256 hardCap;
        uint256 numMinters;
        uint256 avgContribution;
        bool softCapReached;
        bool ethDistributed;
        uint256 liquidityETH;
        uint256 marketingETH;
        uint256 treasuryETH;
        uint256 teamETH;
        uint256 tokensDistributed;
        uint256 gasUsed;
    }

    ScenarioReport[] public reports;

    function setUp() public {
        owner = address(this);
        protocolCaller = makeAddr("protocolCaller");
        treasury = makeAddr("treasury");
        marketing = makeAddr("marketing");
        teamWallet = makeAddr("teamWallet");

        router = new MockUniswapV3Router();
        weth = new MockWETH();
    }

    function _deployFreshContracts() internal {
        application = new EBTApplication();
        food = new FoodStamps();
        registry = new ERC6551Registry();
        accountImpl = new ERC6551Account();
        vault = new LiquidityVault(address(food));
        teamVesting = new TeamVesting(address(food));
        registry.setImplementation(address(accountImpl));
        program = new EBTProgram(address(registry), address(application));
    }

    function _configureContracts(uint256 softCap, uint256 hardCap) internal {
        registry.transferOwnership(address(program));

        // Set fundraising params BEFORE initialize (required by security fix)
        program.setFundraisingPeriod(30 days);
        program.setCaps(softCap, hardCap);

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
        vault.setSwapRouter(address(router));
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

    function _generateUsers(uint256 count) internal returns (address[] memory users, string[] memory userIds) {
        users = new address[](count);
        userIds = new string[](count);

        for (uint256 i = 0; i < count; i++) {
            users[i] = address(uint160(uint256(keccak256(abi.encodePacked("scenario_user", i, block.timestamp)))));
            userIds[i] = string(abi.encodePacked("SCENARIO_USER_", vm.toString(i)));

            vm.deal(users[i], 10 ether);

            vm.prank(users[i]);
            application.apply4EBT(
                string(abi.encodePacked("user_", vm.toString(i))),
                "https://example.com/pic.png",
                "@user",
                500,
                userIds[i]
            );

            string[] memory ids = new string[](1);
            ids[0] = userIds[i];
            application.approveUsers(ids);
        }

        return (users, userIds);
    }

    // ============================================================
    // SCENARIO 1: SOFT CAP FAILURE (< 20 ETH raised)
    // ============================================================

    function testScenario_SoftCapFailure() public {
        console.log("");
        console.log("================================================================================");
        console.log("  SCENARIO 1: SOFT CAP FAILURE");
        console.log("  Target: Raise < 20 ETH (soft cap), test refund mechanism");
        console.log("================================================================================");

        uint256 gasStart = gasleft();

        _deployFreshContracts();
        _configureContracts(20 ether, 2000 ether);

        console.log("");
        console.log("--- Configuration ---");
        console.log("Soft Cap (ETH):", program.softCap() / 1e18);
        console.log("Hard Cap (ETH):", program.hardCap() / 1e18);

        (address[] memory users, string[] memory userIds) = _generateUsers(10);

        console.log("");
        console.log("--- Minting Phase ---");
        uint256 totalContributed = 0;

        // Use explicit block counter to avoid Foundry vm.roll quirk
        uint256 currentBlock = 5;
        vm.roll(currentBlock);

        for (uint256 i = 0; i < users.length; i++) {
            currentBlock += 4;
            vm.roll(currentBlock);
            uint256 contribution = 0.5 ether + (uint256(keccak256(abi.encodePacked(i))) % 0.5 ether);
            contribution = (contribution / 0.001 ether) * 0.001 ether;
            if (contribution < 0.02 ether) contribution = 0.02 ether;
            if (contribution > 2 ether) contribution = 2 ether;

            vm.prank(users[i]);
            program.mint{value: contribution}(userIds[i]);
            totalContributed += contribution;
        }

        console.log("Mints completed:", users.length);
        console.log("Total raised (ETH):", totalContributed / 1e18);

        console.log("");
        console.log("--- Fundraising Results ---");
        console.log("Total Raised (ETH):", program.totalRaised() / 1e18);
        console.log("Soft Cap (ETH):", program.softCap() / 1e18);
        console.log("Soft Cap Reached:", program.totalRaised() >= program.softCap() ? 1 : 0);

        vm.warp(block.timestamp + 31 days);
        program.closeFundraising();

        console.log("Fundraising Closed:", program.fundraisingClosed() ? 1 : 0);

        console.log("");
        console.log("--- Distribution Attempt ---");
        vm.expectRevert(EBTProgram.SoftCapNotReached.selector);
        program.distributeETH();
        console.log("ETH Distribution blocked: Soft cap not reached (as expected)");

        uint256 contractBalance = address(program).balance;
        console.log("Contract ETH Balance:", contractBalance / 1e18);

        console.log("");
        console.log("--- Emergency Recovery ---");
        console.log("Owner can use emergencyWithdrawETH to refund contributors");

        uint256 gasUsed = gasStart - gasleft();

        ScenarioReport memory report = ScenarioReport({
            name: "Soft Cap Failure",
            totalRaised: program.totalRaised(),
            softCap: program.softCap(),
            hardCap: program.hardCap(),
            numMinters: users.length,
            avgContribution: totalContributed / users.length,
            softCapReached: false,
            ethDistributed: false,
            liquidityETH: 0,
            marketingETH: 0,
            treasuryETH: 0,
            teamETH: 0,
            tokensDistributed: vault.totalDistributed(),
            gasUsed: gasUsed
        });
        reports.push(report);

        _printScenarioReport(report);
    }

    // ============================================================
    // SCENARIO 2: LOW LIQUIDITY (20-30 ETH raised)
    // ============================================================

    function testScenario_LowLiquidity() public {
        console.log("");
        console.log("================================================================================");
        console.log("  SCENARIO 2: LOW LIQUIDITY SALE");
        console.log("  Target: Raise 20-30 ETH, just above soft cap");
        console.log("================================================================================");

        _deployFreshContracts();
        _configureContracts(20 ether, 2000 ether);

        console.log("");
        console.log("--- Configuration ---");
        console.log("Soft Cap (ETH):", program.softCap() / 1e18);
        console.log("Hard Cap (ETH):", program.hardCap() / 1e18);

        (address[] memory users, string[] memory userIds) = _generateUsers(30);

        console.log("");
        console.log("--- Minting Phase ---");
        (uint256 totalContributed, uint256 minterCount) = _executeLowLiquidityMints(users, userIds);

        console.log("Minters:", minterCount);
        console.log("Total Raised (ETH):", totalContributed / 1e18);

        console.log("");
        console.log("--- Fundraising Results ---");
        console.log("Total Raised (ETH):", program.totalRaised() / 1e18);
        console.log("Soft Cap Reached:", program.totalRaised() >= program.softCap() ? 1 : 0);

        vm.warp(block.timestamp + 31 days);
        program.closeFundraising();

        (uint256 liquidityAmount, uint256 marketingAmount, uint256 treasuryAmount, uint256 teamAmount) = _distributeAndLog();

        console.log("");
        console.log("--- Liquidity Provision ---");
        uint256 lpTokens = 1_000_000 * 1e18;
        uint256 lpEth = liquidityAmount / 2;

        console.log("Adding FOOD tokens:", lpTokens / 1e18);
        console.log("Adding ETH:", lpEth / 1e18);

        vault.addLiquidity(address(router), lpTokens, lpEth);

        console.log("Remaining vault ETH:", address(vault).balance / 1e18);

        console.log("");
        console.log("--- Monthly Claims (Month 1) ---");
        vm.warp(block.timestamp + 31 days);

        uint256 claimCount = _processClaims(minterCount, 10);
        console.log("Claims processed:", claimCount);
        console.log("Total tokens distributed:", vault.totalDistributed() / 1e18);

        ScenarioReport memory report = ScenarioReport({
            name: "Low Liquidity (20-30 ETH)",
            totalRaised: program.totalRaised(),
            softCap: program.softCap(),
            hardCap: program.hardCap(),
            numMinters: minterCount,
            avgContribution: totalContributed / minterCount,
            softCapReached: true,
            ethDistributed: true,
            liquidityETH: liquidityAmount,
            marketingETH: marketingAmount,
            treasuryETH: treasuryAmount,
            teamETH: teamAmount,
            tokensDistributed: vault.totalDistributed(),
            gasUsed: 0
        });
        reports.push(report);

        _printScenarioReport(report);
    }

    function _executeLowLiquidityMints(address[] memory users, string[] memory userIds) internal returns (uint256 totalContributed, uint256 minterCount) {
        // Use explicit block counter to avoid Foundry vm.roll quirk
        uint256 currentBlock = 5;
        vm.roll(currentBlock);

        for (uint256 i = 0; i < users.length && totalContributed < 30 ether; i++) {
            currentBlock += 4;
            vm.roll(currentBlock);

            uint256 contribution = 0.5 ether + (uint256(keccak256(abi.encodePacked(i, "low"))) % 1 ether);
            contribution = (contribution / 0.001 ether) * 0.001 ether;
            if (contribution < 0.02 ether) contribution = 0.02 ether;
            if (contribution > 2 ether) contribution = 2 ether;

            if (totalContributed + contribution > 30 ether) {
                contribution = 30 ether - totalContributed;
                contribution = (contribution / 0.001 ether) * 0.001 ether;
            }

            if (contribution >= 0.02 ether) {
                vm.prank(users[i]);
                program.mint{value: contribution}(userIds[i]);
                totalContributed += contribution;
                minterCount++;
            }
        }
        return (totalContributed, minterCount);
    }

    function _distributeAndLog() internal returns (uint256 liquidityAmount, uint256 marketingAmount, uint256 treasuryAmount, uint256 teamAmount) {
        uint256 treasuryBefore = treasury.balance;
        uint256 marketingBefore = marketing.balance;
        uint256 teamBefore = teamWallet.balance;
        uint256 vaultBefore = address(vault).balance;

        console.log("");
        console.log("--- ETH Distribution ---");
        program.distributeETH();

        liquidityAmount = address(vault).balance - vaultBefore;
        marketingAmount = marketing.balance - marketingBefore;
        treasuryAmount = treasury.balance - treasuryBefore;
        teamAmount = teamWallet.balance - teamBefore;

        console.log("Liquidity Vault (65%) ETH:", liquidityAmount / 1e18);
        console.log("Marketing (20%) ETH:", marketingAmount / 1e18);
        console.log("Treasury (10%) ETH:", treasuryAmount / 1e18);
        console.log("Team (5%) ETH:", teamAmount / 1e18);

        return (liquidityAmount, marketingAmount, treasuryAmount, teamAmount);
    }

    function _processClaims(uint256 maxMinters, uint256 limit) internal returns (uint256 claimCount) {
        for (uint256 i = 0; i < maxMinters && i < limit; i++) {
            uint256 tokenId = i + 1;
            if (program.exists(tokenId)) {
                vm.prank(protocolCaller);
                program.claim(tokenId);
                claimCount++;
            }
        }
        return claimCount;
    }

    // ============================================================
    // SCENARIO 3: BLOWOUT / OVERSUBSCRIBED (Near Hard Cap)
    // ============================================================

    function testScenario_Blowout() public {
        console.log("");
        console.log("================================================================================");
        console.log("  SCENARIO 3: BLOWOUT / OVERSUBSCRIBED SALE");
        console.log("  Target: Raise ~500 ETH (approaching hard cap)");
        console.log("================================================================================");

        _deployFreshContracts();
        _configureContracts(20 ether, 1000 ether);

        console.log("");
        console.log("--- Configuration ---");
        console.log("Soft Cap (ETH):", program.softCap() / 1e18);
        console.log("Hard Cap (ETH):", program.hardCap() / 1e18);

        (address[] memory users, string[] memory userIds) = _generateUsers(300);

        console.log("");
        console.log("--- Minting Phase (High Demand) ---");
        (uint256 totalContributed, uint256 minterCount, uint256 rejectedCount) = _executeBlowoutMints(users, userIds);

        console.log("");
        console.log("--- Fundraising Results ---");
        console.log("Total Raised (ETH):", program.totalRaised() / 1e18);
        console.log("Hard Cap (ETH):", program.hardCap() / 1e18);
        console.log("Capacity Used (%):", (program.totalRaised() * 100) / program.hardCap());
        console.log("Number of Minters:", minterCount);
        console.log("Rejected (hard cap):", rejectedCount);

        // Check if fundraising was auto-closed when hard cap was reached
        if (program.fundraisingClosed()) {
            console.log("Fundraising auto-closed: YES (hard cap reached)");
        } else {
            // If not auto-closed (didn't hit exact hard cap), manually close after period
            console.log("Fundraising auto-closed: NO (below hard cap)");
            vm.warp(block.timestamp + 31 days);
            program.closeFundraising();
        }

        (uint256 liquidityAmount, uint256 marketingAmount, uint256 treasuryAmount, uint256 teamAmount) = _distributeAndLog();

        _setupBlowoutLiquidity(liquidityAmount);

        _setupMarketingVestings();

        console.log("");
        console.log("--- Mass Claims Processing ---");
        vm.warp(block.timestamp + 31 days);

        uint256 claimCount = _processClaims(minterCount, 100);
        console.log("Claims processed:", claimCount);
        console.log("Total tokens distributed:", vault.totalDistributed() / 1e18);

        _executeMonthlyOps();

        ScenarioReport memory report = ScenarioReport({
            name: "Blowout/Oversubscribed",
            totalRaised: program.totalRaised(),
            softCap: program.softCap(),
            hardCap: program.hardCap(),
            numMinters: minterCount,
            avgContribution: minterCount > 0 ? totalContributed / minterCount : 0,
            softCapReached: true,
            ethDistributed: true,
            liquidityETH: liquidityAmount,
            marketingETH: marketingAmount,
            treasuryETH: treasuryAmount,
            teamETH: teamAmount,
            tokensDistributed: vault.totalDistributed(),
            gasUsed: 0
        });
        reports.push(report);

        _printScenarioReport(report);

        console.log("");
        console.log("--- BLOWOUT SUMMARY ---");
        console.log("Liquidity ETH:", liquidityAmount * 70 / 100 / 1e18);
        console.log("Marketing Vestings Created:", vault.getMarketingVestingCount());
    }

    function _executeBlowoutMints(address[] memory users, string[] memory userIds) internal returns (uint256 totalContributed, uint256 minterCount, uint256 rejectedCount) {
        // Use explicit block counter to avoid Foundry vm.roll quirk
        uint256 currentBlock = 5;
        vm.roll(currentBlock);

        for (uint256 i = 0; i < users.length; i++) {
            currentBlock += 4;
            vm.roll(currentBlock);

            uint256 contribution;
            uint256 rand = uint256(keccak256(abi.encodePacked(i, "blowout"))) % 100;

            if (rand < 30) {
                contribution = 2 ether;
            } else if (rand < 60) {
                contribution = 1 ether;
            } else if (rand < 80) {
                contribution = 0.5 ether;
            } else {
                contribution = 0.1 ether;
            }

            if (totalContributed + contribution > program.hardCap()) {
                if (program.hardCap() > totalContributed) {
                    contribution = program.hardCap() - totalContributed;
                    contribution = (contribution / 0.001 ether) * 0.001 ether;
                } else {
                    rejectedCount++;
                    continue;
                }
            }

            if (contribution >= 0.02 ether && contribution <= 2 ether) {
                vm.prank(users[i]);
                try program.mint{value: contribution}(userIds[i]) {
                    totalContributed += contribution;
                    minterCount++;
                } catch {
                    rejectedCount++;
                }
            }

            if (totalContributed >= program.hardCap()) {
                console.log("HARD CAP REACHED at user:", i + 1);
                break;
            }
        }
        return (totalContributed, minterCount, rejectedCount);
    }

    function _setupBlowoutLiquidity(uint256 liquidityAmount) internal {
        console.log("");
        console.log("--- Liquidity Pool Creation (Automated) ---");

        address foodEthPool = router.createPool(address(food), address(weth), 3000);
        console.log("FOOD/ETH Pool created");

        uint256 lpTokens = 50_000_000 * 1e18;
        uint256 lpEth = liquidityAmount * 70 / 100;

        console.log("Initial LP FOOD tokens:", lpTokens / 1e18);
        console.log("Initial LP ETH:", lpEth / 1e18);
        console.log("Initial Price (FOOD per ETH):", lpTokens / lpEth);

        vault.addLiquidity(address(router), lpTokens, lpEth);
        vault.setPoolAddresses(foodEthPool, address(0), address(0));
    }

    function _setupMarketingVestings() internal {
        console.log("");
        console.log("--- Marketing Vesting Setup ---");
        address kol1 = makeAddr("topKOL");
        address kol2 = makeAddr("megaInfluencer");

        vault.createMarketingVesting(kol1, 100_000_000 * 1e18, 90 days, true, "CryptoKing", "KOL");
        console.log("KOL Vesting 1 created");

        vault.createMarketingVesting(kol2, 50_000_000 * 1e18, 90 days, true, "MoonShot", "KOL");
        console.log("KOL Vesting 2 created");
    }

    function _executeMonthlyOps() internal {
        console.log("");
        console.log("--- Monthly Buyback Operation ---");
        console.log("Vault ETH for buybacks:", address(vault).balance / 1e18);

        vault.monthlyOperation();
        console.log("Monthly operation executed");

        console.log("");
        console.log("--- Team Vesting Status ---");
        teamVesting.startTGE();
        teamVesting.claim();
        console.log("Team TGE claimed (1%)");
        console.log("Team wallet FOOD balance:", food.balanceOf(teamWallet) / 1e18);
    }

    // ============================================================
    // DEPLOYMENT SCRIPT VALIDATION
    // ============================================================

    function testDeploymentScriptValidation() public {
        console.log("");
        console.log("================================================================================");
        console.log("  DEPLOYMENT SCRIPT VALIDATION");
        console.log("  Simulating Deploy.s.sol execution on Anvil");
        console.log("================================================================================");

        address deployer = address(this);

        console.log("");
        console.log("--- Step 1: Deploy Core Contracts ---");

        EBTApplication app = new EBTApplication();
        console.log("EBTApplication deployed");
        assertTrue(address(app) != address(0), "App deployment failed");

        FoodStamps foodToken = new FoodStamps();
        console.log("FoodStamps deployed");
        assertTrue(address(foodToken) != address(0), "FoodStamps deployment failed");

        ERC6551Registry reg = new ERC6551Registry();
        console.log("ERC6551Registry deployed");
        assertTrue(address(reg) != address(0), "Registry deployment failed");

        ERC6551Account accImpl = new ERC6551Account();
        console.log("ERC6551Account deployed");
        assertTrue(address(accImpl) != address(0), "Account impl deployment failed");

        LiquidityVault vaultContract = new LiquidityVault(address(foodToken));
        console.log("LiquidityVault deployed");
        assertTrue(address(vaultContract) != address(0), "Vault deployment failed");

        TeamVesting vestingContract = new TeamVesting(address(foodToken));
        console.log("TeamVesting deployed");
        assertTrue(address(vestingContract) != address(0), "Vesting deployment failed");

        console.log("");
        console.log("--- Step 2: Configure Registry ---");
        reg.setImplementation(address(accImpl));
        assertEq(reg.getImplementation(), address(accImpl), "Implementation not set");
        console.log("Implementation set");

        console.log("");
        console.log("--- Step 3: Deploy EBTProgram ---");
        EBTProgram prog = new EBTProgram(address(reg), address(app));
        console.log("EBTProgram deployed");
        assertTrue(address(prog) != address(0), "Program deployment failed");

        console.log("");
        console.log("--- Step 4: Transfer Registry Ownership ---");
        reg.transferOwnership(address(prog));
        assertEq(reg.owner(), address(prog), "Ownership transfer failed");
        console.log("Registry owner transferred");

        console.log("");
        console.log("--- Step 5: Initialize EBTProgram ---");
        prog.initialize(
            address(vaultContract),
            protocolCaller,
            treasury,
            marketing,
            teamWallet,
            address(accImpl),
            address(foodToken)
        );
        assertTrue(prog.initialized(), "Initialization failed");
        console.log("Program initialized");

        console.log("");
        console.log("--- Step 6: Configure Vault ---");
        vaultContract.setEBTProgram(address(prog));
        assertEq(vaultContract.ebtProgram(), address(prog), "Vault config failed");
        console.log("Vault configured");

        console.log("");
        console.log("--- Step 7: Configure Vesting ---");
        vestingContract.setTeamWallet(teamWallet);
        assertEq(vestingContract.teamWallet(), teamWallet, "Vesting config failed");
        console.log("Vesting configured");

        console.log("");
        console.log("--- Step 8: Initial Distribution ---");
        foodToken.initialDistribution(
            address(vaultContract),
            address(vestingContract),
            marketing,
            address(prog)
        );
        assertTrue(foodToken.initialDistributionDone(), "Distribution failed");

        console.log("Token Distribution Complete:");
        console.log("  Vault (65%):", foodToken.balanceOf(address(vaultContract)) / 1e18);
        console.log("  Team (5%):", foodToken.balanceOf(address(vestingContract)) / 1e18);
        console.log("  Marketing (20%):", foodToken.balanceOf(marketing) / 1e18);
        console.log("  Program (10%):", foodToken.balanceOf(address(prog)) / 1e18);

        uint256 totalSupply = foodToken.totalSupply();
        assertEq(foodToken.balanceOf(address(vaultContract)), totalSupply * 65 / 100, "Vault allocation wrong");
        assertEq(foodToken.balanceOf(address(vestingContract)), totalSupply * 5 / 100, "Team allocation wrong");
        assertEq(foodToken.balanceOf(marketing), totalSupply * 20 / 100, "Marketing allocation wrong");
        assertEq(foodToken.balanceOf(address(prog)), totalSupply * 10 / 100, "Program allocation wrong");

        console.log("");
        console.log("--- Step 9: Configure Application ---");
        app.setProgramAsAdmin(address(prog));
        console.log("Application configured");

        console.log("");
        console.log("--- Step 10: Verify Full Configuration ---");
        assertTrue(prog.isFullyConfigured(), "Program not fully configured");
        console.log("Full configuration verified!");

        console.log("");
        console.log("=== DEPLOYMENT VALIDATION PASSED ===");
    }

    // ============================================================
    // HELPER FUNCTIONS
    // ============================================================

    function _printScenarioReport(ScenarioReport memory report) internal pure {
        console.log("");
        console.log("================================================================================");
        console.log("  SCENARIO REPORT");
        console.log("================================================================================");
        console.log("");
        console.log("FUNDRAISING:");
        console.log("  Total Raised (ETH):", report.totalRaised / 1e18);
        console.log("  Soft Cap (ETH):", report.softCap / 1e18);
        console.log("  Hard Cap (ETH):", report.hardCap / 1e18);
        console.log("  Soft Cap Reached:", report.softCapReached ? 1 : 0);
        console.log("");
        console.log("PARTICIPANTS:");
        console.log("  Number of Minters:", report.numMinters);
        console.log("  Avg Contribution (wei):", report.avgContribution);
        console.log("");
        console.log("ETH DISTRIBUTION:");
        console.log("  Distributed:", report.ethDistributed ? 1 : 0);
        if (report.ethDistributed) {
            console.log("  Liquidity (65%) ETH:", report.liquidityETH / 1e18);
            console.log("  Marketing (20%) ETH:", report.marketingETH / 1e18);
            console.log("  Treasury (10%) ETH:", report.treasuryETH / 1e18);
            console.log("  Team (5%) ETH:", report.teamETH / 1e18);
        }
        console.log("");
        console.log("TOKENS:");
        console.log("  Total Distributed:", report.tokensDistributed / 1e18);
        console.log("");
        console.log("GAS:");
        console.log("  Total Gas Used:", report.gasUsed);
        console.log("================================================================================");
    }

    // ============================================================
    // COMPARATIVE REPORT
    // ============================================================

    function testGenerateComparativeReport() public {
        testScenario_SoftCapFailure();
        testScenario_LowLiquidity();
        testScenario_Blowout();

        console.log("");
        console.log("################################################################################");
        console.log("##                        COMPARATIVE SCENARIO ANALYSIS                       ##");
        console.log("################################################################################");
        console.log("");

        for (uint256 i = 0; i < reports.length; i++) {
            ScenarioReport memory r = reports[i];
            console.log("Scenario:", i + 1);
            console.log("  Raised (ETH):", r.totalRaised / 1e18);
            console.log("  Minters:", r.numMinters);
            console.log("  Distributed:", r.ethDistributed ? 1 : 0);
            console.log("  Tokens:", r.tokensDistributed / 1e18);
            console.log("");
        }

        console.log("################################################################################");
        console.log("##                              RECOMMENDATIONS                               ##");
        console.log("################################################################################");
        console.log("");
        console.log("1. SOFT CAP FAILURE:");
        console.log("   - Implement automated refund mechanism");
        console.log("   - Consider lowering soft cap for better success rate");
        console.log("   - Emergency withdraw available for manual refunds");
        console.log("");
        console.log("2. LOW LIQUIDITY:");
        console.log("   - Successful but thin liquidity pool");
        console.log("   - Consider reserving more ETH for buybacks");
        console.log("   - Implement price protection mechanisms");
        console.log("");
        console.log("3. BLOWOUT:");
        console.log("   - Hard cap prevents over-subscription");
        console.log("   - Large liquidity pool provides stability");
        console.log("   - Marketing vestings help sustained promotion");
        console.log("");
        console.log("################################################################################");
    }

    // ============================================================
    // SCENARIO 4: HARD CAP AUTO-CLOSE TEST
    // ============================================================

    function testScenario_HardCapAutoClose() public {
        console.log("");
        console.log("================================================================================");
        console.log("  SCENARIO 4: HARD CAP AUTO-CLOSE");
        console.log("  Target: Verify fundraising auto-closes when hard cap is exactly reached");
        console.log("================================================================================");

        _deployFreshContracts();
        // Use a low hard cap to make it easier to hit
        _configureContracts(5 ether, 10 ether);

        console.log("");
        console.log("--- Configuration ---");
        console.log("Soft Cap (ETH):", program.softCap() / 1e18);
        console.log("Hard Cap (ETH):", program.hardCap() / 1e18);

        // Generate 10 users who will each contribute 1 ETH (total = 10 ETH = hard cap)
        (address[] memory users, string[] memory userIds) = _generateUsers(10);

        console.log("");
        console.log("--- Minting Phase (Hitting Hard Cap) ---");

        uint256 totalContributed = 0;
        uint256 minterCount = 0;

        // Use explicit block counter to avoid Foundry vm.roll quirk
        uint256 currentBlock = 5;
        vm.roll(currentBlock);

        for (uint256 i = 0; i < users.length; i++) {
            currentBlock += 4;
            vm.roll(currentBlock);

            uint256 contribution = 1 ether;

            // Check fundraising status before mint
            bool closedBefore = program.fundraisingClosed();

            vm.prank(users[i]);
            try program.mint{value: contribution}(userIds[i]) {
                totalContributed += contribution;
                minterCount++;

                bool closedAfter = program.fundraisingClosed();

                console.log("Minter", i + 1);
                console.log("  Total Raised:", totalContributed / 1e18);
                console.log("  Closed Before:", closedBefore ? 1 : 0);
                console.log("  Closed After:", closedAfter ? 1 : 0);

                // If we just hit the hard cap, verify auto-close happened
                if (totalContributed >= program.hardCap()) {
                    assertTrue(closedAfter, "Fundraising should auto-close at hard cap");
                    console.log("  >>> HARD CAP REACHED - AUTO-CLOSED <<<");
                    break;
                }
            } catch Error(string memory reason) {
                console.log("Mint failed:", reason);
                break;
            }
        }

        console.log("");
        console.log("--- Verification ---");
        console.log("Total Raised (ETH):", program.totalRaised() / 1e18);
        console.log("Hard Cap (ETH):", program.hardCap() / 1e18);
        console.log("Fundraising Closed:", program.fundraisingClosed() ? 1 : 0);
        console.log("Minters:", minterCount);

        assertTrue(program.fundraisingClosed(), "Fundraising should be closed");
        assertEq(program.totalRaised(), program.hardCap(), "Should have raised exactly hard cap");

        // Verify we can immediately distribute without waiting for period to end
        console.log("");
        console.log("--- Immediate ETH Distribution (No Wait Required) ---");
        program.distributeETH();
        assertTrue(program.ethDistributed(), "ETH should be distributed");
        console.log("ETH distributed successfully without waiting for fundraising period!");

        console.log("");
        console.log("=== HARD CAP AUTO-CLOSE VERIFIED ===");
    }
}
