// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../contracts/EBTProgram.sol";
import "../contracts/EBTApplication.sol";
import "../contracts/FoodStamps.sol";
import "../contracts/ERC6551Registry.sol";
import "../contracts/ERC6551Account.sol";

contract Reentrant {
    EBTProgram public program;
    uint256 public targetTokenId;
    enum Action { None, Claim }
    Action public action = Action.None;

    constructor(EBTProgram _program) {
        program = _program;
    }

    receive() external payable {
        if (action == Action.Claim) {
            action = Action.None;
            try program.claimInstallment(targetTokenId) {
            } catch {}
        }
    }

    function triggerClaim(uint256 tokenId) external {
        targetTokenId = tokenId;
        action = Action.Claim;
        program.claimInstallment(tokenId);
    }
}

contract ETHConservationTest is Test {
    EBTProgram internal program;
    EBTApplication internal app;
    FoodStamps internal food;
    ERC6551Registry internal registry;
    ERC6551Account internal accountImpl;
    address internal multisig = address(0x1234);
    address internal deployer = address(0xDEAD);
    address internal user = address(0xBEEF);
    string internal userId = "user1";
    uint256 internal constant MINT_PRICE = 0.02 ether;

    function setUp() public {
        app = new EBTApplication();
        food = new FoodStamps();
        registry = new ERC6551Registry();
        accountImpl = new ERC6551Account();

        program = new EBTProgram(address(registry), address(food), address(app));

        // Set implementation directly on registry before transferring ownership
        registry.setImplementation(address(accountImpl));
        registry.transferOwnership(address(program));

        // Set account implementation on EBTProgram (internal tracking)
        program.setAccountImplementationInternal(address(accountImpl));
        program.setPayoutAddresses(multisig, deployer);

        food.setEBTProgram(address(program));
        app.setProgramAsAdmin(address(program));
        // deployer (this test contract) already has DEFAULT_ADMIN_ROLE
        app.grantRole(app.ADMIN_ROLE(), address(this));

        vm.deal(user, 1 ether);
        vm.startPrank(user);
        app.apply4EBT("user", "pic", "tw", 100, userId);
        vm.stopPrank();

        app.approveUsers(_single(userId));
    }

    function testETHConservationOnRefund() public {
        vm.roll(5);
        vm.prank(user);
        program.mint{value: MINT_PRICE}(userId);

        vm.warp(block.timestamp + 8 days);
        vm.prank(address(this));
        program.closeFundraisingPeriod();

        uint256 before = user.balance;
        vm.prank(user);
        program.withdraw();
        uint256 afterBal = user.balance;

        assertEq(afterBal - before, MINT_PRICE, "refund should equal mint price");
        assertEq(address(program).balance, 0, "contract should be drained after refund");
    }

    function testETHConservationOnPayout() public {
        // Lower caps so single mint meets soft cap
        program.setCaps(MINT_PRICE / 2, MINT_PRICE);
        vm.roll(5);
        vm.prank(user);
        program.mint{value: MINT_PRICE}(userId);

        vm.warp(block.timestamp + 8 days);
        vm.prank(address(this));
        program.closeFundraisingPeriod();

        // no refunds allowed, all funds to payouts
        assertEq(address(program).balance, 0, "payouts should empty contract");
    }

    function testClaimReentrancyBlocked() public {
        vm.roll(5);
        vm.prank(user);
        program.mint{value: MINT_PRICE}(userId);

        Reentrant attacker = new Reentrant(program);
        vm.deal(address(attacker), 0);

        vm.warp(block.timestamp + 31 days);
        vm.prank(address(attacker));
        vm.expectRevert(); // should revert due to reentrancy guard / CEI checks
        attacker.triggerClaim(0);
    }

    function _single(string memory id) internal pure returns (string[] memory ids) {
        ids = new string[](1);
        ids[0] = id;
    }
}
