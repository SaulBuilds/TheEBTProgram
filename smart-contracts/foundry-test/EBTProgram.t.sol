// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/EBTProgram.sol";
import "../contracts/ERC6551Registry.sol";
import "../contracts/ERC6551Account.sol";
import "../contracts/FoodStamps.sol";
import "../contracts/EBTApplication.sol";

contract EBTProgramTest is Test {
    EBTProgram internal program;
    ERC6551Registry internal registry;
    ERC6551Account internal accountImpl;
    FoodStamps internal food;
    EBTApplication internal app;

    address internal user = address(0xBEEF);
    address internal multisig = address(0x1234);
    address internal deployer = address(0xDEAD);
    string internal userId = "user1";

    uint256 internal constant MINT_PRICE = 0.02 ether;
    uint256 internal constant INITIAL_AIRDROP = 200000000000000000000000; // matches contract literal

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

        // prepare user and approval
        vm.deal(user, 1 ether);
        vm.prank(user);
        app.apply4EBT("user", "pic", "tw", 100, userId);
        app.approveUsers(_single(userId));
    }

    function testMintCreatesAccountAndMintsFood() public {
        // satisfy block spacing rule
        vm.roll(5);

        vm.prank(user);
        program.mint{value: MINT_PRICE}(userId);

        assertEq(program.ownerOf(0), user, "owner should be minter");
        assertEq(address(program).balance, MINT_PRICE, "contract should hold mint price");

        bytes32 salt = keccak256(abi.encodePacked(userId));
        address account = registry.account(address(accountImpl), block.chainid, address(program), 0, salt);
        assertTrue(account != address(0), "account should exist");

        assertEq(food.balanceOf(account), INITIAL_AIRDROP, "airdrop to account");
        assertEq(program.tokenIdToPrice(0), MINT_PRICE, "price stored");
    }

    function testMintRequiresApproval() public {
        string memory notApproved = "nope";
        vm.deal(user, 1 ether);
        vm.prank(user);
        vm.expectRevert(EBTProgram.NotApproved.selector);
        program.mint{value: MINT_PRICE}(notApproved);
    }

    function testMintRequiresExactPrice() public {
        vm.deal(user, 1 ether);
        vm.roll(5);
        vm.prank(user);
        vm.expectRevert(EBTProgram.IncorrectPrice.selector);
        program.mint{value: MINT_PRICE - 1}(userId);
    }

    function testSecondMintSameAddressFails() public {
        vm.roll(5);
        vm.prank(user);
        program.mint{value: MINT_PRICE}(userId);

        vm.roll(block.number + 5);
        vm.prank(user);
        vm.expectRevert(EBTProgram.AlreadyMinted.selector);
        program.mint{value: MINT_PRICE}(userId);
    }

    function testBlacklistedCannotMint() public {
        address badUser = address(0xBAD);
        vm.deal(badUser, 1 ether);
        vm.prank(badUser);
        app.apply4EBT("bad", "pic", "tw", 100, "bad");
        app.approveUsers(_single("bad"));
        program.setBlacklistStatus(_addrArray(badUser), true);

        vm.roll(5);
        vm.prank(badUser);
        vm.expectRevert(EBTProgram.Blacklisted.selector);
        program.mint{value: MINT_PRICE}("bad");
    }

    function testHonorsThreeBlockGapBetweenMints() public {
        vm.roll(5);
        vm.prank(user);
        program.mint{value: MINT_PRICE}(userId);

        address user2 = address(0xA11CE);
        string memory userId2 = "user2";
        vm.deal(user2, 1 ether);
        vm.prank(user2);
        app.apply4EBT("user2", "pic", "tw", 100, userId2);
        app.approveUsers(_single(userId2));

        vm.roll(program.lastMintBlock() + 1);
        vm.prank(user2);
        vm.expectRevert(bytes("Need to wait for 3 blocks before next mint"));
        program.mint{value: MINT_PRICE}(userId2);

        vm.roll(program.lastMintBlock() + 4);
        vm.prank(user2);
        program.mint{value: MINT_PRICE}(userId2);
        assertEq(program.ownerOf(1), user2);
    }

    function testClaimInstallmentAfter30Days() public {
        vm.roll(5);
        vm.prank(user);
        program.mint{value: MINT_PRICE}(userId);
        uint256 mintedAt = block.timestamp;

        vm.warp(mintedAt + 31 days);
        vm.prank(user);
        program.claimInstallment(0);

        assertEq(food.balanceOf(user), 200000 * MINT_PRICE);
        assertEq(program.installmentCount(0), 1);
    }

    function testMaxThreeInstallments() public {
        vm.roll(5);
        vm.prank(user);
        program.mint{value: MINT_PRICE}(userId);

        uint256 mintedAt = block.timestamp;
        for (uint256 i = 0; i < 3; i++) {
            vm.warp(mintedAt + (31 days * (i + 1)));
            vm.prank(user);
            program.claimInstallment(0);
        }

        vm.warp(mintedAt + 200 days);
        vm.prank(user);
        vm.expectRevert(EBTProgram.InstallmentLimitReached.selector);
        program.claimInstallment(0);
    }

    function testRefundWhenSoftCapNotMet() public {
        vm.roll(5);
        vm.prank(user);
        program.mint{value: MINT_PRICE}(userId);

        vm.warp(block.timestamp + 8 days);
        vm.prank(address(this));
        program.closeFundraisingPeriod();

        uint256 before = user.balance;
        vm.prank(user);
        program.withdraw();
        assertEq(user.balance, before + MINT_PRICE);
    }

    function testNoRefundWhenSoftCapMet() public {
        program.setCaps(MINT_PRICE, 2 * MINT_PRICE);

        vm.roll(5);
        vm.prank(user);
        program.mint{value: MINT_PRICE}(userId);

        vm.warp(block.timestamp + 8 days);
        vm.prank(address(this));
        program.closeFundraisingPeriod();

        vm.prank(user);
        vm.expectRevert(bytes("Soft cap met; no refunds"));
        program.withdraw();
    }

    function testHardCapEnforced() public {
        program.setCaps(MINT_PRICE, MINT_PRICE);

        vm.roll(5);
        vm.prank(user);
        program.mint{value: MINT_PRICE}(userId);

        address user2 = address(0x2222);
        string memory userId2 = "u2";
        vm.deal(user2, 1 ether);
        vm.prank(user2);
        app.apply4EBT("user2", "pic", "tw", 100, userId2);
        app.approveUsers(_single(userId2));

        vm.roll(block.number + 5);
        vm.prank(user2);
        vm.expectRevert(EBTProgram.HardCapReached.selector);
        program.mint{value: MINT_PRICE}(userId2);
    }

    function _single(string memory id) internal pure returns (string[] memory ids) {
        ids = new string[](1);
        ids[0] = id;
    }

    function _addrArray(address a) internal pure returns (address[] memory arr) {
        arr = new address[](1);
        arr[0] = a;
    }
}
