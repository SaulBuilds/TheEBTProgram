// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";
import "../contracts/MarketingVesting.sol";
import "../contracts/LiquidityVault.sol";
import "../contracts/FoodStamps.sol";
import "../contracts/TeamVesting.sol";

contract MarketingVestingTest is Test {
    FoodStamps internal food;
    LiquidityVault internal vault;
    TeamVesting internal teamVesting;

    address internal beneficiary = address(0xBEEF);
    address internal beneficiary2 = address(0xCAFE);
    address internal marketing = address(0xDEAD);

    uint256 internal constant ALLOCATION = 1_000_000 * 1e18; // 1M tokens
    uint256 internal constant VESTING_DURATION = 90 days; // 3 months

    function setUp() public {
        food = new FoodStamps();
        vault = new LiquidityVault(address(food));
        teamVesting = new TeamVesting(address(food));

        // Do initial distribution to fund the vault
        food.initialDistribution(
            address(vault),
            address(teamVesting),
            marketing,
            address(this) // program placeholder
        );
    }

    function testCreateMarketingVesting() public {
        address vestingAddr = vault.createMarketingVesting(
            beneficiary,
            ALLOCATION,
            VESTING_DURATION,
            true,
            "TestKOL",
            "KOL"
        );

        assertTrue(vestingAddr != address(0), "Vesting contract should be created");
        assertEq(vault.getMarketingVestingCount(), 1, "Should have 1 vesting contract");

        // Check vesting info
        MarketingVesting vesting = MarketingVesting(vestingAddr);
        MarketingVesting.VestingInfo memory info = vesting.getVestingInfo();

        assertEq(info.beneficiary, beneficiary);
        assertEq(info.totalAllocation, ALLOCATION);
        assertEq(info.claimed, 0);
        assertEq(info.vested, 0); // Just created
        assertEq(info.claimable, 0);
        assertEq(info.vestingDuration, VESTING_DURATION);
        assertTrue(info.revocable);
        assertFalse(info.revoked);
        assertEq(info.partnerName, "TestKOL");
        assertEq(info.partnershipType, "KOL");
    }

    function testLinearVesting() public {
        // Use explicit timestamps to avoid any Foundry quirks
        uint256 initialTimestamp = 1000; // Start at timestamp 1000
        vm.warp(initialTimestamp);

        address vestingAddr = vault.createMarketingVesting(
            beneficiary,
            ALLOCATION,
            VESTING_DURATION,
            false,
            "LinearTest",
            "Ambassador"
        );

        MarketingVesting vesting = MarketingVesting(vestingAddr);

        // At start, nothing vested
        assertEq(vesting.vestedAmount(), 0);

        // After 1/3 of duration (30 days), 1/3 should be vested
        vm.warp(initialTimestamp + 30 days);
        uint256 expectedVested = ALLOCATION / 3;
        assertApproxEqRel(vesting.vestedAmount(), expectedVested, 0.01e18); // 1% tolerance

        // After 2/3 of duration (60 days)
        vm.warp(initialTimestamp + 60 days);
        expectedVested = (ALLOCATION * 2) / 3;
        assertApproxEqRel(vesting.vestedAmount(), expectedVested, 0.01e18);

        // After full duration (90 days), all vested
        vm.warp(initialTimestamp + 90 days);
        assertEq(vesting.vestedAmount(), ALLOCATION);
    }

    function testClaimVestedTokens() public {
        uint256 startTime = block.timestamp;

        address vestingAddr = vault.createMarketingVesting(
            beneficiary,
            ALLOCATION,
            VESTING_DURATION,
            false,
            "ClaimTest",
            "Associate"
        );

        MarketingVesting vesting = MarketingVesting(vestingAddr);

        // Can't claim at start
        vm.prank(beneficiary);
        vm.expectRevert(MarketingVesting.NothingToClaim.selector);
        vesting.claim();

        // Wait 45 days (half way)
        vm.warp(startTime + 45 days);

        uint256 balanceBefore = food.balanceOf(beneficiary);
        vm.prank(beneficiary);
        vesting.claim();
        uint256 balanceAfter = food.balanceOf(beneficiary);

        uint256 claimed = balanceAfter - balanceBefore;
        uint256 expectedClaim = ALLOCATION / 2;
        assertApproxEqRel(claimed, expectedClaim, 0.01e18);

        // Can claim more after more time passes
        vm.warp(startTime + 90 days);
        vm.prank(beneficiary);
        vesting.claim();

        // Should have full allocation now
        assertEq(food.balanceOf(beneficiary), ALLOCATION);
    }

    function testOnlyBeneficiaryCanClaim() public {
        address vestingAddr = vault.createMarketingVesting(
            beneficiary,
            ALLOCATION,
            VESTING_DURATION,
            false,
            "AuthTest",
            "KOL"
        );

        MarketingVesting vesting = MarketingVesting(vestingAddr);
        vm.warp(block.timestamp + 45 days);

        // Non-beneficiary can't claim
        vm.prank(address(0x1234));
        vm.expectRevert(MarketingVesting.NotBeneficiary.selector);
        vesting.claim();
    }

    function testRevokeVesting() public {
        address vestingAddr = vault.createMarketingVesting(
            beneficiary,
            ALLOCATION,
            VESTING_DURATION,
            true, // revocable
            "RevokeTest",
            "KOL"
        );

        MarketingVesting vesting = MarketingVesting(vestingAddr);

        // Wait 30 days (1/3 vested)
        vm.warp(block.timestamp + 30 days);

        // Check vested amount before revoke
        uint256 vestedBeforeRevoke = vesting.vestedAmount();
        assertApproxEqRel(vestedBeforeRevoke, ALLOCATION / 3, 0.01e18);

        uint256 vaultBalanceBefore = food.balanceOf(address(vault));

        // Revoke - unvested tokens return to vault
        vault.revokeMarketingVesting(vestingAddr);

        uint256 vaultBalanceAfter = food.balanceOf(address(vault));
        uint256 returned = vaultBalanceAfter - vaultBalanceBefore;

        // Should return ~2/3 of allocation
        uint256 expectedReturn = (ALLOCATION * 2) / 3;
        assertApproxEqRel(returned, expectedReturn, 0.01e18);

        // Beneficiary can still claim the vested portion after revoke
        uint256 claimableBefore = vesting.claimable();
        assertApproxEqRel(claimableBefore, ALLOCATION / 3, 0.01e18);

        vm.prank(beneficiary);
        vesting.claim();

        // Beneficiary should have received ~1/3 of allocation
        assertApproxEqRel(food.balanceOf(beneficiary), ALLOCATION / 3, 0.01e18);
    }

    function testCannotRevokeNonRevocable() public {
        address vestingAddr = vault.createMarketingVesting(
            beneficiary,
            ALLOCATION,
            VESTING_DURATION,
            false, // NOT revocable
            "NonRevocable",
            "Ambassador"
        );

        vm.warp(block.timestamp + 30 days);

        vm.expectRevert(MarketingVesting.NotRevocable.selector);
        vault.revokeMarketingVesting(vestingAddr);
    }

    function testBatchCreateVesting() public {
        address[] memory beneficiaries = new address[](3);
        beneficiaries[0] = address(0x1);
        beneficiaries[1] = address(0x2);
        beneficiaries[2] = address(0x3);

        uint256[] memory allocations = new uint256[](3);
        allocations[0] = 100_000 * 1e18;
        allocations[1] = 200_000 * 1e18;
        allocations[2] = 300_000 * 1e18;

        string[] memory names = new string[](3);
        names[0] = "KOL1";
        names[1] = "KOL2";
        names[2] = "KOL3";

        string[] memory types = new string[](3);
        types[0] = "KOL";
        types[1] = "Ambassador";
        types[2] = "Associate";

        vault.batchCreateMarketingVesting(
            beneficiaries,
            allocations,
            VESTING_DURATION,
            true,
            names,
            types
        );

        assertEq(vault.getMarketingVestingCount(), 3);

        // Check each beneficiary has correct vesting
        MarketingVesting[] memory vestings = vault.getVestingsForBeneficiary(address(0x1));
        assertEq(vestings.length, 1);

        MarketingVesting.VestingInfo memory info = vestings[0].getVestingInfo();
        assertEq(info.totalAllocation, 100_000 * 1e18);
    }

    function testUpdateBeneficiary() public {
        address vestingAddr = vault.createMarketingVesting(
            beneficiary,
            ALLOCATION,
            VESTING_DURATION,
            false,
            "BeneficiaryUpdate",
            "KOL"
        );

        MarketingVesting vesting = MarketingVesting(vestingAddr);

        // Wait some time
        vm.warp(block.timestamp + 45 days);

        // Original beneficiary updates to new address
        vm.prank(beneficiary);
        vesting.updateBeneficiary(beneficiary2);

        // Old beneficiary can no longer claim
        vm.prank(beneficiary);
        vm.expectRevert(MarketingVesting.NotBeneficiary.selector);
        vesting.claim();

        // New beneficiary can claim
        vm.prank(beneficiary2);
        vesting.claim();

        assertGt(food.balanceOf(beneficiary2), 0);
    }

    function testDefaultVestingDuration() public {
        // Pass 0 for duration to use default (90 days)
        address vestingAddr = vault.createMarketingVesting(
            beneficiary,
            ALLOCATION,
            0, // Use default
            false,
            "DefaultDuration",
            "KOL"
        );

        MarketingVesting vesting = MarketingVesting(vestingAddr);
        MarketingVesting.VestingInfo memory info = vesting.getVestingInfo();

        assertEq(info.vestingDuration, 90 days);
    }

    function testVestingProgress() public {
        uint256 startTime = block.timestamp;

        address vestingAddr = vault.createMarketingVesting(
            beneficiary,
            ALLOCATION,
            VESTING_DURATION,
            false,
            "Progress",
            "KOL"
        );

        MarketingVesting vesting = MarketingVesting(vestingAddr);

        // At start: 0%
        assertEq(vesting.vestingProgress(), 0);

        // At 45 days: 50%
        vm.warp(startTime + 45 days);
        assertApproxEqRel(vesting.vestingProgress(), 5000, 0.01e18); // 50% in basis points

        // At end: 100%
        vm.warp(startTime + 90 days);
        assertEq(vesting.vestingProgress(), 10000); // 100% in basis points
    }

    function testTimeRemaining() public {
        address vestingAddr = vault.createMarketingVesting(
            beneficiary,
            ALLOCATION,
            VESTING_DURATION,
            false,
            "TimeRemaining",
            "KOL"
        );

        MarketingVesting vesting = MarketingVesting(vestingAddr);

        // At start: full duration remaining
        assertEq(vesting.timeRemaining(), VESTING_DURATION);

        // After 30 days
        vm.warp(block.timestamp + 30 days);
        assertEq(vesting.timeRemaining(), 60 days);

        // After full duration
        vm.warp(block.timestamp + 60 days);
        assertEq(vesting.timeRemaining(), 0);
    }

    function testMarketingStats() public {
        vault.createMarketingVesting(
            beneficiary,
            ALLOCATION,
            VESTING_DURATION,
            false,
            "Stats1",
            "KOL"
        );

        vault.createMarketingVesting(
            beneficiary2,
            ALLOCATION * 2,
            VESTING_DURATION,
            true,
            "Stats2",
            "Ambassador"
        );

        (uint256 totalContracts, uint256 totalAllocated,) = vault.getMarketingStats();

        assertEq(totalContracts, 2);
        assertEq(totalAllocated, ALLOCATION * 3);
    }

    function testCannotCreateWithZeroAllocation() public {
        vm.expectRevert(LiquidityVault.ZeroAmount.selector);
        vault.createMarketingVesting(
            beneficiary,
            0,
            VESTING_DURATION,
            false,
            "Zero",
            "KOL"
        );
    }

    function testCannotCreateWithZeroAddress() public {
        vm.expectRevert(LiquidityVault.InvalidAddress.selector);
        vault.createMarketingVesting(
            address(0),
            ALLOCATION,
            VESTING_DURATION,
            false,
            "ZeroAddr",
            "KOL"
        );
    }
}
