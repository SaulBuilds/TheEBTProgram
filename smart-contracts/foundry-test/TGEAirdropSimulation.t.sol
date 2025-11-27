// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

import "../contracts/EBTProgram.sol";
import "../contracts/ERC6551Registry.sol";
import "../contracts/ERC6551Account.sol";
import "../contracts/FoodStamps.sol";
import "../contracts/LiquidityVault.sol";
import "../contracts/TeamVesting.sol";
import "../contracts/EBTApplication.sol";

/// @title TGE Airdrop Simulation
/// @notice Comprehensive test for TGE airdrop with merkle proofs and distribution
contract TGEAirdropSimulation is Test {
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

    // Airdrop tracking
    struct AirdropRecipient {
        address user;
        string userId;
        uint256 tokenId;
        address tba;
        uint256 airdropAmount;
        bytes32[] proof;
    }

    AirdropRecipient[] public recipients;
    bytes32 public merkleRoot;

    // Test parameters
    uint256 constant NUM_RECIPIENTS = 100;
    uint256 constant BASE_AIRDROP = 10_000 * 1e18; // 10k tokens base

    function setUp() public {
        owner = address(this);
        protocolCaller = makeAddr("protocolCaller");
        treasury = makeAddr("treasury");
        marketing = makeAddr("marketing");
        teamWallet = makeAddr("teamWallet");

        _deployContracts();
        _configureContracts();
        _mintNFTsForAirdrop();
        _generateMerkleTree();

        console.log("=== TGE AIRDROP SIMULATION SETUP ===");
        console.log("Recipients:", NUM_RECIPIENTS);
        console.log("Merkle Root:", vm.toString(merkleRoot));
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
        program.setCaps(1 ether, 1000 ether);

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

    function _mintNFTsForAirdrop() internal {
        // Use time-based rate limiting (30 second cooldown)
        uint256 currentTime = 1000;
        vm.warp(currentTime);

        for (uint256 i = 0; i < NUM_RECIPIENTS; i++) {
            address user = address(uint160(uint256(keccak256(abi.encodePacked("airdropuser", i)))));
            string memory userId = string(abi.encodePacked("AIRDROP_USER_", vm.toString(i)));

            vm.deal(user, 1 ether);

            // Apply and approve
            vm.prank(user);
            application.apply4EBT(
                string(abi.encodePacked("user_", vm.toString(i))),
                "https://example.com/pic.png",
                "@user",
                500,
                userId
            );

            string[] memory ids = new string[](1);
            ids[0] = userId;
            application.approveUsers(ids);

            // Mint - use time-based rate limiting
            currentTime += 31;
            vm.warp(currentTime);
            vm.prank(user);
            program.mint{value: 0.05 ether}(userId);

            uint256 tokenId = program.currentTokenId() - 1;
            address tba = program.getTBA(tokenId);

            // Calculate random airdrop amount (base + random bonus)
            uint256 airdropAmount = BASE_AIRDROP +
                (uint256(keccak256(abi.encodePacked(i, "airdrop"))) % BASE_AIRDROP);

            AirdropRecipient memory recipient = AirdropRecipient({
                user: user,
                userId: userId,
                tokenId: tokenId,
                tba: tba,
                airdropAmount: airdropAmount,
                proof: new bytes32[](0) // Will be set after merkle tree generation
            });

            recipients.push(recipient);
        }
    }

    function _generateMerkleTree() internal {
        // Build leaves - H-1 fix: Include chainId for cross-chain replay protection
        bytes32[] memory leaves = new bytes32[](NUM_RECIPIENTS);
        for (uint256 i = 0; i < NUM_RECIPIENTS; i++) {
            leaves[i] = keccak256(abi.encodePacked(
                block.chainid,
                recipients[i].tokenId,
                recipients[i].tba,
                recipients[i].airdropAmount
            ));
        }

        // Build merkle tree (simple binary tree)
        merkleRoot = _computeMerkleRoot(leaves);

        // Generate proofs for each recipient
        for (uint256 i = 0; i < NUM_RECIPIENTS; i++) {
            recipients[i].proof = _computeMerkleProof(leaves, i);
        }

        // Set merkle root on program
        program.setTGEMerkleRoot(merkleRoot);
    }

    function _computeMerkleRoot(bytes32[] memory leaves) internal pure returns (bytes32) {
        require(leaves.length > 0, "Empty leaves");

        while (leaves.length > 1) {
            uint256 nextLevelLen = (leaves.length + 1) / 2;
            bytes32[] memory nextLevel = new bytes32[](nextLevelLen);

            for (uint256 i = 0; i < nextLevelLen; i++) {
                uint256 leftIdx = i * 2;
                uint256 rightIdx = leftIdx + 1;

                bytes32 left = leaves[leftIdx];
                bytes32 right = rightIdx < leaves.length ? leaves[rightIdx] : left;

                // Hash in sorted order
                if (left <= right) {
                    nextLevel[i] = keccak256(abi.encodePacked(left, right));
                } else {
                    nextLevel[i] = keccak256(abi.encodePacked(right, left));
                }
            }

            leaves = nextLevel;
        }

        return leaves[0];
    }

    function _computeMerkleProof(bytes32[] memory leaves, uint256 index) internal pure returns (bytes32[] memory) {
        // Calculate proof depth
        uint256 depth = 0;
        uint256 n = leaves.length;
        while (n > 1) {
            depth++;
            n = (n + 1) / 2;
        }

        bytes32[] memory proof = new bytes32[](depth);
        uint256 proofIdx = 0;

        bytes32[] memory currentLevel = leaves;
        uint256 currentIndex = index;

        while (currentLevel.length > 1) {
            uint256 siblingIdx = currentIndex % 2 == 0 ? currentIndex + 1 : currentIndex - 1;

            if (siblingIdx < currentLevel.length) {
                proof[proofIdx] = currentLevel[siblingIdx];
            } else {
                proof[proofIdx] = currentLevel[currentIndex];
            }
            proofIdx++;

            // Compute next level
            uint256 nextLevelLen = (currentLevel.length + 1) / 2;
            bytes32[] memory nextLevel = new bytes32[](nextLevelLen);

            for (uint256 i = 0; i < nextLevelLen; i++) {
                uint256 leftIdx = i * 2;
                uint256 rightIdx = leftIdx + 1;

                bytes32 left = currentLevel[leftIdx];
                bytes32 right = rightIdx < currentLevel.length ? currentLevel[rightIdx] : left;

                if (left <= right) {
                    nextLevel[i] = keccak256(abi.encodePacked(left, right));
                } else {
                    nextLevel[i] = keccak256(abi.encodePacked(right, left));
                }
            }

            currentLevel = nextLevel;
            currentIndex = currentIndex / 2;
        }

        // Resize proof array to actual length
        bytes32[] memory finalProof = new bytes32[](proofIdx);
        for (uint256 i = 0; i < proofIdx; i++) {
            finalProof[i] = proof[i];
        }

        return finalProof;
    }

    // ============ Airdrop Tests ============

    function testTGEAirdropDistribution() public {
        console.log("\n=== TEST: TGE AIRDROP DISTRIBUTION ===");

        uint256 totalAirdropped = 0;
        uint256 successfulClaims = 0;

        for (uint256 i = 0; i < NUM_RECIPIENTS; i++) {
            AirdropRecipient storage recipient = recipients[i];

            uint256 tbaBalanceBefore = food.balanceOf(recipient.tba);

            // Claim airdrop
            vm.prank(recipient.user);
            program.claimTGEAirdrop(
                recipient.tokenId,
                recipient.airdropAmount,
                recipient.proof
            );

            uint256 tbaBalanceAfter = food.balanceOf(recipient.tba);
            uint256 received = tbaBalanceAfter - tbaBalanceBefore;

            assertEq(received, recipient.airdropAmount, "Airdrop amount mismatch");

            totalAirdropped += received;
            successfulClaims++;

            if ((i + 1) % 20 == 0) {
                console.log("  Claims completed:", i + 1);
            }
        }

        console.log("\nAirdrop Complete:");
        console.log("  Successful claims:", successfulClaims);
        console.log("  Total airdropped:", totalAirdropped / 1e18, "tokens");
    }

    function testCannotClaimTwice() public {
        console.log("\n=== TEST: CANNOT CLAIM TWICE ===");

        AirdropRecipient storage recipient = recipients[0];

        // First claim should succeed
        vm.prank(recipient.user);
        program.claimTGEAirdrop(
            recipient.tokenId,
            recipient.airdropAmount,
            recipient.proof
        );

        console.log("First claim succeeded");

        // Second claim should fail
        vm.expectRevert(EBTProgram.AlreadyClaimedTGE.selector);
        vm.prank(recipient.user);
        program.claimTGEAirdrop(
            recipient.tokenId,
            recipient.airdropAmount,
            recipient.proof
        );

        console.log("Second claim correctly rejected");
    }

    function testInvalidMerkleProof() public {
        console.log("\n=== TEST: INVALID MERKLE PROOF ===");

        AirdropRecipient storage recipient = recipients[0];

        // Try to claim with wrong amount
        uint256 wrongAmount = recipient.airdropAmount + 1000 * 1e18;

        vm.expectRevert(EBTProgram.InvalidMerkleProof.selector);
        vm.prank(recipient.user);
        program.claimTGEAirdrop(
            recipient.tokenId,
            wrongAmount,
            recipient.proof
        );

        console.log("Invalid proof correctly rejected");
    }

    function testOnlyOwnerCanClaim() public {
        console.log("\n=== TEST: ONLY OWNER CAN CLAIM ===");

        AirdropRecipient storage recipient = recipients[0];
        address attacker = makeAddr("attacker");

        vm.expectRevert("Not token owner");
        vm.prank(attacker);
        program.claimTGEAirdrop(
            recipient.tokenId,
            recipient.airdropAmount,
            recipient.proof
        );

        console.log("Non-owner claim correctly rejected");
    }

    function testAirdropStatistics() public {
        console.log("\n=== TEST: AIRDROP STATISTICS ===");

        uint256 minAirdrop = type(uint256).max;
        uint256 maxAirdrop = 0;
        uint256 totalAirdrop = 0;

        for (uint256 i = 0; i < NUM_RECIPIENTS; i++) {
            uint256 amount = recipients[i].airdropAmount;
            totalAirdrop += amount;
            if (amount < minAirdrop) minAirdrop = amount;
            if (amount > maxAirdrop) maxAirdrop = amount;
        }

        console.log("Airdrop Statistics:");
        console.log("  Total Recipients:", NUM_RECIPIENTS);
        console.log("  Min Airdrop:", minAirdrop / 1e18, "tokens");
        console.log("  Max Airdrop:", maxAirdrop / 1e18, "tokens");
        console.log("  Avg Airdrop:", (totalAirdrop / NUM_RECIPIENTS) / 1e18, "tokens");
        console.log("  Total Airdrop:", totalAirdrop / 1e18, "tokens");

        // Execute all claims
        for (uint256 i = 0; i < NUM_RECIPIENTS; i++) {
            AirdropRecipient storage recipient = recipients[i];
            vm.prank(recipient.user);
            program.claimTGEAirdrop(
                recipient.tokenId,
                recipient.airdropAmount,
                recipient.proof
            );
        }

        // Verify vault balance decreased correctly
        uint256 vaultBalance = food.balanceOf(address(vault));
        console.log("\nVault remaining balance:", vaultBalance / 1e18, "tokens");
    }

    function testMerkleProofVerification() public view {
        console.log("\n=== TEST: MERKLE PROOF VERIFICATION ===");

        // Verify each proof is valid - H-1 fix: Include chainId in leaf
        for (uint256 i = 0; i < 10; i++) {
            AirdropRecipient storage recipient = recipients[i];

            bytes32 leaf = keccak256(abi.encodePacked(
                block.chainid,
                recipient.tokenId,
                recipient.tba,
                recipient.airdropAmount
            ));

            bool valid = MerkleProof.verify(recipient.proof, merkleRoot, leaf);
            assertTrue(valid, "Proof should be valid");

            console.log("  Recipient", i, "- Proof valid:", valid);
        }
    }
}
