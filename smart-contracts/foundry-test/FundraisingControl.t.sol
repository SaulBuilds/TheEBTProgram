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

/// @title FundraisingControlTest
/// @notice Tests for the new fundraising control functions: startFundraising() and setFundraisingStartTime()
contract FundraisingControlTest is Test {
    EBTProgram internal program;
    ERC6551Registry internal registry;
    ERC6551Account internal accountImpl;
    FoodStamps internal food;
    LiquidityVault internal vault;
    TeamVesting internal vesting;
    EBTApplication internal app;

    address internal owner;
    address internal user = address(0xBEEF);
    address internal protocolCaller = address(0xCAFE);
    address internal treasury = address(0x1234);
    address internal marketing = address(0xDEAD);
    address internal teamWallet = address(0xFEED);
    string internal userId = "user1";

    uint256 internal constant MIN_PRICE = 0.02 ether;

    event FundraisingStarted(uint256 startTime, uint256 endTime);

    function setUp() public {
        owner = address(this);

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

        // Initialize the contract
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

        // Initial distribution
        food.initialDistribution(
            address(vault),
            address(vesting),
            marketing,
            address(program)
        );

        app.setProgramAsAdmin(address(program));

        // Prepare user
        vm.deal(user, 10 ether);
        vm.prank(user);
        app.apply4EBT("user", "pic", "tw", 100, userId);
        app.approveUsers(_single(userId));
    }

    // ============ startFundraising Tests ============

    function testStartFundraisingUpdatesStartTime() public {
        uint256 initialStartTime = program.fundraisingStartTime();

        // Warp to a future time
        vm.warp(block.timestamp + 1 days);
        uint256 newTime = block.timestamp;

        program.startFundraising();

        assertEq(program.fundraisingStartTime(), newTime, "Start time should be updated to current timestamp");
        assertTrue(program.fundraisingStartTime() > initialStartTime, "New start time should be later");
    }

    function testStartFundraisingEmitsEvent() public {
        vm.warp(block.timestamp + 1 days);
        uint256 expectedStart = block.timestamp;
        uint256 expectedEnd = expectedStart + program.getFundraisingPeriod();

        vm.expectEmit(true, true, true, true);
        emit FundraisingStarted(expectedStart, expectedEnd);

        program.startFundraising();
    }

    function testStartFundraisingOnlyOwner() public {
        address nonOwner = address(0x9999);

        vm.prank(nonOwner);
        vm.expectRevert("Ownable: caller is not the owner");
        program.startFundraising();
    }

    function testStartFundraisingRequiresInitialization() public {
        // Deploy a fresh, uninitialized contract
        EBTProgram uninitializedProgram = new EBTProgram(address(registry), address(app));

        vm.expectRevert(EBTProgram.NotInitialized.selector);
        uninitializedProgram.startFundraising();
    }

    function testStartFundraisingFailsAfterMint() public {
        // First mint
        vm.warp(block.timestamp + 31 seconds);
        vm.prank(user);
        program.mint{value: MIN_PRICE}(userId);

        // Try to start fundraising again - should fail
        vm.expectRevert("Cannot restart after minting started");
        program.startFundraising();
    }

    function testStartFundraisingFailsAfterClose() public {
        // Close fundraising
        vm.warp(block.timestamp + 31 days); // Past fundraising period
        program.closeFundraising();

        // Try to start fundraising - should fail
        vm.expectRevert("Fundraising already closed");
        program.startFundraising();
    }

    // ============ setFundraisingStartTime Tests ============

    function testSetFundraisingStartTimeUpdatesCorrectly() public {
        uint256 futureTime = block.timestamp + 7 days;

        program.setFundraisingStartTime(futureTime);

        assertEq(program.fundraisingStartTime(), futureTime, "Start time should be set to specified time");
    }

    function testSetFundraisingStartTimeEmitsEvent() public {
        uint256 futureTime = block.timestamp + 7 days;
        uint256 expectedEnd = futureTime + program.getFundraisingPeriod();

        vm.expectEmit(true, true, true, true);
        emit FundraisingStarted(futureTime, expectedEnd);

        program.setFundraisingStartTime(futureTime);
    }

    function testSetFundraisingStartTimeOnlyOwner() public {
        address nonOwner = address(0x9999);
        uint256 futureTime = block.timestamp + 7 days;

        vm.prank(nonOwner);
        vm.expectRevert("Ownable: caller is not the owner");
        program.setFundraisingStartTime(futureTime);
    }

    function testSetFundraisingStartTimeRequiresInitialization() public {
        EBTProgram uninitializedProgram = new EBTProgram(address(registry), address(app));

        vm.expectRevert(EBTProgram.NotInitialized.selector);
        uninitializedProgram.setFundraisingStartTime(block.timestamp + 1 days);
    }

    function testSetFundraisingStartTimeFailsAfterMint() public {
        // First mint
        vm.warp(block.timestamp + 31 seconds);
        vm.prank(user);
        program.mint{value: MIN_PRICE}(userId);

        // Try to set start time - should fail
        vm.expectRevert("Cannot change after minting started");
        program.setFundraisingStartTime(block.timestamp + 1 days);
    }

    function testSetFundraisingStartTimeFailsAfterClose() public {
        vm.warp(block.timestamp + 31 days);
        program.closeFundraising();

        vm.expectRevert("Fundraising already closed");
        program.setFundraisingStartTime(block.timestamp + 1 days);
    }

    function testSetFundraisingStartTimeRejectsZero() public {
        vm.expectRevert("Invalid start time");
        program.setFundraisingStartTime(0);
    }

    // ============ View Function Tests ============

    function testGetFundraisingEndTime() public {
        uint256 startTime = program.fundraisingStartTime();
        uint256 period = program.getFundraisingPeriod();

        assertEq(program.getFundraisingEndTime(), startTime + period, "End time should be start + period");
    }

    function testGetFundraisingPeriod() public {
        // Default period is 30 days
        assertEq(program.getFundraisingPeriod(), 30 days, "Default period should be 30 days");
    }

    // ============ Integration Tests ============

    function testFundraisingFlowWithNewStartTime() public {
        // Set a future start time
        uint256 futureStart = block.timestamp + 1 days;
        program.setFundraisingStartTime(futureStart);

        // Verify start time was set
        assertEq(program.fundraisingStartTime(), futureStart, "Start time should be set");

        // Warp to after fundraising starts + cooldown
        vm.warp(futureStart + 31 seconds);

        // Minting should work during fundraising period
        vm.prank(user);
        program.mint{value: MIN_PRICE}(userId);

        assertEq(program.ownerOf(1), user, "User should own token 1");
    }

    function testMintFailsAfterFundraisingEnds() public {
        // Use startFundraising to set start time to now
        program.startFundraising();

        // Warp past the fundraising period (30 days + 1 second)
        vm.warp(block.timestamp + 31 days);

        // Try to mint - should fail because fundraising period ended
        vm.prank(user);
        vm.expectRevert("Fundraising period ended");
        program.mint{value: MIN_PRICE}(userId);
    }

    function testMultipleStartTimeUpdatesBeforeMint() public {
        // Should be able to update start time multiple times before any mint
        program.setFundraisingStartTime(block.timestamp + 1 days);
        program.setFundraisingStartTime(block.timestamp + 2 days);
        program.startFundraising(); // Sets to now

        // All updates should work
        assertTrue(program.fundraisingStartTime() > 0, "Start time should be set");
    }

    function testSetFundraisingPeriodBeforeMint() public {
        // Change period before any mints
        program.setFundraisingPeriod(60 days);
        assertEq(program.getFundraisingPeriod(), 60 days, "Period should be updated");

        // Start fundraising
        program.startFundraising();

        // End time should reflect new period
        assertEq(
            program.getFundraisingEndTime(),
            program.fundraisingStartTime() + 60 days,
            "End time should use new period"
        );
    }

    function testSetCapsBeforeMint() public {
        // Change caps before any mints
        program.setCaps(10 ether, 100 ether);

        assertEq(program.softCap(), 10 ether, "Soft cap should be updated");
        assertEq(program.hardCap(), 100 ether, "Hard cap should be updated");
    }

    function testSetCapsFailsAfterMint() public {
        // Mint first
        vm.warp(block.timestamp + 31 seconds);
        vm.prank(user);
        program.mint{value: MIN_PRICE}(userId);

        // Try to change caps - should fail
        vm.expectRevert("Cannot change after minting started");
        program.setCaps(10 ether, 100 ether);
    }

    function testSetFundraisingPeriodFailsAfterMint() public {
        // Mint first
        vm.warp(block.timestamp + 31 seconds);
        vm.prank(user);
        program.mint{value: MIN_PRICE}(userId);

        // Try to change period - should fail
        vm.expectRevert("Cannot change after minting started");
        program.setFundraisingPeriod(60 days);
    }

    // ============ Helper Functions ============

    function _single(string memory s) internal pure returns (string[] memory) {
        string[] memory arr = new string[](1);
        arr[0] = s;
        return arr;
    }
}
