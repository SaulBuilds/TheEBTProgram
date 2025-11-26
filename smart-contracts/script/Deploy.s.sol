// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/EBTProgram.sol";
import "../contracts/ERC6551Registry.sol";
import "../contracts/ERC6551Account.sol";
import "../contracts/FoodStamps.sol";
import "../contracts/EBTApplication.sol";

/// @title EBTCard Deployment Script
/// @notice Deploys all contracts to Sepolia testnet
/// @dev Run with: forge script script/Deploy.s.sol --rpc-url $SEPOLIA_RPC_URL --broadcast --verify
contract Deploy is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        console.log("Deploying from:", deployer);
        console.log("Chain ID:", block.chainid);

        vm.startBroadcast(deployerKey);

        // 1. Deploy EBTApplication (manages user applications)
        EBTApplication app = new EBTApplication();
        console.log("EBTApplication deployed to:", address(app));

        // 2. Deploy FoodStamps ERC-20 token
        FoodStamps food = new FoodStamps();
        console.log("FoodStamps deployed to:", address(food));

        // 3. Deploy ERC-6551 Registry (manages token-bound accounts)
        ERC6551Registry registry = new ERC6551Registry();
        console.log("ERC6551Registry deployed to:", address(registry));

        // 4. Deploy ERC-6551 Account implementation
        ERC6551Account accountImpl = new ERC6551Account();
        console.log("ERC6551Account implementation deployed to:", address(accountImpl));

        // 5. Set implementation on registry BEFORE transferring ownership
        registry.setImplementation(address(accountImpl));
        console.log("Registry implementation set to:", address(accountImpl));

        // 6. Deploy EBTProgram (main NFT contract)
        EBTProgram program = new EBTProgram(address(registry), address(food), address(app));
        console.log("EBTProgram deployed to:", address(program));

        // 7. Transfer registry ownership to EBTProgram
        registry.transferOwnership(address(program));
        console.log("Registry ownership transferred to EBTProgram");

        // 8. Set account implementation reference in EBTProgram
        program.setAccountImplementationInternal(address(accountImpl));
        console.log("EBTProgram account implementation set");

        // 9. Set payout addresses (deployer as both for now - update for production)
        program.setPayoutAddresses(deployer, deployer);
        console.log("Payout addresses set to deployer");

        // 10. Configure FoodStamps to recognize EBTProgram
        food.setEBTProgram(address(program));
        console.log("FoodStamps configured with EBTProgram");

        // 11. Set EBTProgram as admin in EBTApplication
        app.setProgramAsAdmin(address(program));
        console.log("EBTApplication configured with EBTProgram as admin");

        vm.stopBroadcast();

        // Print deployment summary
        console.log("\n=== DEPLOYMENT SUMMARY ===");
        console.log("Network:", block.chainid);
        console.log("EBTApplication:", address(app));
        console.log("FoodStamps:", address(food));
        console.log("ERC6551Registry:", address(registry));
        console.log("ERC6551Account:", address(accountImpl));
        console.log("EBTProgram:", address(program));
        console.log("\nCopy these addresses to your .env files!");
    }
}
