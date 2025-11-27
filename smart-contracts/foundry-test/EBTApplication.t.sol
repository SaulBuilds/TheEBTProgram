// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";
import "../contracts/EBTApplication.sol";

contract EBTApplicationTest is Test {
    EBTApplication internal app;
    address internal admin = address(this);
    address internal user = address(0xBEEF);

    function setUp() public {
        app = new EBTApplication();
    }

    function testApplySetsHasApplied() public {
        vm.prank(user);
        app.apply4EBT("user", "pic", "tw", 100, "id1");

        EBTApplication.EBTApplicant memory applicant = app.getUserDetails("id1");
        assertTrue(applicant.hasApplied);
        assertEq(applicant.username, "user");
    }

    function testApproveUsersOnlyAdmin() public {
        vm.prank(user);
        vm.expectRevert(EBTApplication.NotAdmin.selector);
        app.approveUsers(_single("id2"));
    }

    function testApproveUsersAsAdmin() public {
        vm.prank(user);
        app.apply4EBT("user", "pic", "tw", 100, "id3");

        app.approveUsers(_single("id3"));
        assertTrue(app.isUserApproved("id3"));
    }

    function _single(string memory id) internal pure returns (string[] memory ids) {
        ids = new string[](1);
        ids[0] = id;
    }
}
