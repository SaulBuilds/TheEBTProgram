// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Script.sol";
import "../contracts/EBTProgram.sol";
import "../contracts/ERC6551Registry.sol";
import "../contracts/ERC6551Account.sol";
import "../contracts/FoodStamps.sol";
import "../contracts/LiquidityVault.sol";
import "../contracts/TeamVesting.sol";
import "../contracts/EBTApplication.sol";

/// @title EBTCard Deployment Script
/// @notice Deploys all contracts to Sepolia testnet
/// @dev Run with: forge script script/Deploy.s.sol --rpc-url $SEPOLIA_RPC_URL --broadcast --verify -vvvv
contract Deploy is Script {
    // Deployment configuration
    uint256 constant SOFT_CAP = 20 ether;      // Soft cap for fundraising
    uint256 constant HARD_CAP = 2000 ether;   // Hard cap for fundraising
    uint256 constant FUNDRAISING_PERIOD = 30 days;

    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        // Configure these addresses before deployment (defaults to deployer for testnet)
        address treasury = vm.envOr("TREASURY_ADDRESS", deployer);
        address marketing = vm.envOr("MARKETING_ADDRESS", deployer);
        address teamWallet = vm.envOr("TEAM_WALLET_ADDRESS", deployer);
        address protocolCaller = vm.envOr("PROTOCOL_CALLER_ADDRESS", deployer);

        console.log("=== DEPLOYMENT STARTING ===");
        console.log("Deploying from:", deployer);
        console.log("Chain ID:", block.chainid);

        vm.startBroadcast(deployerKey);

        // 1. Deploy EBTApplication (manages user applications)
        EBTApplication app = new EBTApplication();
        console.log("1. EBTApplication deployed to:", address(app));

        // 2. Deploy FoodStamps ERC-20 token (symbol: EBTC)
        FoodStamps food = new FoodStamps();
        console.log("2. FoodStamps (EBTC) deployed to:", address(food));

        // 3. Deploy ERC-6551 Registry (manages token-bound accounts)
        ERC6551Registry registry = new ERC6551Registry();
        console.log("3. ERC6551Registry deployed to:", address(registry));

        // 4. Deploy ERC-6551 Account implementation
        ERC6551Account accountImpl = new ERC6551Account();
        console.log("4. ERC6551Account implementation deployed to:", address(accountImpl));

        // 5. Deploy LiquidityVault (holds 65% of tokens)
        LiquidityVault vault = new LiquidityVault(address(food));
        console.log("5. LiquidityVault deployed to:", address(vault));

        // 6. Deploy TeamVesting (holds 5% of tokens with vesting)
        TeamVesting vesting = new TeamVesting(address(food));
        console.log("6. TeamVesting deployed to:", address(vesting));

        // 7. Set implementation on registry BEFORE transferring ownership
        registry.setImplementation(address(accountImpl));
        console.log("7. Registry implementation set");

        // 8. Deploy EBTProgram (main NFT contract - symbol: SNAP)
        EBTProgram program = new EBTProgram(address(registry), address(app));
        console.log("8. EBTProgram (SNAP) deployed to:", address(program));

        // 9. Transfer registry ownership to EBTProgram
        registry.transferOwnership(address(program));
        console.log("9. Registry ownership transferred to EBTProgram");

        // 10. CRITICAL: Set fundraising params BEFORE initialize (security requirement)
        program.setFundraisingPeriod(FUNDRAISING_PERIOD);
        console.log("10. Fundraising period set to:", FUNDRAISING_PERIOD / 1 days, "days");

        program.setCaps(SOFT_CAP, HARD_CAP);
        console.log("11. Caps set - Soft:", SOFT_CAP / 1 ether);
        console.log("    Hard cap:", HARD_CAP / 1 ether);

        // 12. Initialize EBTProgram with all addresses
        program.initialize(
            address(vault),
            protocolCaller,
            treasury,
            marketing,
            teamWallet,
            address(accountImpl),
            address(food)
        );
        console.log("12. EBTProgram initialized");

        // 13. Configure LiquidityVault
        vault.setEBTProgram(address(program));
        console.log("13. LiquidityVault configured with EBTProgram");

        // 14. Configure TeamVesting
        vesting.setTeamWallet(teamWallet);
        console.log("14. TeamVesting configured with team wallet");

        // 15. Perform initial token distribution
        // 65% to vault, 20% to marketing, 10% to program (for NFT holder TGE), 5% to vesting
        food.initialDistribution(
            address(vault),
            address(vesting),
            marketing,
            address(program)
        );
        console.log("15. Initial token distribution completed");

        // 16. Set EBTProgram as admin in EBTApplication
        app.setProgramAsAdmin(address(program));
        console.log("16. EBTApplication configured with EBTProgram as admin");

        vm.stopBroadcast();

        // Print deployment summary
        console.log("\n");
        console.log("========================================");
        console.log("       DEPLOYMENT SUMMARY");
        console.log("========================================");
        console.log("Network Chain ID:", block.chainid);
        console.log("");
        console.log("--- Contract Addresses ---");
        console.log("EBTApplication:    ", address(app));
        console.log("FoodStamps (EBTC): ", address(food));
        console.log("ERC6551Registry:   ", address(registry));
        console.log("ERC6551Account:    ", address(accountImpl));
        console.log("LiquidityVault:    ", address(vault));
        console.log("TeamVesting:       ", address(vesting));
        console.log("EBTProgram (SNAP): ", address(program));
        console.log("");
        console.log("--- Configuration ---");
        console.log("Treasury:         ", treasury);
        console.log("Marketing:        ", marketing);
        console.log("Team Wallet:      ", teamWallet);
        console.log("Protocol Caller:  ", protocolCaller);
        console.log("");
        console.log("--- Fundraising ---");
        console.log("Soft Cap:         ", SOFT_CAP / 1 ether, "ETH");
        console.log("Hard Cap:         ", HARD_CAP / 1 ether, "ETH");
        console.log("Period:           ", FUNDRAISING_PERIOD / 1 days, "days");
        console.log("");
        console.log("--- Token Distribution ---");
        console.log("Vault (65%):      ", food.balanceOf(address(vault)) / 1e18);
        console.log("Marketing (20%):  ", food.balanceOf(marketing) / 1e18);
        console.log("Program TGE (10%):", food.balanceOf(address(program)) / 1e18);
        console.log("Team Vesting (5%):", food.balanceOf(address(vesting)) / 1e18);
        console.log("========================================");
        console.log("");
        console.log("Copy these addresses to your .env files!");
    }
}
