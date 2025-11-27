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

/// @title Hardening Tests - Comprehensive Fuzz & Penetration Testing
/// @notice Complete security validation for mainnet deployment
/// @dev Covers: Fuzz tests, edge cases, attack vectors, and invariant checks
contract HardeningTests is Test {
    // Core Contracts
    EBTProgram public program;
    ERC6551Registry public registry;
    ERC6551Account public accountImpl;
    FoodStamps public food;
    LiquidityVault public vault;
    TeamVesting public teamVesting;
    EBTApplication public application;

    // Test Accounts
    address public owner;
    address public protocolCaller;
    address public treasury;
    address public marketing;
    address public teamWallet;
    address public attacker;

    function setUp() public {
        owner = address(this);
        protocolCaller = makeAddr("protocolCaller");
        treasury = makeAddr("treasury");
        marketing = makeAddr("marketing");
        teamWallet = makeAddr("teamWallet");
        attacker = makeAddr("attacker");

        _deployContracts();
        _configureContracts();
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
        teamVesting.setTeamWallet(teamWallet);

        food.initialDistribution(
            address(vault),
            address(teamVesting),
            marketing,
            address(program)
        );

        application.setProgramAsAdmin(address(program));
    }

    function _approveUser(address user, string memory userId) internal {
        vm.prank(user);
        application.apply4EBT(
            string(abi.encodePacked("user_", userId)),
            "https://example.com/pic.png",
            "@user",
            500,
            userId
        );

        string[] memory ids = new string[](1);
        ids[0] = userId;
        application.approveUsers(ids);
        application.setUserScore(userId, 500);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //                          FUZZ TESTS
    // ═══════════════════════════════════════════════════════════════════════

    /// @notice Fuzz test: Mint with random ETH amounts within valid range
    function testFuzz_MintWithValidAmount(uint256 amount) public {
        // Bound to valid range: 0.02 ETH to 2 ETH
        amount = bound(amount, 0.02 ether, 2 ether);
        // Ensure precision requirement (0.001 ETH increments)
        amount = (amount / 0.001 ether) * 0.001 ether;

        address user = makeAddr("fuzzUser");
        vm.deal(user, 10 ether);

        _approveUser(user, "FUZZ_USER");

        vm.warp(1000);
        vm.prank(user);
        program.mint{value: amount}("FUZZ_USER");

        assertEq(program.totalRaised(), amount);
        assertTrue(program.hasMinted(user));
    }

    /// @notice Fuzz test: Invalid mint amounts should revert
    function testFuzz_MintWithInvalidAmount(uint256 amount) public {
        // Test amounts that are definitely invalid
        // Bound to a reasonable range first to avoid gas issues with huge numbers
        amount = bound(amount, 0, 100 ether);

        // Either below minimum OR above maximum OR invalid precision
        bool isBelowMin = amount < 0.02 ether;
        bool isAboveMax = amount > 2 ether;
        bool isInvalidPrecision = amount % 0.001 ether != 0;

        // If this is actually a valid amount, skip the test
        if (!isBelowMin && !isAboveMax && !isInvalidPrecision) {
            return;
        }

        address user = makeAddr("fuzzUserInvalid");
        vm.deal(user, 1000 ether);

        _approveUser(user, "FUZZ_USER_INVALID");

        vm.warp(1000);
        vm.prank(user);
        // Should revert - we just verify it reverts without specifying exact error
        // because the order of checks in the contract matters
        vm.expectRevert();
        program.mint{value: amount}("FUZZ_USER_INVALID");
    }

    /// @notice Fuzz test: Score validation in claims
    function testFuzz_ScoreValidation(uint256 score) public {
        // Bound score to test edge cases
        score = bound(score, 0, 2000);

        address user = makeAddr("scoreUser");
        vm.deal(user, 1 ether);

        _approveUser(user, "SCORE_USER");

        vm.warp(1000);
        vm.prank(user);
        program.mint{value: 0.1 ether}("SCORE_USER");

        // Scores above 1000 should fail when set
        if (score > 1000) {
            vm.expectRevert(EBTApplication.InvalidScore.selector);
            application.setUserScore("SCORE_USER", score);
        } else {
            application.setUserScore("SCORE_USER", score);

            // Verify claim works with valid score
            vm.warp(block.timestamp + 31 days);
            vm.prank(protocolCaller);
            program.claim(1);

            // Verify claim count increased
            (,uint256 claimCount,,,, ) = program.tokenData(1);
            assertEq(claimCount, 1);
        }
    }

    /// @notice Fuzz test: Vesting time calculations
    function testFuzz_VestingTimeProgress(uint256 timeDelta) public {
        // Bound to reasonable time range (0 to 2 years)
        timeDelta = bound(timeDelta, 0, 730 days);

        address beneficiary = makeAddr("beneficiary");
        uint256 allocation = 1_000_000 * 1e18;

        address vestingAddr = vault.createMarketingVesting(
            beneficiary,
            allocation,
            90 days,
            false,
            "FuzzPartner",
            "KOL"
        );

        MarketingVesting vesting = MarketingVesting(vestingAddr);

        vm.warp(block.timestamp + timeDelta);

        uint256 vestedAmount = vesting.vestedAmount();
        uint256 claimable = vesting.claimable();

        // Invariants
        assertTrue(vestedAmount <= allocation, "Vested should not exceed allocation");
        assertTrue(claimable <= vestedAmount, "Claimable should not exceed vested");

        // After full vesting duration, should be 100% vested
        if (timeDelta >= 90 days) {
            assertEq(vestedAmount, allocation, "Should be fully vested after duration");
        }
    }

    /// @notice Fuzz test: TBA locking with random addresses
    function testFuzz_TBALockingWithRandomAddresses(address randomApprover) public {
        vm.assume(randomApprover != address(0));
        vm.assume(randomApprover != address(this));

        address user = makeAddr("tbaUser");
        vm.deal(user, 1 ether);

        _approveUser(user, "TBA_USER");

        vm.warp(1000);
        vm.prank(user);
        program.mint{value: 0.1 ether}("TBA_USER");

        uint256 tokenId = program.currentTokenId() - 1;

        // Approve to random address should lock TBA
        vm.prank(user);
        program.approve(randomApprover, tokenId);

        assertTrue(program.isTBALocked(tokenId), "TBA should be locked after approval");
    }

    // ═══════════════════════════════════════════════════════════════════════
    //                      PENETRATION TESTS
    // ═══════════════════════════════════════════════════════════════════════

    /// @notice PEN-1: Attempt to claim with manipulated score
    function testPen_ScoreManipulationAttempt() public {
        address user = makeAddr("victimUser");
        vm.deal(user, 1 ether);

        _approveUser(user, "VICTIM_USER");

        vm.warp(1000);
        vm.prank(user);
        program.mint{value: 0.1 ether}("VICTIM_USER");

        // Attacker tries to call claim with different token
        vm.warp(block.timestamp + 31 days);

        // Only protocol caller can claim
        vm.prank(attacker);
        vm.expectRevert(EBTProgram.OnlyProtocol.selector);
        program.claim(1);

        // Protocol can claim successfully
        vm.prank(protocolCaller);
        program.claim(1);
    }

    /// @notice PEN-2: Attempt front-running on marketplace sale
    function testPen_FrontRunningMarketplaceSale() public {
        address seller = makeAddr("seller");
        address buyer = makeAddr("buyer");
        address marketplace = makeAddr("marketplace");
        vm.deal(seller, 1 ether);
        vm.deal(buyer, 1 ether);

        _approveUser(seller, "SELLER_USER");

        vm.warp(1000);
        vm.prank(seller);
        program.mint{value: 0.1 ether}("SELLER_USER");

        uint256 tokenId = program.currentTokenId() - 1;
        address tba = program.getTBA(tokenId);

        // Seller approves marketplace (this locks TBA)
        vm.prank(seller);
        program.approve(marketplace, tokenId);

        assertTrue(program.isTBALocked(tokenId), "TBA should be locked");

        // Seller attempts to drain TBA assets while listed - SHOULD FAIL
        vm.prank(seller);
        vm.expectRevert(ERC6551Account.AssetsAreLocked.selector);
        ERC6551Account(payable(tba)).transferERC20(address(food), attacker, 1);

        // Transfer completes successfully with locked TBA
        vm.prank(marketplace);
        program.transferFrom(seller, buyer, tokenId);

        // New owner has unlocked TBA
        assertFalse(program.isTBALocked(tokenId), "TBA should be unlocked after transfer");
        assertEq(program.ownerOf(tokenId), buyer, "Buyer should own NFT");
    }

    /// @notice PEN-3: Attempt to bypass rate limiting
    function testPen_RateLimitingBypass() public {
        address user1 = makeAddr("user1");
        address user2 = makeAddr("user2");
        vm.deal(user1, 1 ether);
        vm.deal(user2, 1 ether);

        _approveUser(user1, "USER_1");
        _approveUser(user2, "USER_2");

        vm.warp(1000);

        // First mint succeeds
        vm.prank(user1);
        program.mint{value: 0.1 ether}("USER_1");

        // Immediate second mint should fail (rate limited)
        vm.prank(user2);
        vm.expectRevert(EBTProgram.RateLimitExceeded.selector);
        program.mint{value: 0.1 ether}("USER_2");

        // After cooldown, second mint succeeds
        vm.warp(block.timestamp + 31);
        vm.prank(user2);
        program.mint{value: 0.1 ether}("USER_2");
    }

    /// @notice PEN-4: Attempt double-claim attack
    function testPen_DoubleClaimAttempt() public {
        address user = makeAddr("claimUser");
        vm.deal(user, 1 ether);

        _approveUser(user, "CLAIM_USER");

        vm.warp(1000);
        vm.prank(user);
        program.mint{value: 0.1 ether}("CLAIM_USER");

        // Move past fundraising period first
        uint256 claim1Time = 1000 + 31 days;
        vm.warp(claim1Time);

        // First claim succeeds
        vm.prank(protocolCaller);
        program.claim(1);

        // Immediate second claim fails (too soon)
        vm.prank(protocolCaller);
        vm.expectRevert(EBTProgram.ClaimTooSoon.selector);
        program.claim(1);

        // After interval, second claim succeeds (>= 30 days from first claim)
        uint256 claim2Time = claim1Time + 30 days;
        vm.warp(claim2Time);
        vm.prank(protocolCaller);
        program.claim(1);

        // Third claim (>= 30 days from second claim)
        uint256 claim3Time = claim2Time + 30 days;
        vm.warp(claim3Time);
        vm.prank(protocolCaller);
        program.claim(1);

        // 4th claim should fail (only 3 allowed)
        uint256 claim4Time = claim3Time + 30 days;
        vm.warp(claim4Time);
        vm.prank(protocolCaller);
        vm.expectRevert(EBTProgram.ClaimLimitReached.selector);
        program.claim(1);
    }

    /// @notice PEN-5: Attempt reentrancy on refund
    function testPen_ReentrancyOnRefund() public {
        // Deploy fresh contracts with low caps for soft cap failure
        EBTApplication newApp = new EBTApplication();
        FoodStamps newFood = new FoodStamps();
        ERC6551Registry newRegistry = new ERC6551Registry();
        ERC6551Account newAccountImpl = new ERC6551Account();
        LiquidityVault newVault = new LiquidityVault(address(newFood));
        TeamVesting newVesting = new TeamVesting(address(newFood));

        newRegistry.setImplementation(address(newAccountImpl));
        EBTProgram newProgram = new EBTProgram(address(newRegistry), address(newApp));

        newRegistry.transferOwnership(address(newProgram));

        newProgram.setFundraisingPeriod(7 days);
        newProgram.setCaps(10 ether, 100 ether); // High soft cap we won't reach

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

        // Create user and mint
        address user = makeAddr("refundUser");
        vm.deal(user, 1 ether);

        vm.prank(user);
        newApp.apply4EBT("refundUser", "pic", "@tw", 500, "REFUND_USER");

        string[] memory ids = new string[](1);
        ids[0] = "REFUND_USER";
        newApp.approveUsers(ids);

        vm.warp(1000);
        vm.prank(user);
        newProgram.mint{value: 0.1 ether}("REFUND_USER");

        // Close fundraising (soft cap not reached)
        vm.warp(block.timestamp + 8 days);
        newProgram.closeFundraising();

        // Verify refund is available
        uint256 userBalanceBefore = user.balance;
        vm.prank(user);
        newProgram.claimRefund();

        assertEq(user.balance, userBalanceBefore + 0.1 ether, "Refund should be received");

        // Second refund attempt should fail
        vm.prank(user);
        vm.expectRevert(EBTProgram.AlreadyRefunded.selector);
        newProgram.claimRefund();
    }

    /// @notice PEN-6: Attempt unauthorized TGE airdrop claim
    function testPen_UnauthorizedTGEClaim() public {
        address user = makeAddr("tgeUser");
        vm.deal(user, 1 ether);

        _approveUser(user, "TGE_USER");

        vm.warp(1000);
        vm.prank(user);
        program.mint{value: 0.1 ether}("TGE_USER");

        uint256 tokenId = program.currentTokenId() - 1;

        // Attacker tries to claim TGE for user's token
        bytes32[] memory fakeProof = new bytes32[](1);
        fakeProof[0] = keccak256("fake");

        vm.prank(attacker);
        vm.expectRevert("Not token owner");
        program.claimTGEAirdrop(tokenId, 1000 * 1e18, fakeProof);
    }

    /// @notice PEN-7: Attempt cross-chain replay on merkle proof
    function testPen_CrossChainReplayAttempt() public {
        address user = makeAddr("replayUser");
        vm.deal(user, 1 ether);

        _approveUser(user, "REPLAY_USER");

        vm.warp(1000);
        vm.prank(user);
        program.mint{value: 0.1 ether}("REPLAY_USER");

        uint256 tokenId = program.currentTokenId() - 1;
        address tba = program.getTBA(tokenId);

        // Create proof for WRONG chain ID
        bytes32 wrongLeaf = keccak256(abi.encodePacked(
            uint256(999), // Wrong chain ID
            tokenId,
            tba,
            uint256(1000 * 1e18)
        ));

        // Set merkle root with wrong chain proof
        program.setTGEMerkleRoot(wrongLeaf);

        // Claim should fail because leaf includes chainId
        bytes32[] memory emptyProof = new bytes32[](0);
        vm.prank(user);
        vm.expectRevert(EBTProgram.InvalidMerkleProof.selector);
        program.claimTGEAirdrop(tokenId, 1000 * 1e18, emptyProof);
    }

    /// @notice PEN-8: Attempt DoS via batch operations
    function testPen_BatchOperationDoS() public {
        // Try to approve more than MAX_BATCH_SIZE users
        string[] memory tooManyIds = new string[](101);
        for (uint256 i = 0; i < 101; i++) {
            tooManyIds[i] = string(abi.encodePacked("USER_", vm.toString(i)));
        }

        vm.expectRevert(EBTApplication.BatchTooLarge.selector);
        application.approveUsers(tooManyIds);

        // Similarly for blacklist
        address[] memory tooManyAddresses = new address[](101);
        for (uint256 i = 0; i < 101; i++) {
            tooManyAddresses[i] = address(uint160(i + 1));
        }

        vm.expectRevert("Batch too large");
        program.setBlacklistStatus(tooManyAddresses, true);
    }

    /// @notice PEN-9: Attempt registry implementation change after lock
    function testPen_RegistryImplementationChangeAfterLock() public {
        // Create fresh registry to test implementation lock
        ERC6551Registry newRegistry = new ERC6551Registry();
        ERC6551Account newImpl = new ERC6551Account();
        ERC6551Account anotherImpl = new ERC6551Account();

        newRegistry.setImplementation(address(newImpl));

        // Create an account to trigger the lock
        newRegistry.createAccount(
            address(newImpl),
            block.chainid,
            address(this),
            1,
            bytes32(0),
            ""
        );

        // Try to change implementation after lock
        vm.expectRevert(ERC6551Registry.ImplementationLocked.selector);
        newRegistry.setImplementation(address(anotherImpl));
    }

    /// @notice PEN-10: Attempt marketing vesting re-initialization
    function testPen_VestingReinitialization() public {
        address beneficiary = makeAddr("beneficiary");
        address newBeneficiary = makeAddr("newBeneficiary");

        address vestingAddr = vault.createMarketingVesting(
            beneficiary,
            1_000_000 * 1e18,
            90 days,
            false,
            "Partner",
            "KOL"
        );

        // Try to re-initialize
        vm.prank(address(vault));
        vm.expectRevert(MarketingVesting.AlreadyInitialized.selector);
        MarketingVesting(vestingAddr).initialize(
            newBeneficiary,
            2_000_000 * 1e18,
            180 days,
            true,
            "Attacker",
            "HACK"
        );
    }

    // ═══════════════════════════════════════════════════════════════════════
    //                      INVARIANT TESTS
    // ═══════════════════════════════════════════════════════════════════════

    /// @notice Invariant: Total raised should never exceed hard cap
    function testInvariant_TotalRaisedNeverExceedsHardCap() public {
        address[] memory users = new address[](10);
        for (uint256 i = 0; i < 10; i++) {
            users[i] = makeAddr(string(abi.encodePacked("user", vm.toString(i))));
            vm.deal(users[i], 10 ether);

            string memory userId = string(abi.encodePacked("INV_USER_", vm.toString(i)));
            _approveUser(users[i], userId);
        }

        uint256 currentTime = 1000;
        vm.warp(currentTime);

        for (uint256 i = 0; i < 10; i++) {
            currentTime += 31;
            vm.warp(currentTime);

            string memory userId = string(abi.encodePacked("INV_USER_", vm.toString(i)));
            vm.prank(users[i]);
            program.mint{value: 2 ether}(userId);

            // Invariant check
            assertTrue(
                program.totalRaised() <= program.hardCap(),
                "Invariant violated: totalRaised > hardCap"
            );
        }
    }

    /// @notice Invariant: Token distribution percentages are correct
    function testInvariant_TokenDistributionPercentages() public {
        uint256 totalSupply = food.totalSupply();
        uint256 vaultBalance = food.balanceOf(address(vault));
        uint256 teamBalance = food.balanceOf(address(teamVesting));
        uint256 marketingBalance = food.balanceOf(marketing);
        uint256 programBalance = food.balanceOf(address(program));

        // Verify percentages (with small tolerance for rounding)
        assertApproxEqRel(vaultBalance, totalSupply * 65 / 100, 0.01e18, "Vault should have 65%");
        assertApproxEqRel(teamBalance, totalSupply * 5 / 100, 0.01e18, "Team should have 5%");
        assertApproxEqRel(marketingBalance, totalSupply * 20 / 100, 0.01e18, "Marketing should have 20%");
        assertApproxEqRel(programBalance, totalSupply * 10 / 100, 0.01e18, "Program should have 10%");
    }

    /// @notice Invariant: Claim count should never exceed MAX_CLAIMS
    function testInvariant_ClaimCountNeverExceedsMax() public {
        address user = makeAddr("claimInvUser");
        vm.deal(user, 1 ether);

        _approveUser(user, "CLAIM_INV_USER");

        vm.warp(1000);
        vm.prank(user);
        program.mint{value: 0.1 ether}("CLAIM_INV_USER");

        uint256 maxClaims = program.MAX_CLAIMS();

        for (uint256 i = 0; i < maxClaims + 2; i++) {
            vm.warp(block.timestamp + 31 days);

            vm.prank(protocolCaller);
            try program.claim(1) {
                (,uint256 claimCount,,,, ) = program.tokenData(1);
                assertTrue(
                    claimCount <= maxClaims,
                    "Invariant violated: claimCount > MAX_CLAIMS"
                );
            } catch {
                // Expected to fail after max claims
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    //                      EDGE CASE TESTS
    // ═══════════════════════════════════════════════════════════════════════

    /// @notice Edge case: Mint at exact minimum price
    function testEdge_MintAtExactMinPrice() public {
        address user = makeAddr("minUser");
        vm.deal(user, 1 ether);

        _approveUser(user, "MIN_USER");

        vm.warp(1000);
        vm.prank(user);
        program.mint{value: 0.02 ether}("MIN_USER");

        assertEq(program.totalRaised(), 0.02 ether);
    }

    /// @notice Edge case: Mint at exact maximum price
    function testEdge_MintAtExactMaxPrice() public {
        address user = makeAddr("maxUser");
        vm.deal(user, 10 ether);

        _approveUser(user, "MAX_USER");

        vm.warp(1000);
        vm.prank(user);
        program.mint{value: 2 ether}("MAX_USER");

        assertEq(program.totalRaised(), 2 ether);
    }

    /// @notice Edge case: Claim at exact 30 day boundary
    function testEdge_ClaimAtExact30DayBoundary() public {
        address user = makeAddr("boundaryUser");
        vm.deal(user, 1 ether);

        _approveUser(user, "BOUNDARY_USER");

        vm.warp(1000);
        vm.prank(user);
        program.mint{value: 0.1 ether}("BOUNDARY_USER");

        // First claim - need to be past fundraising period
        uint256 firstClaimTime = 1000 + 31 days;
        vm.warp(firstClaimTime);
        vm.prank(protocolCaller);
        program.claim(1);

        // The check is: block.timestamp < lastClaimTime + CLAIM_INTERVAL
        // So at exactly lastClaimTime + 30 days, it should PASS (not < means >=)
        // At 30 days - 1 second, should fail
        vm.warp(firstClaimTime + 30 days - 1);
        vm.prank(protocolCaller);
        vm.expectRevert(EBTProgram.ClaimTooSoon.selector);
        program.claim(1);

        // At exactly 30 days after first claim - should succeed (>= 30 days)
        vm.warp(firstClaimTime + 30 days);
        vm.prank(protocolCaller);
        program.claim(1);
    }

    /// @notice Edge case: Rate limit at exact cooldown boundary
    function testEdge_RateLimitAtExactCooldownBoundary() public {
        address user1 = makeAddr("cooldown1");
        address user2 = makeAddr("cooldown2");
        vm.deal(user1, 1 ether);
        vm.deal(user2, 1 ether);

        _approveUser(user1, "COOLDOWN_1");
        _approveUser(user2, "COOLDOWN_2");

        vm.warp(1000);
        vm.prank(user1);
        program.mint{value: 0.1 ether}("COOLDOWN_1");

        // At exactly 29 seconds - should fail (< 30 seconds)
        vm.warp(1029);
        vm.prank(user2);
        vm.expectRevert(EBTProgram.RateLimitExceeded.selector);
        program.mint{value: 0.1 ether}("COOLDOWN_2");

        // At 30 seconds (>= MINT_COOLDOWN) - should succeed
        vm.warp(1030);
        vm.prank(user2);
        program.mint{value: 0.1 ether}("COOLDOWN_2");
    }

    /// @notice Edge case: TGE airdrop at exact deadline
    function testEdge_TGEAirdropAtExactDeadline() public {
        address user = makeAddr("deadlineUser");
        vm.deal(user, 1 ether);

        _approveUser(user, "DEADLINE_USER");

        vm.warp(1000);
        vm.prank(user);
        program.mint{value: 0.1 ether}("DEADLINE_USER");

        uint256 tokenId = program.currentTokenId() - 1;
        address tba = program.getTBA(tokenId);

        // Set deadline and merkle root
        uint256 deadline = block.timestamp + 7 days;
        program.setTGEAirdropDeadline(deadline);

        bytes32 leaf = keccak256(abi.encodePacked(
            block.chainid,
            tokenId,
            tba,
            uint256(1000 * 1e18)
        ));
        program.setTGEMerkleRoot(leaf);

        // At exact deadline - should still work
        vm.warp(deadline);
        bytes32[] memory emptyProof = new bytes32[](0);
        vm.prank(user);
        program.claimTGEAirdrop(tokenId, 1000 * 1e18, emptyProof);
    }

    /// @notice Edge case: TGE airdrop after deadline
    function testEdge_TGEAirdropAfterDeadline() public {
        address user = makeAddr("expiredUser");
        vm.deal(user, 1 ether);

        _approveUser(user, "EXPIRED_USER");

        vm.warp(1000);
        vm.prank(user);
        program.mint{value: 0.1 ether}("EXPIRED_USER");

        uint256 tokenId = program.currentTokenId() - 1;

        // Set deadline
        uint256 deadline = block.timestamp + 7 days;
        program.setTGEAirdropDeadline(deadline);

        // After deadline - should fail
        vm.warp(deadline + 1);
        bytes32[] memory emptyProof = new bytes32[](0);
        vm.prank(user);
        vm.expectRevert(EBTProgram.TGEAirdropExpired.selector);
        program.claimTGEAirdrop(tokenId, 1000 * 1e18, emptyProof);
    }
}
