// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";
import "../contracts/FoodStamps.sol";
import "../contracts/LiquidityVault.sol";
import "../contracts/TeamVesting.sol";

contract FoodStampsTest is Test {
    FoodStamps internal token;
    LiquidityVault internal vault;
    TeamVesting internal vesting;
    address internal program = address(0xCAFE);
    address internal marketing = address(0xDEAD);
    address internal recipient = address(0xBEEF);

    function setUp() public {
        token = new FoodStamps();
        vault = new LiquidityVault(address(token));
        vesting = new TeamVesting(address(token));
    }

    function testInitialDistributionAllocatesCorrectly() public {
        // Perform initial distribution
        token.initialDistribution(
            address(vault),
            address(vesting),
            marketing,
            program
        );

        // Verify allocations
        assertEq(token.balanceOf(address(vault)), token.PROTOCOL_ALLOCATION());
        assertEq(token.balanceOf(address(vesting)), token.TEAM_ALLOCATION());
        assertEq(token.balanceOf(marketing), token.MARKETING_ALLOCATION());
        assertEq(token.balanceOf(program), token.NFT_HOLDER_ALLOCATION());

        // Total should be 20B
        assertEq(token.totalSupply(), token.MAX_SUPPLY());
    }

    function testInitialDistributionOnlyOnce() public {
        token.initialDistribution(
            address(vault),
            address(vesting),
            marketing,
            program
        );

        vm.expectRevert("Already distributed");
        token.initialDistribution(
            address(vault),
            address(vesting),
            marketing,
            program
        );
    }

    function testMintFailsForNonAuthorized() public {
        // Don't do initial distribution so we have room to mint
        // Set the vault manually
        token.setLiquidityVault(address(vault));

        // Non-authorized user should fail
        vm.expectRevert("Only vault or owner can mint");
        vm.prank(recipient);
        token.mint(recipient, 1 ether);
    }

    function testMintByVaultWorks() public {
        // Don't do initial distribution so we have room to mint
        token.setLiquidityVault(address(vault));

        // Vault should be able to mint
        uint256 supplyBefore = token.totalSupply();
        vm.prank(address(vault));
        token.mint(recipient, 100);

        assertEq(token.totalSupply(), supplyBefore + 100);
        assertTrue(token.hasReceivedFoodStamps(recipient));
        assertEq(token.balanceOf(recipient), 100);
    }

    function testMintByOwnerWorks() public {
        // Don't do initial distribution so we have room to mint
        // Owner should be able to mint
        uint256 supplyBefore = token.totalSupply();
        token.mint(recipient, 100);

        assertEq(token.totalSupply(), supplyBefore + 100);
    }

    function testMintFailsAfterMaxSupply() public {
        // Do initial distribution which mints MAX_SUPPLY
        token.initialDistribution(
            address(vault),
            address(vesting),
            marketing,
            program
        );

        // Any additional mint should fail
        vm.expectRevert("Exceeds max supply");
        token.mint(recipient, 1);
    }

    function testPauseBlocksTransfers() public {
        token.initialDistribution(
            address(vault),
            address(vesting),
            marketing,
            program
        );

        // Transfer should work before pause
        vm.prank(marketing);
        token.transfer(recipient, 1000);
        assertEq(token.balanceOf(recipient), 1000);

        // Pause the contract
        token.pause();

        // Transfer should fail after pause
        vm.prank(marketing);
        vm.expectRevert("Pausable: paused");
        token.transfer(recipient, 1000);
    }

    function testAllocationInfo() public view {
        (uint256 protocol, uint256 mktg, uint256 nft, uint256 team) = token.getAllocationInfo();

        assertEq(protocol, 13_000_000_000 * 1e18);  // 65% - 13B
        assertEq(mktg, 4_000_000_000 * 1e18);       // 20% - 4B
        assertEq(nft, 2_000_000_000 * 1e18);        // 10% - 2B
        assertEq(team, 1_000_000_000 * 1e18);       // 5%  - 1B
    }

    function testRemainingMintableSupply() public {
        // Before distribution, all supply is mintable
        assertEq(token.remainingMintableSupply(), token.MAX_SUPPLY());

        // After distribution, none is mintable
        token.initialDistribution(
            address(vault),
            address(vesting),
            marketing,
            program
        );
        assertEq(token.remainingMintableSupply(), 0);
    }
}
