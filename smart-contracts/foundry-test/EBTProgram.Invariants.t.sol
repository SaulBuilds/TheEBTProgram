// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";
import "../contracts/EBTProgram.sol";
import "../contracts/EBTApplication.sol";
import "../contracts/FoodStamps.sol";
import "../contracts/LiquidityVault.sol";
import "../contracts/ERC6551Registry.sol";
import "../contracts/ERC6551Account.sol";

contract EBTProgramInvariants is Test {
    EBTProgram internal program;
    EBTApplication internal app;
    FoodStamps internal food;
    LiquidityVault internal vault;
    ERC6551Registry internal registry;
    ERC6551Account internal accountImpl;

    address internal user1 = address(0x1);
    address internal user2 = address(0x2);
    address internal user3 = address(0x3);
    address internal protocolCaller = address(0x4);
    address internal treasury = address(0x5);
    address internal marketing = address(0x6);
    address internal team = address(0x7);

    uint256 internal constant MIN_PRICE = 0.02 ether;

    function setUp() public {
        app = new EBTApplication();
        food = new FoodStamps();
        registry = new ERC6551Registry();
        accountImpl = new ERC6551Account();
        vault = new LiquidityVault(address(food));

        program = new EBTProgram(address(registry), address(app));

        // Set implementation directly on registry before transferring ownership
        registry.setImplementation(address(accountImpl));
        registry.transferOwnership(address(program));

        // Initialize program with all required addresses
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

        vm.deal(user1, 100 ether);
        vm.deal(user2, 100 ether);
        vm.deal(user3, 100 ether);

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

        // Set scores for claim calculations
        app.setUserScore("u1", 500);
        app.setUserScore("u2", 500);
        app.setUserScore("u3", 500);
    }

    function invariant_totalRaisedAlwaysMatchesBalance() public view {
        assertEq(address(program).balance, program.totalRaised(), "program balance matches tracked funds");
    }

    function invariant_noOverMintBeyondHardCap() public view {
        assertLe(program.totalRaised(), program.hardCap());
    }

    function invariant_claimCountMaxThree() public view {
        uint256 supply = program.currentTokenId();
        for (uint256 i = 1; i < supply; i++) {
            (,uint256 claimCount,,,, ) = program.tokenData(i);
            assertLe(claimCount, 3);
        }
    }

    function invariant_accountExistsForMintedTokens() public view {
        uint256 supply = program.currentTokenId();
        for (uint256 i = 1; i < supply; i++) {
            address tba = program.getTBA(i);
            assertTrue(tba != address(0), "TBA must exist");
        }
    }

    // handlers
    function mintU1() public {
        _mintMaybe(user1, "u1", MIN_PRICE);
    }

    function mintU2() public {
        _mintMaybe(user2, "u2", 0.5 ether);
    }

    function claimU1(uint256 tokenId) public {
        _claim(tokenId);
    }

    function _mintMaybe(address caller, string memory userId, uint256 price) internal {
        vm.roll(block.number + 4);
        vm.prank(caller);
        try program.mint{value: price}(userId) {
        } catch {
            // ignore reverts in invariant harness
        }
    }

    function _claim(uint256 tokenId) internal {
        vm.warp(block.timestamp + 31 days);
        vm.prank(protocolCaller);
        try program.claim(tokenId) {
        } catch {
            // ignore reverts
        }
    }

    function mintU3() public {
        _mintMaybe(user3, "u3", 1 ether);
    }

    function _single(string memory id) internal pure returns (string[] memory ids) {
        ids = new string[](1);
        ids[0] = id;
    }
}
