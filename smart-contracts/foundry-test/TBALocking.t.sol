// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";
import "../contracts/EBTProgram.sol";
import "../contracts/EBTApplication.sol";
import "../contracts/FoodStamps.sol";
import "../contracts/LiquidityVault.sol";
import "../contracts/ERC6551Registry.sol";
import "../contracts/ERC6551Account.sol";

/// @title TBA Locking Tests
/// @notice Comprehensive tests for the TBA locking mechanism (marketplace protection)
contract TBALockingTest is Test {
    EBTProgram internal program;
    EBTApplication internal app;
    FoodStamps internal food;
    LiquidityVault internal vault;
    ERC6551Registry internal registry;
    ERC6551Account internal accountImpl;

    address internal owner = address(this);
    address internal user1 = address(0x1);
    address internal user2 = address(0x2);
    address internal marketplace = address(0xDEAD);
    address internal protocolCaller = address(0xCAFE);
    address internal treasury = address(0x1234);
    address internal marketing = address(0x5678);
    address internal team = address(0x9ABC);

    uint256 internal constant MINT_PRICE = 0.02 ether;

    function setUp() public {
        // Deploy contracts
        app = new EBTApplication();
        food = new FoodStamps();
        registry = new ERC6551Registry();
        accountImpl = new ERC6551Account();
        vault = new LiquidityVault(address(food));

        program = new EBTProgram(address(registry), address(app));

        // Set implementation directly on registry before transferring ownership
        registry.setImplementation(address(accountImpl));
        registry.transferOwnership(address(program));

        // Initialize program
        program.initialize(
            address(vault),
            protocolCaller,
            treasury,
            marketing,
            team,
            address(accountImpl),
            address(food)
        );

        // Set up vault
        vault.setEBTProgram(address(program));

        // Initial distribution
        food.initialDistribution(
            address(vault),
            address(0x100), // team vesting placeholder
            marketing,
            address(program)
        );

        app.setProgramAsAdmin(address(program));

        // Fund test users
        vm.deal(user1, 100 ether);
        vm.deal(user2, 100 ether);

        // Apply and approve user1
        vm.prank(user1);
        app.apply4EBT("user1", "pic", "tw", 100, "user1");
        app.approveUsers(_single("user1"));
        app.setUserScore("user1", 500);

        // Apply and approve user2
        vm.prank(user2);
        app.apply4EBT("user2", "pic", "tw", 100, "user2");
        app.approveUsers(_single("user2"));
        app.setUserScore("user2", 500);
    }

    // ============ TBA Lock on Approve Tests ============

    function testApproveLocksTBA() public {
        // Mint NFT
        vm.roll(5);
        vm.prank(user1);
        program.mint{value: MINT_PRICE}("user1");

        // Get TBA address
        address tba = program.getTBA(1);
        assertTrue(tba.code.length > 0, "TBA should be deployed");

        // Initially TBA should be unlocked
        assertFalse(program.isTBALocked(1), "TBA should start unlocked");

        // Approve marketplace to transfer NFT
        vm.prank(user1);
        program.approve(marketplace, 1);

        // TBA should now be locked
        assertTrue(program.isTBALocked(1), "TBA should be locked after approval");
    }

    function testApproveToZeroDoesNotLock() public {
        // Mint and approve marketplace
        vm.roll(5);
        vm.prank(user1);
        program.mint{value: MINT_PRICE}("user1");

        vm.prank(user1);
        program.approve(marketplace, 1);
        assertTrue(program.isTBALocked(1), "TBA should be locked");

        // Clear approval (approve to address(0))
        vm.prank(user1);
        program.approve(address(0), 1);

        // Approval cleared but TBA still locked (need to call requestUnlock)
        assertTrue(program.isTBALocked(1), "TBA should still be locked until requestUnlock");
    }

    // ============ TBA Unlock Tests ============

    function testRequestUnlockWhenNoApproval() public {
        // Mint and lock
        vm.roll(5);
        vm.prank(user1);
        program.mint{value: MINT_PRICE}("user1");

        vm.prank(user1);
        program.approve(marketplace, 1);
        assertTrue(program.isTBALocked(1), "TBA should be locked");

        // Clear approval
        vm.prank(user1);
        program.approve(address(0), 1);

        // Request unlock
        vm.prank(user1);
        program.requestUnlock(1);

        // TBA should be unlocked
        assertFalse(program.isTBALocked(1), "TBA should be unlocked");
    }

    function testCannotRequestUnlockWithActiveApproval() public {
        // Mint and lock
        vm.roll(5);
        vm.prank(user1);
        program.mint{value: MINT_PRICE}("user1");

        vm.prank(user1);
        program.approve(marketplace, 1);
        assertTrue(program.isTBALocked(1), "TBA should be locked");

        // Try to unlock without clearing approval - should fail
        vm.prank(user1);
        vm.expectRevert(EBTProgram.TBAStillApproved.selector);
        program.requestUnlock(1);
    }

    function testOnlyOwnerCanRequestUnlock() public {
        // Mint and lock
        vm.roll(5);
        vm.prank(user1);
        program.mint{value: MINT_PRICE}("user1");

        vm.prank(user1);
        program.approve(marketplace, 1);

        // Clear approval
        vm.prank(user1);
        program.approve(address(0), 1);

        // Non-owner tries to unlock - should fail
        vm.prank(user2);
        vm.expectRevert("Not token owner");
        program.requestUnlock(1);
    }

    function testCannotUnlockNonexistentToken() public {
        vm.prank(user1);
        vm.expectRevert(EBTProgram.TokenNotMinted.selector);
        program.requestUnlock(999);
    }

    function testCannotUnlockAlreadyUnlockedTBA() public {
        // Mint but don't approve (TBA is unlocked)
        vm.roll(5);
        vm.prank(user1);
        program.mint{value: MINT_PRICE}("user1");

        assertFalse(program.isTBALocked(1), "TBA should be unlocked");

        // Try to unlock already unlocked TBA
        vm.prank(user1);
        vm.expectRevert(EBTProgram.TBANotLocked.selector);
        program.requestUnlock(1);
    }

    // ============ Transfer Unlock Tests ============

    function testTransferUnlocksTBA() public {
        // Mint and lock
        vm.roll(5);
        vm.prank(user1);
        program.mint{value: MINT_PRICE}("user1");

        vm.prank(user1);
        program.approve(marketplace, 1);
        assertTrue(program.isTBALocked(1), "TBA should be locked");

        // Transfer NFT (marketplace executes sale)
        vm.prank(marketplace);
        program.transferFrom(user1, user2, 1);

        // After transfer, TBA should be unlocked for new owner
        assertFalse(program.isTBALocked(1), "TBA should be unlocked after transfer");
        assertEq(program.ownerOf(1), user2, "user2 should own the NFT");
    }

    function testSafeTransferUnlocksTBA() public {
        // Mint and lock
        vm.roll(5);
        vm.prank(user1);
        program.mint{value: MINT_PRICE}("user1");

        vm.prank(user1);
        program.approve(marketplace, 1);
        assertTrue(program.isTBALocked(1), "TBA should be locked");

        // Safe transfer NFT
        vm.prank(marketplace);
        program.safeTransferFrom(user1, user2, 1);

        // After transfer, TBA should be unlocked
        assertFalse(program.isTBALocked(1), "TBA should be unlocked after safe transfer");
    }

    // ============ Asset Lock Behavior Tests ============

    function testLockedTBABlocksTransfers() public {
        // Mint and send some tokens to TBA
        vm.roll(5);
        vm.prank(user1);
        program.mint{value: MINT_PRICE}("user1");

        address tba = program.getTBA(1);
        ERC6551Account tbaContract = ERC6551Account(payable(tba));

        // Lock the TBA
        vm.prank(user1);
        program.approve(marketplace, 1);
        assertTrue(program.isTBALocked(1), "TBA should be locked");

        // Try to transfer tokens from TBA - should fail
        vm.prank(user1);
        vm.expectRevert(ERC6551Account.AssetsAreLocked.selector);
        tbaContract.transferERC20(address(food), user1, 1000);
    }

    function testLockedTBABlocksExecuteCall() public {
        // Mint
        vm.roll(5);
        vm.prank(user1);
        program.mint{value: MINT_PRICE}("user1");

        address tba = program.getTBA(1);
        ERC6551Account tbaContract = ERC6551Account(payable(tba));

        // Lock the TBA
        vm.prank(user1);
        program.approve(marketplace, 1);

        // Try to execute arbitrary call - should fail
        vm.prank(user1);
        vm.expectRevert(ERC6551Account.AssetsAreLocked.selector);
        tbaContract.executeCall(address(food), 0, "");
    }

    function testUnlockedTBAAllowsTransfers() public {
        // Mint
        vm.roll(5);
        vm.prank(user1);
        program.mint{value: MINT_PRICE}("user1");

        address tba = program.getTBA(1);
        ERC6551Account tbaContract = ERC6551Account(payable(tba));

        // TBA should be unlocked
        assertFalse(program.isTBALocked(1), "TBA should be unlocked");

        // TBA has FOOD tokens from mint distribution
        uint256 tbaBalance = food.balanceOf(tba);
        assertTrue(tbaBalance > 0, "TBA should have tokens");

        // Transfer should succeed
        vm.prank(user1);
        tbaContract.transferERC20(address(food), user1, tbaBalance / 2);

        // Balance should be reduced
        assertEq(food.balanceOf(tba), tbaBalance / 2, "Transfer should succeed");
    }

    // ============ Multiple Approval Scenario Tests ============

    function testMultipleApprovalsKeepLocked() public {
        // Mint
        vm.roll(5);
        vm.prank(user1);
        program.mint{value: MINT_PRICE}("user1");

        // First approval
        vm.prank(user1);
        program.approve(marketplace, 1);
        assertTrue(program.isTBALocked(1), "TBA should be locked");

        // Second approval (replaces first)
        address marketplace2 = address(0xBEEF);
        vm.prank(user1);
        program.approve(marketplace2, 1);

        // Should still be locked
        assertTrue(program.isTBALocked(1), "TBA should remain locked");

        // Clear approval
        vm.prank(user1);
        program.approve(address(0), 1);

        // Now can unlock
        vm.prank(user1);
        program.requestUnlock(1);
        assertFalse(program.isTBALocked(1), "TBA should be unlocked");
    }

    // ============ Edge Cases ============

    function testLockIdempotent() public {
        // Mint
        vm.roll(5);
        vm.prank(user1);
        program.mint{value: MINT_PRICE}("user1");

        // Approve twice - lock should be called twice but remain in same state
        vm.prank(user1);
        program.approve(marketplace, 1);
        assertTrue(program.isTBALocked(1), "TBA should be locked");

        vm.prank(user1);
        program.approve(address(0xBEEF), 1);
        assertTrue(program.isTBALocked(1), "TBA should remain locked");
    }

    function testTBAStateAcrossOwnershipTransfers() public {
        // Mint and lock
        vm.roll(5);
        vm.prank(user1);
        program.mint{value: MINT_PRICE}("user1");

        vm.prank(user1);
        program.approve(marketplace, 1);
        assertTrue(program.isTBALocked(1), "TBA should be locked");

        // Transfer to user2
        vm.prank(marketplace);
        program.transferFrom(user1, user2, 1);

        // User2 gets unlocked TBA
        assertFalse(program.isTBALocked(1), "New owner gets unlocked TBA");

        // User2 can use TBA
        address tba = program.getTBA(1);
        uint256 balance = food.balanceOf(tba);

        vm.prank(user2);
        ERC6551Account(payable(tba)).transferERC20(address(food), user2, balance / 2);

        // User2 approves for new sale
        vm.prank(user2);
        program.approve(marketplace, 1);
        assertTrue(program.isTBALocked(1), "TBA should be locked again");
    }

    function testIsTBALockedViewFunction() public {
        // Nonexistent token
        assertFalse(program.isTBALocked(999), "Nonexistent token should return false");

        // Mint
        vm.roll(5);
        vm.prank(user1);
        program.mint{value: MINT_PRICE}("user1");

        // Unlocked state
        assertFalse(program.isTBALocked(1), "Should be unlocked initially");

        // Locked state
        vm.prank(user1);
        program.approve(marketplace, 1);
        assertTrue(program.isTBALocked(1), "Should be locked after approval");
    }

    // ============ TBA Direct Lock/Unlock Security Tests ============

    function testOnlyNFTContractCanLockTBA() public {
        // Mint
        vm.roll(5);
        vm.prank(user1);
        program.mint{value: MINT_PRICE}("user1");

        address tba = program.getTBA(1);
        ERC6551Account tbaContract = ERC6551Account(payable(tba));

        // Try to lock directly as user - should fail
        vm.prank(user1);
        vm.expectRevert(ERC6551Account.OnlyNFTContract.selector);
        tbaContract.lockAssets();

        // Try to lock directly as random address - should fail
        vm.prank(address(0xBAD));
        vm.expectRevert(ERC6551Account.OnlyNFTContract.selector);
        tbaContract.lockAssets();
    }

    function testOnlyNFTContractCanUnlockTBA() public {
        // Mint and lock via approval
        vm.roll(5);
        vm.prank(user1);
        program.mint{value: MINT_PRICE}("user1");

        vm.prank(user1);
        program.approve(marketplace, 1);

        address tba = program.getTBA(1);
        ERC6551Account tbaContract = ERC6551Account(payable(tba));

        // Try to unlock directly as user - should fail
        vm.prank(user1);
        vm.expectRevert(ERC6551Account.OnlyNFTContract.selector);
        tbaContract.unlockAssets();

        // Try to unlock directly as owner (NFT owner) - should fail
        vm.prank(user1);
        vm.expectRevert(ERC6551Account.OnlyNFTContract.selector);
        tbaContract.unlockAssets();
    }

    // ============ Event Tests ============

    function testTBALockedEvent() public {
        // Mint
        vm.roll(5);
        vm.prank(user1);
        program.mint{value: MINT_PRICE}("user1");

        address tba = program.getTBA(1);

        // Expect TBALocked event
        vm.expectEmit(true, true, true, true);
        emit EBTProgram.TBALocked(1, tba, marketplace);

        vm.prank(user1);
        program.approve(marketplace, 1);
    }

    function testTBAUnlockedEventOnRequestUnlock() public {
        // Mint and lock
        vm.roll(5);
        vm.prank(user1);
        program.mint{value: MINT_PRICE}("user1");

        vm.prank(user1);
        program.approve(marketplace, 1);

        // Clear approval
        vm.prank(user1);
        program.approve(address(0), 1);

        address tba = program.getTBA(1);

        // Expect TBAUnlocked event
        vm.expectEmit(true, true, true, true);
        emit EBTProgram.TBAUnlocked(1, tba);

        vm.prank(user1);
        program.requestUnlock(1);
    }

    function testTBAUnlockedEventOnTransfer() public {
        // Mint and lock
        vm.roll(5);
        vm.prank(user1);
        program.mint{value: MINT_PRICE}("user1");

        vm.prank(user1);
        program.approve(marketplace, 1);

        address tba = program.getTBA(1);

        // Expect TBAUnlocked event during transfer
        vm.expectEmit(true, true, true, true);
        emit EBTProgram.TBAUnlocked(1, tba);

        vm.prank(marketplace);
        program.transferFrom(user1, user2, 1);
    }

    // ============ Helpers ============

    function _single(string memory id) internal pure returns (string[] memory ids) {
        ids = new string[](1);
        ids[0] = id;
    }
}

/// @title TBA Locking Fuzz Tests
/// @notice Fuzz tests for edge cases in TBA locking
contract TBALockingFuzzTest is Test {
    EBTProgram internal program;
    EBTApplication internal app;
    FoodStamps internal food;
    LiquidityVault internal vault;
    ERC6551Registry internal registry;
    ERC6551Account internal accountImpl;

    function setUp() public {
        app = new EBTApplication();
        food = new FoodStamps();
        registry = new ERC6551Registry();
        accountImpl = new ERC6551Account();
        vault = new LiquidityVault(address(food));

        program = new EBTProgram(address(registry), address(app));

        registry.setImplementation(address(accountImpl));
        registry.transferOwnership(address(program));

        program.initialize(
            address(vault),
            address(0xCAFE),
            address(0x1234),
            address(0x5678),
            address(0x9ABC),
            address(accountImpl),
            address(food)
        );

        vault.setEBTProgram(address(program));
        food.initialDistribution(
            address(vault),
            address(0x100),
            address(0x5678),
            address(program)
        );
        app.setProgramAsAdmin(address(program));
    }

    function testFuzzApproveAddress(address approvedTo) public {
        // Set up user first so we can exclude it from fuzz
        address user = address(0x1111);

        vm.assume(approvedTo != address(0));
        vm.assume(approvedTo != address(program));
        vm.assume(approvedTo != user); // Can't approve current owner (ERC721 restriction)
        vm.deal(user, 1 ether);
        string memory userId = "fuzzUser";

        vm.prank(user);
        app.apply4EBT("fuzz", "pic", "tw", 100, userId);
        string[] memory ids = new string[](1);
        ids[0] = userId;
        app.approveUsers(ids);

        vm.roll(5);
        vm.prank(user);
        program.mint{value: 0.02 ether}(userId);

        // Approve random address - should lock TBA
        vm.prank(user);
        program.approve(approvedTo, 1);

        assertTrue(program.isTBALocked(1), "TBA should be locked for any non-zero approval");
    }

    function testFuzzTransferUnlocksForAnyRecipient(address recipient) public {
        vm.assume(recipient != address(0));
        vm.assume(recipient.code.length == 0); // EOA only for safeTransferFrom

        address user = address(0x1111);
        address marketplace = address(0xDEAD);
        vm.deal(user, 1 ether);

        vm.prank(user);
        app.apply4EBT("fuzz2", "pic", "tw", 100, "fuzz2");
        string[] memory ids = new string[](1);
        ids[0] = "fuzz2";
        app.approveUsers(ids);

        vm.roll(5);
        vm.prank(user);
        program.mint{value: 0.02 ether}("fuzz2");

        vm.prank(user);
        program.approve(marketplace, 1);
        assertTrue(program.isTBALocked(1), "TBA should be locked");

        vm.prank(marketplace);
        program.transferFrom(user, recipient, 1);

        assertFalse(program.isTBALocked(1), "TBA should be unlocked after transfer to any address");
    }
}

/// @title TBA Locking Penetration Tests
/// @notice Security-focused tests to find exploits in TBA locking
contract TBALockingPenetrationTest is Test {
    EBTProgram internal program;
    EBTApplication internal app;
    FoodStamps internal food;
    LiquidityVault internal vault;
    ERC6551Registry internal registry;
    ERC6551Account internal accountImpl;

    address internal user1 = address(0x1);
    address internal attacker = address(0xBAD);
    address internal marketplace = address(0xDEAD);

    function setUp() public {
        app = new EBTApplication();
        food = new FoodStamps();
        registry = new ERC6551Registry();
        accountImpl = new ERC6551Account();
        vault = new LiquidityVault(address(food));

        program = new EBTProgram(address(registry), address(app));

        registry.setImplementation(address(accountImpl));
        registry.transferOwnership(address(program));

        program.initialize(
            address(vault),
            address(0xCAFE),
            address(0x1234),
            address(0x5678),
            address(0x9ABC),
            address(accountImpl),
            address(food)
        );

        vault.setEBTProgram(address(program));
        food.initialDistribution(
            address(vault),
            address(0x100),
            address(0x5678),
            address(program)
        );
        app.setProgramAsAdmin(address(program));

        vm.deal(user1, 100 ether);
        vm.deal(attacker, 100 ether);

        vm.prank(user1);
        app.apply4EBT("user1", "pic", "tw", 100, "user1");
        string[] memory ids = new string[](1);
        ids[0] = "user1";
        app.approveUsers(ids);
    }

    /// @notice Test: Attacker cannot unlock someone else's TBA
    function testAttackerCannotUnlockOthersTBA() public {
        // User mints and locks
        vm.roll(5);
        vm.prank(user1);
        program.mint{value: 0.02 ether}("user1");

        vm.prank(user1);
        program.approve(marketplace, 1);
        assertTrue(program.isTBALocked(1));

        // User clears approval
        vm.prank(user1);
        program.approve(address(0), 1);

        // Attacker tries to unlock - should fail
        vm.prank(attacker);
        vm.expectRevert("Not token owner");
        program.requestUnlock(1);
    }

    /// @notice Test: Attacker cannot directly call lockAssets on TBA
    function testAttackerCannotDirectlyLockTBA() public {
        vm.roll(5);
        vm.prank(user1);
        program.mint{value: 0.02 ether}("user1");

        address tba = program.getTBA(1);
        ERC6551Account tbaContract = ERC6551Account(payable(tba));

        vm.prank(attacker);
        vm.expectRevert(ERC6551Account.OnlyNFTContract.selector);
        tbaContract.lockAssets();
    }

    /// @notice Test: Attacker cannot directly call unlockAssets on TBA
    function testAttackerCannotDirectlyUnlockTBA() public {
        vm.roll(5);
        vm.prank(user1);
        program.mint{value: 0.02 ether}("user1");

        vm.prank(user1);
        program.approve(marketplace, 1);

        address tba = program.getTBA(1);
        ERC6551Account tbaContract = ERC6551Account(payable(tba));

        vm.prank(attacker);
        vm.expectRevert(ERC6551Account.OnlyNFTContract.selector);
        tbaContract.unlockAssets();
    }

    /// @notice Test: Seller cannot drain TBA between listing and sale
    function testSellerCannotDrainTBAWhileListed() public {
        vm.roll(5);
        vm.prank(user1);
        program.mint{value: 0.02 ether}("user1");

        address tba = program.getTBA(1);
        uint256 tbaBalance = food.balanceOf(tba);
        assertTrue(tbaBalance > 0, "TBA should have tokens");

        // List NFT (approve marketplace)
        vm.prank(user1);
        program.approve(marketplace, 1);

        // Try to drain TBA - should fail
        vm.prank(user1);
        vm.expectRevert(ERC6551Account.AssetsAreLocked.selector);
        ERC6551Account(payable(tba)).transferERC20(address(food), user1, tbaBalance);

        // Balance unchanged
        assertEq(food.balanceOf(tba), tbaBalance, "TBA balance should be unchanged");
    }

    /// @notice Test: Seller cannot use executeCall to drain TBA while listed
    function testSellerCannotUseExecuteCallWhileListed() public {
        vm.roll(5);
        vm.prank(user1);
        program.mint{value: 0.02 ether}("user1");

        address tba = program.getTBA(1);

        // List NFT
        vm.prank(user1);
        program.approve(marketplace, 1);

        // Try to execute arbitrary call - should fail
        bytes memory transferCall = abi.encodeWithSignature(
            "transfer(address,uint256)",
            user1,
            1000e18
        );

        vm.prank(user1);
        vm.expectRevert(ERC6551Account.AssetsAreLocked.selector);
        ERC6551Account(payable(tba)).executeCall(address(food), 0, transferCall);
    }

    /// @notice Test: Race condition - approve and drain in same block
    function testCannotApproveAndDrainInSameBlock() public {
        vm.roll(5);
        vm.prank(user1);
        program.mint{value: 0.02 ether}("user1");

        address tba = program.getTBA(1);
        uint256 tbaBalance = food.balanceOf(tba);

        // Try to approve and drain in same transaction
        // The approve will lock the TBA before any drain can happen
        vm.startPrank(user1);
        program.approve(marketplace, 1);

        // Immediate drain attempt fails
        vm.expectRevert(ERC6551Account.AssetsAreLocked.selector);
        ERC6551Account(payable(tba)).transferERC20(address(food), user1, tbaBalance);
        vm.stopPrank();
    }

    /// @notice Test: Buyer receives TBA with assets intact
    function testBuyerReceivesTBAWithAssetsIntact() public {
        vm.roll(5);
        vm.prank(user1);
        program.mint{value: 0.02 ether}("user1");

        address tba = program.getTBA(1);
        uint256 originalBalance = food.balanceOf(tba);

        // Seller lists
        vm.prank(user1);
        program.approve(marketplace, 1);

        // Marketplace executes sale
        address buyer = address(0xBEEF);
        vm.prank(marketplace);
        program.transferFrom(user1, buyer, 1);

        // Buyer owns NFT
        assertEq(program.ownerOf(1), buyer);

        // TBA balance intact
        assertEq(food.balanceOf(tba), originalBalance, "Buyer should receive all TBA assets");

        // TBA unlocked for new owner
        assertFalse(program.isTBALocked(1));

        // New owner can use assets
        vm.prank(buyer);
        ERC6551Account(payable(tba)).transferERC20(address(food), buyer, originalBalance / 2);
    }

    /// @notice Test: Attacker cannot spoof NFT contract address
    function testCannotSpoofNFTContract() public {
        vm.roll(5);
        vm.prank(user1);
        program.mint{value: 0.02 ether}("user1");

        address tba = program.getTBA(1);

        // Create a fake "NFT contract" that tries to unlock
        FakeNFTContract fake = new FakeNFTContract();

        // Even if attacker deploys at same address (impossible but testing anyway)
        // The TBA validates against its stored token contract address
        vm.prank(address(fake));
        vm.expectRevert(ERC6551Account.OnlyNFTContract.selector);
        ERC6551Account(payable(tba)).unlockAssets();
    }
}

/// @notice Malicious contract that tries to unlock TBAs
contract FakeNFTContract {
    function tryUnlock(address tba) external {
        ERC6551Account(payable(tba)).unlockAssets();
    }
}
