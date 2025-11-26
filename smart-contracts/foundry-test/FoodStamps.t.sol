// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/FoodStamps.sol";

contract FoodStampsTest is Test {
    FoodStamps internal token;
    address internal program = address(0xCAFE);
    address internal recipient = address(0xBEEF);

    function setUp() public {
        token = new FoodStamps();
    }

    function testMintFailsForNonProgram() public {
        vm.expectRevert("Only controller contract can mint tokens");
        token.mint(recipient, 1 ether);
    }

    function testMintByProgramSetsFlagAndSupply() public {
        uint256 initialSupply = token.totalSupply();
        token.setEBTProgram(program);

        vm.prank(program);
        token.mint(recipient, 100);

        assertEq(token.totalSupply(), initialSupply + 100);
        assertTrue(token.hasReceivedFoodStamps(recipient));
        assertEq(token.balanceOf(recipient), 100);
    }
}
