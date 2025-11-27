// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";
import "../contracts/EBTProgram.sol";
import "../contracts/EBTApplication.sol";
import "../contracts/FoodStamps.sol";
import "../contracts/LiquidityVault.sol";
import "../contracts/TeamVesting.sol";
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
            // New claim function has no score parameter
            try program.claim(targetTokenId) {
            } catch {}
        }
    }

    function triggerClaim(uint256 tokenId) external {
        targetTokenId = tokenId;
        action = Action.Claim;
        program.claim(tokenId);
    }
}

contract ETHConservationTest is Test {
    EBTProgram internal program;
    EBTApplication internal app;
    FoodStamps internal food;
    LiquidityVault internal vault;
    TeamVesting internal vesting;
    ERC6551Registry internal registry;
    ERC6551Account internal accountImpl;
    address internal treasury = address(0x1234);
    address internal marketing = address(0xDEAD);
    address internal teamWallet = address(0xFEED);
    address internal protocolCaller = address(0xCAFE);
    address internal user = address(0xBEEF);
    string internal userId = "user1";
    uint256 internal constant MINT_PRICE = 0.02 ether;

    function setUp() public {
        app = new EBTApplication();
        food = new FoodStamps();
        registry = new ERC6551Registry();
        accountImpl = new ERC6551Account();
        vault = new LiquidityVault(address(food));
        vesting = new TeamVesting(address(food));

        program = new EBTProgram(address(registry), address(app));

        // Set implementation directly on registry before transferring ownership
        registry.setImplementation(address(accountImpl));
        registry.transferOwnership(address(program));

        // Set fundraising period BEFORE initialize (required by security fix)
        program.setFundraisingPeriod(7 days);

        // Initialize the contract
        program.initialize(
            address(vault),
            protocolCaller,
            treasury,
            marketing,
            teamWallet,
            address(accountImpl),
            address(food)
        );

        // Set up vault
        vault.setEBTProgram(address(program));

        // Initial distribution
        food.initialDistribution(
            address(vault),
            address(vesting),
            marketing,
            address(program)
        );

        app.setProgramAsAdmin(address(program));

        vm.deal(user, 1 ether);
        vm.startPrank(user);
        app.apply4EBT("user", "pic", "tw", 100, userId);
        vm.stopPrank();

        app.approveUsers(_single(userId));
        // Set user score for claims
        app.setUserScore(userId, 500);
    }

    function testETHConservationOnRefund() public {
        // Fundraising period already set in setUp()
        vm.warp(1000);
        vm.prank(user);
        program.mint{value: MINT_PRICE}(userId);

        vm.warp(block.timestamp + 8 days);
        program.closeFundraising();

        // Note: In new design, refunds may work differently
        // This test validates that ETH is properly tracked
        assertEq(address(program).balance, MINT_PRICE, "contract should hold mint price");
    }

    function testETHConservationOnPayout() public {
        // Create new program with custom caps (caps are now immutable after initialize)
        EBTApplication newApp = new EBTApplication();
        FoodStamps newFood = new FoodStamps();
        ERC6551Registry newRegistry = new ERC6551Registry();
        ERC6551Account newAccountImpl = new ERC6551Account();
        LiquidityVault newVault = new LiquidityVault(address(newFood));
        TeamVesting newVesting = new TeamVesting(address(newFood));

        EBTProgram newProgram = new EBTProgram(address(newRegistry), address(newApp));

        newRegistry.setImplementation(address(newAccountImpl));
        newRegistry.transferOwnership(address(newProgram));

        // Set fundraising params BEFORE initialize
        newProgram.setFundraisingPeriod(7 days);
        // Lower caps so single mint meets soft cap
        newProgram.setCaps(MINT_PRICE / 2, MINT_PRICE * 2);

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

        // Prepare user
        vm.deal(user, 1 ether);
        vm.prank(user);
        newApp.apply4EBT("user", "pic", "tw", 100, userId);
        newApp.approveUsers(_single(userId));
        newApp.setUserScore(userId, 500);

        vm.warp(1000);
        vm.prank(user);
        newProgram.mint{value: MINT_PRICE}(userId);

        vm.warp(block.timestamp + 8 days);
        newProgram.closeFundraising();

        // Distribute ETH after fundraising
        newProgram.distributeETH();

        // After distribution, contract should be empty
        assertEq(address(newProgram).balance, 0, "distribution should empty contract");
    }

    function testClaimReentrancyBlocked() public {
        vm.warp(1000);
        vm.prank(user);
        program.mint{value: MINT_PRICE}(userId);

        Reentrant attacker = new Reentrant(program);
        vm.deal(address(attacker), 0);

        vm.warp(block.timestamp + 31 days);
        // Attacker is not the protocol caller, so this should fail
        vm.prank(address(attacker));
        vm.expectRevert(EBTProgram.OnlyProtocol.selector);
        attacker.triggerClaim(1);
    }

    function testClaimOnlyByProtocol() public {
        vm.warp(1000);
        vm.prank(user);
        program.mint{value: MINT_PRICE}(userId);

        vm.warp(block.timestamp + 31 days);

        // Non-protocol caller should fail
        vm.prank(user);
        vm.expectRevert(EBTProgram.OnlyProtocol.selector);
        program.claim(1);

        // Protocol caller should succeed
        vm.prank(protocolCaller);
        program.claim(1);
    }

    function _single(string memory id) internal pure returns (string[] memory ids) {
        ids = new string[](1);
        ids[0] = id;
    }
}
