// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Script.sol";
import "../contracts/EBTSlotMachine.sol";
import "../contracts/FoodStamps.sol";

/// @title EBT Slot Machine Deployment Script
/// @notice Deploys the slot machine contract to testnet
/// @dev Run with: forge script script/DeploySlotMachine.s.sol --rpc-url $SEPOLIA_RPC_URL --broadcast -vvvv
contract DeploySlotMachine is Script {
    // Existing deployed FoodStamps address on Sepolia
    address constant FOOD_STAMPS_ADDRESS = 0x345E91EBa4815252048C240020C96143380858F1;

    // Initial jackpot funding (in $EBTC wei)
    uint256 constant INITIAL_JACKPOT_FUNDING = 10_000 * 1e18; // 10,000 $EBTC

    // Initial payout pool funding
    uint256 constant INITIAL_PAYOUT_FUNDING = 50_000 * 1e18; // 50,000 $EBTC

    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        console.log("=== SLOT MACHINE DEPLOYMENT ===");
        console.log("Deploying from:", deployer);
        console.log("Chain ID:", block.chainid);
        console.log("FoodStamps address:", FOOD_STAMPS_ADDRESS);

        vm.startBroadcast(deployerKey);

        // 1. Deploy Slot Machine
        EBTSlotMachine slots = new EBTSlotMachine(FOOD_STAMPS_ADDRESS);
        console.log("1. EBTSlotMachine deployed to:", address(slots));

        // 2. Fund with $EBTC for payouts (requires deployer to have tokens)
        FoodStamps food = FoodStamps(FOOD_STAMPS_ADDRESS);
        uint256 deployerBalance = food.balanceOf(deployer);
        console.log("2. Deployer EBTC balance:", deployerBalance / 1e18);

        if (deployerBalance >= INITIAL_PAYOUT_FUNDING + INITIAL_JACKPOT_FUNDING) {
            // Transfer tokens to slot machine for payouts
            food.transfer(address(slots), INITIAL_PAYOUT_FUNDING);
            console.log("3. Transferred", INITIAL_PAYOUT_FUNDING / 1e18, "EBTC to slot machine");

            // Fund jackpot pool
            food.approve(address(slots), INITIAL_JACKPOT_FUNDING);
            slots.fundJackpot(INITIAL_JACKPOT_FUNDING);
            console.log("4. Funded jackpot with", INITIAL_JACKPOT_FUNDING / 1e18, "EBTC");
        } else {
            console.log("WARNING: Insufficient EBTC balance to fund slot machine");
            console.log("Required:", (INITIAL_PAYOUT_FUNDING + INITIAL_JACKPOT_FUNDING) / 1e18);
            console.log("Available:", deployerBalance / 1e18);
            console.log("Fund manually after deployment");
        }

        vm.stopBroadcast();

        // Print deployment summary
        console.log("");
        console.log("=== DEPLOYMENT COMPLETE ===");
        console.log("EBTSlotMachine:", address(slots));
        console.log("");
        console.log("NEXT STEPS:");
        console.log("1. Update frontend/src/lib/contracts/addresses.ts with:");
        console.log("   EBTSlotMachine: '", address(slots), "'");
        console.log("2. If funding failed, transfer EBTC to the slot machine manually");
        console.log("3. Optionally set EBT Program address for holder bonuses:");
        console.log("   slots.setEBTProgram(ebtProgramAddress)");
    }
}

/// @title Slot Machine Funding Script
/// @notice Funds an existing slot machine with tokens
/// @dev Run with: forge script script/DeploySlotMachine.s.sol:FundSlotMachine --rpc-url $SEPOLIA_RPC_URL --broadcast -vvvv
contract FundSlotMachine is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        // Get addresses from environment
        address slotsAddress = vm.envAddress("SLOT_MACHINE_ADDRESS");
        address foodAddress = vm.envOr("FOOD_STAMPS_ADDRESS", address(0x345E91EBa4815252048C240020C96143380858F1));
        uint256 payoutAmount = vm.envOr("PAYOUT_AMOUNT", uint256(50_000 * 1e18));
        uint256 jackpotAmount = vm.envOr("JACKPOT_AMOUNT", uint256(10_000 * 1e18));

        console.log("=== FUNDING SLOT MACHINE ===");
        console.log("Slot Machine:", slotsAddress);
        console.log("Payout funding:", payoutAmount / 1e18, "EBTC");
        console.log("Jackpot funding:", jackpotAmount / 1e18, "EBTC");

        vm.startBroadcast(deployerKey);

        EBTSlotMachine slots = EBTSlotMachine(slotsAddress);
        FoodStamps food = FoodStamps(foodAddress);

        // Transfer tokens for payouts
        if (payoutAmount > 0) {
            food.transfer(address(slots), payoutAmount);
            console.log("Transferred", payoutAmount / 1e18, "EBTC for payouts");
        }

        // Fund jackpot
        if (jackpotAmount > 0) {
            food.approve(address(slots), jackpotAmount);
            slots.fundJackpot(jackpotAmount);
            console.log("Funded jackpot with", jackpotAmount / 1e18, "EBTC");
        }

        vm.stopBroadcast();

        console.log("");
        console.log("=== FUNDING COMPLETE ===");
        console.log("Jackpot pool:", slots.jackpotPool() / 1e18, "EBTC");
        console.log("Contract balance:", food.balanceOf(address(slots)) / 1e18, "EBTC");
    }
}
