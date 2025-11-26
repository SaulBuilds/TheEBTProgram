// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/EBTProgram.sol";
import "../contracts/EBTApplication.sol";
import "../contracts/FoodStamps.sol";
import "../contracts/ERC6551Registry.sol";
import "../contracts/ERC6551Account.sol";

contract EBTProgramInvariants is Test {
    EBTProgram internal program;
    EBTApplication internal app;
    FoodStamps internal food;
    ERC6551Registry internal registry;
    ERC6551Account internal accountImpl;

    address internal user1 = address(0x1);
    address internal user2 = address(0x2);
    address internal user3 = address(0x3);

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
        program.setPayoutAddresses(address(0xA), address(0xB));

        food.setEBTProgram(address(program));
        app.setProgramAsAdmin(address(program));

        vm.deal(user1, 10 ether);
        vm.deal(user2, 10 ether);
        vm.deal(user3, 10 ether);

        vm.startPrank(user1);
        app.apply4EBT("u1", "pic", "tw", 100, "u1");
        vm.stopPrank();

        vm.startPrank(user2);
        app.apply4EBT("u2", "pic", "tw", 100, "u2");
        vm.stopPrank();

        vm.startPrank(user3);
        app.apply4EBT("u3", "pic", "tw", 100, "u3");
        vm.stopPrank();

        app.approveUsers(_single("u1"));
        app.approveUsers(_single("u2"));
        app.approveUsers(_single("u3"));
    }

    function invariant_totalFundsRaisedAlwaysEqualsMintPriceTimesSupply() public view {
        uint256 supply = program.currentTokenId();
        assertEq(program.currentTokenId(), supply);
        assertEq(address(program).balance, program.totalFundsRaised(), "program balance matches tracked funds");
        assertEq(program.totalFundsRaised(), supply * MINT_PRICE, "funds raised equals mints * price");
    }

    function invariant_noOverMintBeyondHardCap() public view {
        // ensures never more than hard cap of funds collected
        assertLe(program.totalFundsRaised(), program.hardCap());
    }

    function invariant_installmentCountMaxThree() public view {
        uint256 supply = program.currentTokenId();
        for (uint256 i = 0; i < supply; i++) {
            assertLe(program.installmentCount(i), 3);
        }
    }

    function invariant_accountExistsForMintedTokens() public view {
        uint256 supply = program.currentTokenId();
        for (uint256 i = 0; i < supply; i++) {
            string memory uid = program.tokenIdToUserID(i);
            bytes32 salt = keccak256(abi.encodePacked(uid));
            address acct = registry.account(address(accountImpl), block.chainid, address(program), i, salt);
            assertTrue(acct != address(0), "account must exist");
        }
    }

    // handlers
    function mintU1() public {
        _mintMaybe(user1, "u1");
    }

    function mintU2() public {
        _mintMaybe(user2, "u2");
    }

    function claimU1(uint256 tokenId) public {
        _claim(user1, tokenId);
    }

    function claimU2(uint256 tokenId) public {
        _claim(user2, tokenId);
    }

    function _mintMaybe(address caller, string memory userId) internal {
        vm.roll(block.number + 4);
        vm.prank(caller);
        try program.mint{value: MINT_PRICE}(userId) {
        } catch {
            // ignore reverts in invariant harness
        }
    }

    function _claim(address caller, uint256 tokenId) internal {
        vm.warp(block.timestamp + 31 days);
        vm.prank(caller);
        try program.claimInstallment(tokenId) {
        } catch {
            // ignore reverts
        }
    }

    function mintU3() public {
        _mintMaybe(user3, "u3");
    }

    function _single(string memory id) internal pure returns (string[] memory ids) {
        ids = new string[](1);
        ids[0] = id;
    }
}
