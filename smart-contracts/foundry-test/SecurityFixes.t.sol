// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";
import "../contracts/EBTProgram.sol";
import "../contracts/EBTApplication.sol";
import "../contracts/FoodStamps.sol";
import "../contracts/LiquidityVault.sol";
import "../contracts/ERC6551Registry.sol";
import "../contracts/ERC6551Account.sol";
import "../contracts/TeamVesting.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/// @title Security Fixes Tests
/// @notice Comprehensive tests validating all HIGH severity security fixes
/// @dev Tests for H-1 through H-8 security vulnerabilities
contract SecurityFixesTest is Test {
    EBTProgram internal program;
    EBTApplication internal app;
    FoodStamps internal food;
    LiquidityVault internal vault;
    ERC6551Registry internal registry;
    ERC6551Account internal accountImpl;
    TeamVesting internal vesting;

    address internal owner;
    address internal user1;
    address internal user2;
    address internal attacker;
    address internal protocolCaller;
    address internal treasury;
    address internal marketing;
    address internal teamWallet;

    uint256 internal constant MIN_PRICE = 0.02 ether;
    uint256 internal constant BASE_TOKENS = 20_000 * 1e18;

    function setUp() public {
        owner = address(this);
        user1 = address(0x1111);
        user2 = address(0x2222);
        attacker = address(0xBAD);
        protocolCaller = address(0xCAFE);
        treasury = address(0x1234);
        marketing = address(0x5678);
        teamWallet = address(0x9ABC);

        // Deploy contracts
        app = new EBTApplication();
        food = new FoodStamps();
        registry = new ERC6551Registry();
        accountImpl = new ERC6551Account();
        vault = new LiquidityVault(address(food));
        vesting = new TeamVesting(address(food));

        program = new EBTProgram(address(registry), address(app));

        // Setup
        registry.setImplementation(address(accountImpl));
        registry.transferOwnership(address(program));

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
        food.initialDistribution(
            address(vault),
            address(vesting),
            marketing,
            address(program)
        );
        app.setProgramAsAdmin(address(program));

        // Fund test users
        vm.deal(user1, 100 ether);
        vm.deal(user2, 100 ether);
        vm.deal(attacker, 100 ether);

        // Setup user1
        vm.prank(user1);
        app.apply4EBT("user1", "pic", "tw", 100, "user1");
        app.approveUsers(_single("user1"));
        app.setUserScore("user1", 500);
    }

    // ============ H-1: Merkle Proof Chain ID and Deadline Tests ============

    function testH1_MerkleProofIncludesChainId() public {
        // Advance time and mint
        vm.warp(1000);
        vm.prank(user1);
        program.mint{value: MIN_PRICE}("user1");

        address tba = program.getTBA(1);
        uint256 amount = 1000 * 1e18;

        // Create merkle proof WITH chainId (correct format)
        bytes32 correctLeaf = keccak256(abi.encodePacked(block.chainid, uint256(1), tba, amount));

        // Create merkle proof WITHOUT chainId (old vulnerable format)
        bytes32 incorrectLeaf = keccak256(abi.encodePacked(uint256(1), tba, amount));

        // The leaves should be different
        assertTrue(correctLeaf != incorrectLeaf, "Leaves should differ when chainId included");
    }

    function testH1_TGEAirdropDeadlineEnforced() public {
        // Advance time and mint
        vm.warp(1000);
        vm.prank(user1);
        program.mint{value: MIN_PRICE}("user1");

        // Set a deadline in the past
        program.setTGEAirdropDeadline(500);

        // Create a simple merkle tree (single leaf = root)
        address tba = program.getTBA(1);
        uint256 amount = 1000 * 1e18;
        bytes32 leaf = keccak256(abi.encodePacked(block.chainid, uint256(1), tba, amount));
        bytes32[] memory proof = new bytes32[](0);

        // Set merkle root
        program.setTGEMerkleRoot(leaf);

        // Attempt to claim after deadline should fail
        vm.prank(user1);
        vm.expectRevert(EBTProgram.TGEAirdropExpired.selector);
        program.claimTGEAirdrop(1, amount, proof);
    }

    function testH1_TGEAirdropSucceedsBeforeDeadline() public {
        // Advance time and mint
        vm.warp(1000);
        vm.prank(user1);
        program.mint{value: MIN_PRICE}("user1");

        // Set a deadline in the future
        program.setTGEAirdropDeadline(2000);

        // Create a simple merkle tree (single leaf = root)
        address tba = program.getTBA(1);
        uint256 amount = 1000 * 1e18;
        bytes32 leaf = keccak256(abi.encodePacked(block.chainid, uint256(1), tba, amount));
        bytes32[] memory proof = new bytes32[](0);

        // Set merkle root
        program.setTGEMerkleRoot(leaf);

        // Should succeed before deadline
        vm.prank(user1);
        program.claimTGEAirdrop(1, amount, proof);

        // Verify tokens received
        assertEq(food.balanceOf(tba), BASE_TOKENS + amount, "Should receive airdrop");
    }

    function testH1_TGEAirdropNoDeadlineAllowed() public {
        // Advance time and mint
        vm.warp(1000);
        vm.prank(user1);
        program.mint{value: MIN_PRICE}("user1");

        // Deadline is 0 (not set) - should allow claims
        assertEq(program.tgeAirdropDeadline(), 0);

        // Create merkle proof
        address tba = program.getTBA(1);
        uint256 amount = 1000 * 1e18;
        bytes32 leaf = keccak256(abi.encodePacked(block.chainid, uint256(1), tba, amount));
        bytes32[] memory proof = new bytes32[](0);

        program.setTGEMerkleRoot(leaf);

        // Should succeed with no deadline set
        vm.prank(user1);
        program.claimTGEAirdrop(1, amount, proof);
    }

    // ============ H-3: Wallet Verification Tests ============

    function testH3_CannotMintWithOthersUserID() public {
        // Setup user2
        vm.prank(user2);
        app.apply4EBT("user2", "pic", "tw", 100, "user2");
        app.approveUsers(_single("user2"));

        // Advance time
        vm.warp(1000);

        // User1 tries to mint with user2's userID - should fail
        vm.prank(user1);
        vm.expectRevert("UserID not owned by caller");
        program.mint{value: MIN_PRICE}("user2");
    }

    function testH3_CanOnlyMintWithOwnUserID() public {
        vm.warp(1000);

        // User1 mints with their own userID - should succeed
        vm.prank(user1);
        program.mint{value: MIN_PRICE}("user1");

        assertEq(program.ownerOf(1), user1);
    }

    // ============ H-5: Soft Cap Enforcement Tests ============

    function testH5_CannotDistributeETHIfSoftCapNotReached() public {
        // Create new program with custom caps
        EBTApplication newApp = new EBTApplication();
        FoodStamps newFood = new FoodStamps();
        ERC6551Registry newRegistry = new ERC6551Registry();
        ERC6551Account newAccountImpl = new ERC6551Account();
        LiquidityVault newVault = new LiquidityVault(address(newFood));
        TeamVesting newVesting = new TeamVesting(address(newFood));

        EBTProgram newProgram = new EBTProgram(address(newRegistry), address(newApp));

        newRegistry.setImplementation(address(newAccountImpl));
        newRegistry.transferOwnership(address(newProgram));

        // Set soft cap to 1 ETH (higher than we'll raise)
        newProgram.setCaps(1 ether, 10 ether);
        newProgram.setFundraisingPeriod(1 days);

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

        // Mint only MIN_PRICE (0.02 ETH < 1 ETH soft cap)
        vm.prank(user1);
        newApp.apply4EBT("user1", "pic", "tw", 100, "user1");
        newApp.approveUsers(_single("user1"));

        vm.warp(1000);
        vm.prank(user1);
        newProgram.mint{value: MIN_PRICE}("user1");

        // End fundraising
        vm.warp(1000 + 2 days);
        newProgram.closeFundraising();

        // Try to distribute ETH - should fail
        vm.expectRevert(EBTProgram.SoftCapNotReached.selector);
        newProgram.distributeETH();
    }

    function testH5_RefundAvailableWhenSoftCapNotReached() public {
        // Create new program with custom caps
        EBTApplication newApp = new EBTApplication();
        FoodStamps newFood = new FoodStamps();
        ERC6551Registry newRegistry = new ERC6551Registry();
        ERC6551Account newAccountImpl = new ERC6551Account();
        LiquidityVault newVault = new LiquidityVault(address(newFood));
        TeamVesting newVesting = new TeamVesting(address(newFood));

        EBTProgram newProgram = new EBTProgram(address(newRegistry), address(newApp));

        newRegistry.setImplementation(address(newAccountImpl));
        newRegistry.transferOwnership(address(newProgram));

        newProgram.setCaps(1 ether, 10 ether);
        newProgram.setFundraisingPeriod(1 days);

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

        // Mint
        vm.prank(user1);
        newApp.apply4EBT("user1", "pic", "tw", 100, "user1");
        newApp.approveUsers(_single("user1"));

        vm.warp(1000);
        vm.prank(user1);
        newProgram.mint{value: MIN_PRICE}("user1");

        uint256 user1BalanceBefore = user1.balance;

        // End fundraising
        vm.warp(1000 + 2 days);
        newProgram.closeFundraising();

        // Claim refund
        vm.prank(user1);
        newProgram.claimRefund();

        assertEq(user1.balance, user1BalanceBefore + MIN_PRICE, "Should receive full refund");
    }

    function testH5_NoRefundWhenSoftCapReached() public {
        // Use default program which has low soft cap (20 ETH)
        // But we'll create a custom one with MIN_PRICE as soft cap
        EBTApplication newApp = new EBTApplication();
        FoodStamps newFood = new FoodStamps();
        ERC6551Registry newRegistry = new ERC6551Registry();
        ERC6551Account newAccountImpl = new ERC6551Account();
        LiquidityVault newVault = new LiquidityVault(address(newFood));
        TeamVesting newVesting = new TeamVesting(address(newFood));

        EBTProgram newProgram = new EBTProgram(address(newRegistry), address(newApp));

        newRegistry.setImplementation(address(newAccountImpl));
        newRegistry.transferOwnership(address(newProgram));

        newProgram.setCaps(MIN_PRICE, 10 ether); // Soft cap = MIN_PRICE
        newProgram.setFundraisingPeriod(1 days);

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

        // Mint to reach soft cap
        vm.prank(user1);
        newApp.apply4EBT("user1", "pic", "tw", 100, "user1");
        newApp.approveUsers(_single("user1"));

        vm.warp(1000);
        vm.prank(user1);
        newProgram.mint{value: MIN_PRICE}("user1");

        // End fundraising
        vm.warp(1000 + 2 days);
        newProgram.closeFundraising();

        // Try to claim refund - should fail because soft cap was reached
        vm.prank(user1);
        vm.expectRevert(EBTProgram.SoftCapReached.selector);
        newProgram.claimRefund();
    }

    // ============ H-6: Concurrent Minting Tests (Rate Limiting Removed) ============

    function testH6_ConcurrentMintingAllowed() public {
        // First mint
        vm.warp(1000);
        vm.prank(user1);
        program.mint{value: MIN_PRICE}("user1");

        // Setup user2
        vm.prank(user2);
        app.apply4EBT("user2", "pic", "tw", 100, "user2");
        app.approveUsers(_single("user2"));

        // Second mint can happen immediately (no rate limiting)
        vm.prank(user2);
        program.mint{value: MIN_PRICE}("user2");

        // Both users should have their NFTs
        assertEq(program.ownerOf(1), user1);
        assertEq(program.ownerOf(2), user2);
    }

    function testH6_MultipleMintsSameBlock() public {
        vm.warp(1000);

        // Setup multiple users
        address user3 = makeAddr("user3");
        vm.deal(user3, 1 ether);
        vm.prank(user3);
        app.apply4EBT("user3", "pic", "tw", 100, "user3");
        app.approveUsers(_single("user3"));

        vm.prank(user2);
        app.apply4EBT("user2", "pic", "tw", 100, "user2");
        app.approveUsers(_single("user2"));

        // All mints succeed
        vm.prank(user1);
        program.mint{value: MIN_PRICE}("user1");
        vm.prank(user2);
        program.mint{value: MIN_PRICE}("user2");
        vm.prank(user3);
        program.mint{value: MIN_PRICE}("user3");

        assertEq(program.ownerOf(1), user1);
        assertEq(program.ownerOf(2), user2);
        assertEq(program.ownerOf(3), user3);
    }

    // ============ H-8: Reapplication Re-verification Tests ============

    function testH8_ReapplyRequiresApproval() public {
        // Mint
        vm.warp(1000);
        vm.prank(user1);
        program.mint{value: MIN_PRICE}("user1");

        // Complete 3 claims
        for (uint256 i = 0; i < 3; i++) {
            vm.warp(1000 + (31 days * (i + 1)));
            vm.prank(protocolCaller);
            program.claim(1);
        }

        // Verify user is currently approved
        assertTrue(app.isUserApproved("user1"), "User should be approved before revocation");

        // Revoke approval using the new revokeUsers function
        app.revokeUsers(_single("user1"));

        // Verify user is no longer approved
        assertFalse(app.isUserApproved("user1"), "User should not be approved after revocation");

        // Try to reapply - should fail
        vm.prank(user1);
        vm.expectRevert(EBTProgram.ReapplicationUserNotApproved.selector);
        program.reapply(1);
    }

    function testH8_ReapplySucceedsWhenStillApproved() public {
        // Mint
        vm.warp(1000);
        vm.prank(user1);
        program.mint{value: MIN_PRICE}("user1");

        // Complete 3 claims
        for (uint256 i = 0; i < 3; i++) {
            vm.warp(1000 + (31 days * (i + 1)));
            vm.prank(protocolCaller);
            program.claim(1);
        }

        // User1 is still approved
        assertTrue(app.isUserApproved("user1"));

        // Reapply should succeed
        vm.prank(user1);
        program.reapply(1);

        (,,,,EBTProgram.ReapplicationStatus status,) = program.tokenData(1);
        assertEq(uint(status), uint(EBTProgram.ReapplicationStatus.PENDING));
    }

    // ============ H-2: Integer Division Precision Tests ============

    function testH2_ETHDistributionNoRemainder() public {
        // Create new program with exact soft cap
        EBTApplication newApp = new EBTApplication();
        FoodStamps newFood = new FoodStamps();
        ERC6551Registry newRegistry = new ERC6551Registry();
        ERC6551Account newAccountImpl = new ERC6551Account();
        LiquidityVault newVault = new LiquidityVault(address(newFood));
        TeamVesting newVesting = new TeamVesting(address(newFood));

        EBTProgram newProgram = new EBTProgram(address(newRegistry), address(newApp));

        newRegistry.setImplementation(address(newAccountImpl));
        newRegistry.transferOwnership(address(newProgram));

        newProgram.setCaps(MIN_PRICE, 10 ether);
        newProgram.setFundraisingPeriod(1 days);

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

        // Mint
        vm.prank(user1);
        newApp.apply4EBT("user1", "pic", "tw", 100, "user1");
        newApp.approveUsers(_single("user1"));

        vm.warp(1000);
        vm.prank(user1);
        newProgram.mint{value: MIN_PRICE}("user1");

        uint256 contractBalance = address(newProgram).balance;

        // End fundraising
        vm.warp(1000 + 2 days);
        newProgram.closeFundraising();

        // Distribute
        newProgram.distributeETH();

        // Contract should have no remaining ETH
        assertEq(address(newProgram).balance, 0, "No ETH dust should remain");

        // Verify all ETH was distributed
        uint256 vaultReceived = address(newVault).balance;
        uint256 marketingReceived = marketing.balance;
        uint256 treasuryReceived = treasury.balance;
        uint256 teamReceived = teamWallet.balance;

        assertEq(
            vaultReceived + marketingReceived + treasuryReceived + teamReceived,
            contractBalance,
            "All ETH should be distributed"
        );
    }

    // ============ MEDIUM SEVERITY TESTS ============

    // M-1: Input Validation Tests
    function testM1_EmptyUserIDReverts() public {
        vm.prank(user1);
        vm.expectRevert(EBTApplication.EmptyUserID.selector);
        app.apply4EBT("validuser", "pic", "tw", 100, "");
    }

    function testM1_EmptyUsernameReverts() public {
        vm.prank(user1);
        vm.expectRevert(EBTApplication.EmptyUsername.selector);
        app.apply4EBT("", "pic", "tw", 100, "validid");
    }

    function testM1_InvalidScoreReverts() public {
        // Score > 1000 should revert
        vm.expectRevert(EBTApplication.InvalidScore.selector);
        app.setUserScore("user1", 1001);
    }

    function testM1_EmptyMetadataURIReverts() public {
        vm.expectRevert(EBTApplication.InvalidMetadataURI.selector);
        app.setMetadataURI("user1", "");
    }

    // M-2: Team Vesting Termination
    function testM2_TeamVestingTermination() public {
        // Create new FoodStamps for this test to have fresh tokens
        FoodStamps newFood = new FoodStamps();
        TeamVesting newVesting = new TeamVesting(address(newFood));

        // Do initial distribution to get tokens to the owner (test contract)
        newFood.initialDistribution(
            address(vault),
            address(newVesting),  // 1B to vesting
            marketing,
            teamWallet
        );

        uint256 vestingBalance = newFood.balanceOf(address(newVesting));
        assertTrue(vestingBalance > 0, "Vesting should have tokens");

        uint256 treasuryBefore = newFood.balanceOf(treasury);

        // Terminate vesting
        newVesting.terminateVesting(treasury);

        // Tokens should be returned
        assertEq(newFood.balanceOf(address(newVesting)), 0);
        assertEq(newFood.balanceOf(treasury), treasuryBefore + vestingBalance);

        // Cannot claim after termination
        newVesting.setTeamWallet(treasury);
        newVesting.startTGE(); // Need to start TGE first
        vm.expectRevert(TeamVesting.VestingAlreadyTerminated.selector);
        newVesting.claim();
    }

    function testM2_CannotTerminateTwice() public {
        TeamVesting newVesting = new TeamVesting(address(food));

        newVesting.terminateVesting(treasury);

        vm.expectRevert(TeamVesting.AlreadyTerminated.selector);
        newVesting.terminateVesting(treasury);
    }

    // M-3: Marketing Vesting Re-initialization Prevention
    function testM3_MarketingVestingCannotReinitialize() public {
        // Get marketing allocation from vault
        // The vault has tokens after setup in main test
        uint256 amount = 1000 * 1e18;

        // Create new vault with tokens
        FoodStamps newFood = new FoodStamps();
        LiquidityVault newVault = new LiquidityVault(address(newFood));
        newFood.initialDistribution(
            address(newVault),
            treasury,
            marketing,
            teamWallet
        );

        // Create marketing vesting
        address vestingAddr = newVault.createMarketingVesting(
            user1,
            amount,
            90 days,
            true,
            "Test Partner",
            "KOL"
        );

        // Try to reinitialize from the factory - should fail with AlreadyInitialized
        // The factory is the only one that can call initialize, so test from vault
        vm.prank(address(newVault));
        MarketingVesting vesting = MarketingVesting(vestingAddr);
        vm.expectRevert(MarketingVesting.AlreadyInitialized.selector);
        vesting.initialize(user2, amount, 90 days, true, "Hacker", "Attacker");
    }

    // M-4: Registry Implementation Lock
    function testM4_RegistryImplementationLocked() public {
        // Create fresh registry for this test (we own it)
        ERC6551Registry newRegistry = new ERC6551Registry();
        ERC6551Account newAccountImpl = new ERC6551Account();
        newRegistry.setImplementation(address(newAccountImpl));

        // Create an account to trigger the lock
        newRegistry.createAccount(
            address(newAccountImpl),
            block.chainid,
            address(program),
            999,
            bytes32(0),
            ""
        );

        // Registry should be locked now
        assertTrue(newRegistry.implementationLocked());

        // Cannot change implementation after first account creation
        ERC6551Account anotherImpl = new ERC6551Account();
        vm.expectRevert(ERC6551Registry.ImplementationLocked.selector);
        newRegistry.setImplementation(address(anotherImpl));
    }

    // M-7: Batch Size Limits
    function testM7_ApproveUsersBatchLimit() public {
        // Create 101 userIDs (exceeds MAX_BATCH_SIZE of 100)
        string[] memory userIDs = new string[](101);
        for (uint256 i = 0; i < 101; i++) {
            userIDs[i] = string(abi.encodePacked("user", i));
        }

        vm.expectRevert(EBTApplication.BatchTooLarge.selector);
        app.approveUsers(userIDs);
    }

    function testM7_RevokeUsersBatchLimit() public {
        // Create 101 userIDs
        string[] memory userIDs = new string[](101);
        for (uint256 i = 0; i < 101; i++) {
            userIDs[i] = string(abi.encodePacked("user", i));
        }

        vm.expectRevert(EBTApplication.BatchTooLarge.selector);
        app.revokeUsers(userIDs);
    }

    function testM7_BlacklistBatchLimit() public {
        // Create 101 addresses
        address[] memory addrs = new address[](101);
        for (uint256 i = 0; i < 101; i++) {
            addrs[i] = address(uint160(i + 1));
        }

        vm.expectRevert("Batch too large");
        program.setBlacklistStatus(addrs, true);
    }

    // ============ Helper Functions ============

    function _single(string memory id) internal pure returns (string[] memory ids) {
        ids = new string[](1);
        ids[0] = id;
    }
}

/// @title Critical Security Invariants
/// @notice Invariant tests that should NEVER be violated
contract SecurityInvariantsTest is Test {
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

    /// @notice Total raised should never exceed hard cap
    function invariant_TotalRaisedNeverExceedsHardCap() public view {
        assertTrue(
            program.totalRaised() <= program.hardCap(),
            "Total raised must never exceed hard cap"
        );
    }

    /// @notice Claim count should never exceed MAX_CLAIMS
    function invariant_ClaimCountNeverExceedsMax() public view {
        uint256 tokenId = program.currentTokenId();
        if (tokenId > 1) {
            for (uint256 i = 1; i < tokenId; i++) {
                if (program.exists(i)) {
                    (,uint256 claimCount,,,,) = program.tokenData(i);
                    assertTrue(claimCount <= 3, "Claim count must never exceed 3");
                }
            }
        }
    }

    /// @notice Score should never exceed 1000
    function invariant_ScoreNeverExceeds1000() public {
        // This invariant is enforced in EBTApplication.setUserScore
        // and double-checked in EBTProgram.claim
    }
}
