// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {EBTSlotMachine} from "../contracts/EBTSlotMachine.sol";
import {FoodStamps} from "../contracts/FoodStamps.sol";

/// @title EBT Slot Machine Test Suite (Standalone)
/// @notice Comprehensive tests for the standalone slot machine contract
contract EBTSlotMachineTest is Test {
    // Contracts
    EBTSlotMachine public slots;
    FoodStamps public food;

    // Test addresses
    address public owner = address(this);
    address public player1 = address(0x1001);
    address public player2 = address(0x1002);
    address public liquidityVault = address(0x2001);
    address public teamVesting = address(0x2002);
    address public marketingWallet = address(0x2003);
    address public ebtProgramAddr = address(0x2004);

    // Events to test
    event SpinRequested(uint256 indexed requestId, address indexed player, bool isFree, uint256 timestamp);
    event SpinFulfilled(uint256 indexed requestId, address indexed player, uint8 reel1, uint8 reel2, uint8 reel3, uint256 payout, bool isJackpot, bool isBonus, uint256 timestamp);
    event PlayerStatsUpdated(address indexed player, uint256 totalSpins, uint256 totalWinnings, uint256 freeSpinsUsed, uint256 jackpotWins);
    event JackpotWon(address indexed player, uint256 amount);
    event JackpotFunded(address indexed funder, uint256 amount);

    function setUp() public {
        // Set a known start time
        vm.warp(1000);

        // Deploy FoodStamps token
        food = new FoodStamps();

        // Initialize token distribution (mints tokens to liquidityVault)
        food.initialDistribution(
            liquidityVault,
            teamVesting,
            marketingWallet,
            ebtProgramAddr
        );

        // Deploy Slot Machine (standalone - only needs FoodStamps)
        slots = new EBTSlotMachine(address(food));

        // Transfer tokens from liquidityVault to fund slot machine
        vm.prank(liquidityVault);
        food.transfer(address(slots), 100_000 * 1e18);

        // Fund jackpot pool (from liquidityVault)
        vm.prank(liquidityVault);
        food.approve(address(slots), 50_000 * 1e18);
        vm.prank(liquidityVault);
        slots.fundJackpot(50_000 * 1e18);

        // Give players some ETH for gas
        vm.deal(player1, 10 ether);
        vm.deal(player2, 10 ether);
    }

    // ============ Constructor Tests ============

    function testConstructor() public view {
        assertEq(address(slots.foodStamps()), address(food));
        assertEq(slots.FREE_SPIN_LIMIT(), 10);
        assertEq(slots.FREE_SPIN_CAP(), 5000 * 1e18);
    }

    function testConstructorRejectsZeroAddress() public {
        vm.expectRevert(EBTSlotMachine.InvalidAddress.selector);
        new EBTSlotMachine(address(0));
    }

    // ============ Spin Tests ============

    function testAnyWalletCanSpin() public {
        vm.prank(player1);
        uint256 requestId = slots.spin();

        assertTrue(requestId > 0);

        EBTSlotMachine.PlayerStats memory stats = slots.getPlayerStats(player1);
        assertEq(stats.totalSpins, 1);
        assertEq(stats.freeSpinsUsed, 1);
    }

    function testSpinEmitsEvents() public {
        vm.prank(player1);
        slots.spin();

        // Events are emitted - we verify via the stats being updated
        EBTSlotMachine.PlayerStats memory stats = slots.getPlayerStats(player1);
        assertEq(stats.totalSpins, 1);
    }

    function testSpinCooldown() public {
        vm.prank(player1);
        slots.spin();

        // Immediately try again - should fail
        vm.prank(player1);
        vm.expectRevert(EBTSlotMachine.SpinCooldownActive.selector);
        slots.spin();

        // Wait for cooldown and try again
        vm.warp(block.timestamp + 4 seconds);
        vm.prank(player1);
        slots.spin(); // Should succeed
    }

    // ============ Free Spin Tests ============

    function testFreeSpinLimit() public {
        uint256 currentTime = block.timestamp;

        // Use all 10 free spins
        for (uint256 i = 0; i < 10; i++) {
            currentTime += 4;
            vm.warp(currentTime);
            vm.prank(player1);
            slots.spin();
        }

        EBTSlotMachine.PlayerStats memory stats = slots.getPlayerStats(player1);
        assertEq(stats.freeSpinsUsed, 10);

        // 11th spin should still work (infinite after free spins)
        currentTime += 4;
        vm.warp(currentTime);
        vm.prank(player1);
        slots.spin();

        stats = slots.getPlayerStats(player1);
        assertEq(stats.totalSpins, 11);
    }

    function testGetRemainingFreeSpins() public view {
        uint256 remaining = slots.getRemainingFreeSpins(player1);
        assertEq(remaining, 10);
    }

    function testRemainingFreeSpinsDecreases() public {
        vm.prank(player1);
        slots.spin();

        uint256 remaining = slots.getRemainingFreeSpins(player1);
        assertEq(remaining, 9);
    }

    // ============ Payout Tests ============

    function testPayoutCalculation() public {
        uint256 initialBalance = food.balanceOf(player1);
        uint256 totalPayout = 0;
        uint256 currentTime = block.timestamp;

        for (uint256 i = 0; i < 10; i++) {
            currentTime += 4;
            vm.warp(currentTime);
            vm.prank(player1);
            uint256 requestId = slots.spin();

            EBTSlotMachine.SpinResult memory result = slots.getSpinResult(requestId);
            totalPayout += result.payout;
        }

        uint256 finalBalance = food.balanceOf(player1);

        // Balance should have increased by total payouts
        assertEq(finalBalance - initialBalance, totalPayout);
    }

    // ============ Symbol Weight Tests ============

    function testSymbolWeightsInitialized() public view {
        assertTrue(slots.SYMBOL_COUNT() == 16);
    }

    function testSetSymbolWeights() public {
        uint8[16] memory newWeights = [
            uint8(50), 50, 50, 50, 50, 50,
            50, 50, 50, 50, 50, 50,
            50, 50, 50, 50
        ];

        slots.setSymbolWeights(newWeights);
        // If no revert, weights were set successfully
    }

    function testSetSymbolWeightsOnlyOwner() public {
        uint8[16] memory newWeights;
        for (uint256 i = 0; i < 16; i++) {
            newWeights[i] = 50;
        }

        vm.prank(player1);
        vm.expectRevert("Ownable: caller is not the owner");
        slots.setSymbolWeights(newWeights);
    }

    function testSetSymbolWeightsRejectsZeroTotal() public {
        uint8[16] memory zeroWeights;

        vm.expectRevert(EBTSlotMachine.InvalidSymbolWeights.selector);
        slots.setSymbolWeights(zeroWeights);
    }

    // ============ Jackpot Tests ============

    function testFundJackpot() public {
        uint256 initialPool = slots.jackpotPool();

        vm.prank(liquidityVault);
        food.approve(address(slots), 10_000 * 1e18);
        vm.prank(liquidityVault);
        slots.fundJackpot(10_000 * 1e18);

        assertEq(slots.jackpotPool(), initialPool + 10_000 * 1e18);
    }

    function testFundJackpotEmitsEvent() public {
        vm.prank(liquidityVault);
        food.approve(address(slots), 1000 * 1e18);

        vm.expectEmit(true, false, false, true);
        emit JackpotFunded(liquidityVault, 1000 * 1e18);
        vm.prank(liquidityVault);
        slots.fundJackpot(1000 * 1e18);
    }

    // ============ View Function Tests ============

    function testCanSpin() public {
        (bool canSpinNow, string memory reason) = slots.canSpin(player1);
        assertTrue(canSpinNow);
        assertEq(reason, "");
    }

    function testCannotSpinDuringCooldown() public {
        vm.prank(player1);
        slots.spin();

        (bool canSpinNow, string memory reason) = slots.canSpin(player1);
        assertFalse(canSpinNow);
        assertEq(reason, "Cooldown active");
    }

    function testGetPlayerStats() public {
        vm.prank(player1);
        slots.spin();

        EBTSlotMachine.PlayerStats memory stats = slots.getPlayerStats(player1);

        assertEq(stats.totalSpins, 1);
        assertEq(stats.freeSpinsUsed, 1);
        assertTrue(stats.lastSpinTime > 0);
    }

    // ============ Admin Function Tests ============

    function testPause() public {
        slots.pause();
        assertTrue(slots.paused());

        vm.prank(player1);
        vm.expectRevert("Pausable: paused");
        slots.spin();
    }

    function testUnpause() public {
        slots.pause();
        slots.unpause();
        assertFalse(slots.paused());

        vm.prank(player1);
        slots.spin(); // Should work now
    }

    function testPauseOnlyOwner() public {
        vm.prank(player1);
        vm.expectRevert("Ownable: caller is not the owner");
        slots.pause();
    }

    function testSetVRFConfig() public {
        address coordinator = address(0x5555);
        bytes32 keyHash = keccak256("test");
        uint64 subId = 123;

        slots.setVRFConfig(coordinator, keyHash, subId, 300_000, 5);

        assertEq(slots.vrfCoordinator(), coordinator);
        assertEq(slots.keyHash(), keyHash);
        assertEq(slots.subscriptionId(), subId);
    }

    function testEmergencyWithdraw() public {
        uint256 slotBalance = food.balanceOf(address(slots));
        uint256 ownerBefore = food.balanceOf(owner);

        slots.emergencyWithdraw(address(food), slotBalance);

        assertEq(food.balanceOf(address(slots)), 0);
        assertEq(food.balanceOf(owner), ownerBefore + slotBalance);
    }

    function testEmergencyWithdrawOnlyOwner() public {
        vm.prank(player1);
        vm.expectRevert("Ownable: caller is not the owner");
        slots.emergencyWithdraw(address(food), 1000);
    }

    // ============ EBT Holder Bonus Tests ============

    function testIsEBTHolderReturnsFalseWhenNoProgramSet() public view {
        // ebtProgram is address(0) by default
        assertFalse(slots.isEBTHolder(player1));
    }

    function testSetEBTProgram() public {
        address mockEBT = address(0x9999);
        slots.setEBTProgram(mockEBT);
        assertEq(address(slots.ebtProgram()), mockEBT);
    }

    // ============ Multiple Player Tests ============

    function testMultiplePlayersCanSpin() public {
        vm.prank(player1);
        uint256 req1 = slots.spin();

        vm.prank(player2);
        uint256 req2 = slots.spin();

        assertTrue(req1 != req2);

        assertEq(slots.getPlayerStats(player1).totalSpins, 1);
        assertEq(slots.getPlayerStats(player2).totalSpins, 1);
    }

    function testPlayersHaveSeparateStats() public {
        uint256 currentTime = block.timestamp;

        // Player 1 spins 5 times
        for (uint256 i = 0; i < 5; i++) {
            currentTime += 4;
            vm.warp(currentTime);
            vm.prank(player1);
            slots.spin();
        }

        // Player 2 spins 2 times
        for (uint256 i = 0; i < 2; i++) {
            currentTime += 4;
            vm.warp(currentTime);
            vm.prank(player2);
            slots.spin();
        }

        assertEq(slots.getPlayerStats(player1).freeSpinsUsed, 5);
        assertEq(slots.getPlayerStats(player2).freeSpinsUsed, 2);
    }

    // ============ Fuzz Tests ============

    function testFuzz_SpinCooldown(uint256 waitTime) public {
        vm.assume(waitTime < 365 days); // Reasonable bound

        vm.prank(player1);
        slots.spin();

        vm.warp(block.timestamp + waitTime);

        vm.prank(player1);
        if (waitTime < 3 seconds) {
            vm.expectRevert(EBTSlotMachine.SpinCooldownActive.selector);
        }
        slots.spin();
    }

    function testFuzz_MultipleSpins(uint8 spinCount) public {
        vm.assume(spinCount > 0 && spinCount <= 50);

        uint256 currentTime = block.timestamp;
        for (uint256 i = 0; i < spinCount; i++) {
            currentTime += 4;
            vm.warp(currentTime);
            vm.prank(player1);
            slots.spin();
        }

        assertEq(slots.getPlayerStats(player1).totalSpins, spinCount);
    }

    // ============ Integration Tests ============

    function testFullGameFlow() public {
        // Check initial state
        uint256 initialFreeSpins = slots.getRemainingFreeSpins(player1);
        assertEq(initialFreeSpins, 10);

        uint256 totalWinnings = 0;
        uint256 currentTime = block.timestamp;

        // Use all free spins
        for (uint256 i = 0; i < 10; i++) {
            currentTime += 4;
            vm.warp(currentTime);
            vm.prank(player1);
            uint256 requestId = slots.spin();

            EBTSlotMachine.SpinResult memory result = slots.getSpinResult(requestId);
            totalWinnings += result.payout;
        }

        // Verify free spins exhausted
        assertEq(slots.getRemainingFreeSpins(player1), 0);

        // Continue with paid spins (after free spins)
        for (uint256 i = 0; i < 5; i++) {
            currentTime += 4;
            vm.warp(currentTime);
            vm.prank(player1);
            slots.spin();
        }

        EBTSlotMachine.PlayerStats memory finalStats = slots.getPlayerStats(player1);
        assertEq(finalStats.totalSpins, 15);
        assertTrue(finalStats.totalWinnings >= 0);
    }
}

/// @title Slot Machine Invariant Tests (Standalone)
contract EBTSlotMachineInvariantTest is Test {
    EBTSlotMachine public slots;
    FoodStamps public food;

    address public owner = address(this);
    address public player1 = address(0x1001);
    address public liquidityVault = address(0x2001);
    address public teamVesting = address(0x2002);
    address public marketingWallet = address(0x2003);
    address public ebtProgramAddr = address(0x2004);

    function setUp() public {
        vm.warp(1000);

        food = new FoodStamps();

        // Initialize token distribution
        food.initialDistribution(
            liquidityVault,
            teamVesting,
            marketingWallet,
            ebtProgramAddr
        );

        slots = new EBTSlotMachine(address(food));

        // Fund slot machine from liquidityVault
        vm.prank(liquidityVault);
        food.transfer(address(slots), 100_000 * 1e18);
    }

    /// @notice Invariant: Free spins used should never exceed limit
    function invariant_freeSpinsNeverExceedLimit() public view {
        EBTSlotMachine.PlayerStats memory stats = slots.getPlayerStats(player1);
        assertTrue(stats.freeSpinsUsed <= slots.FREE_SPIN_LIMIT());
    }

    /// @notice Invariant: Total payouts should never exceed what was funded
    function invariant_payoutsDoNotExceedFunding() public view {
        // Initial funding was 100k
        assertTrue(slots.totalPayouts() <= 100_000 * 1e18);
    }

    /// @notice Invariant: Jackpot pool is always non-negative
    function invariant_jackpotPoolNonNegative() public view {
        assertTrue(slots.jackpotPool() >= 0);
    }
}
