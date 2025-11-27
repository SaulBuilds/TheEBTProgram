#!/bin/bash

# Sepolia Contract Verification Script
# Run with: ./script/verify-contracts.sh

set -e

echo "============================================"
echo "  EBT Program - Contract Verification"
echo "  Network: Sepolia (Chain ID: 11155111)"
echo "============================================"
echo ""

# Check for required environment variable
if [ -z "$ETHERSCAN_API_KEY" ]; then
    echo "ERROR: ETHERSCAN_API_KEY environment variable not set"
    echo "Run: export ETHERSCAN_API_KEY=your_api_key"
    exit 1
fi

# Contract addresses from deployment
EBTAPPLICATION="0x2E84f1fFF8E37A55Cc90B2f268C0d233d5aE5045"
FOODSTAMPS="0xd89406651698c85423e94D932bac95fA5Ab729Ec"
ERC6551REGISTRY="0xb22F642c3303bDe27131f58b46E7d75Aa194df0c"
ERC6551ACCOUNT="0xb812Dd421F2AB112fc7c33c75369148D115bEB4E"
LIQUIDITYVAULT="0x6d15041ce06E367776CdcE1aFf1A2fAD31f44131"
TEAMVESTING="0xa1400a541c0fE2364fd502003C5273AEFaA0D244"
EBTPROGRAM="0x9A7809EB76D30A754b730Dcfff1286bBff0775aa"

verify_contract() {
    local name=$1
    local address=$2
    local contract_path=$3
    local constructor_args=$4

    echo "-------------------------------------------"
    echo "Verifying: $name"
    echo "Address:   $address"
    echo "-------------------------------------------"

    if [ -z "$constructor_args" ]; then
        forge verify-contract "$address" "$contract_path" \
            --chain sepolia \
            --etherscan-api-key "$ETHERSCAN_API_KEY" \
            --watch && echo "✅ $name verified successfully!" || echo "⚠️  $name verification failed (may already be verified)"
    else
        forge verify-contract "$address" "$contract_path" \
            --chain sepolia \
            --etherscan-api-key "$ETHERSCAN_API_KEY" \
            --constructor-args "$constructor_args" \
            --watch && echo "✅ $name verified successfully!" || echo "⚠️  $name verification failed (may already be verified)"
    fi
    echo ""
    sleep 2
}

echo "Starting verification process..."
echo ""

# 1. EBTApplication - no constructor args
verify_contract "EBTApplication" "$EBTAPPLICATION" "contracts/EBTApplication.sol:EBTApplication"

# 2. FoodStamps - no constructor args
verify_contract "FoodStamps" "$FOODSTAMPS" "contracts/FoodStamps.sol:FoodStamps"

# 3. ERC6551Registry - no constructor args
verify_contract "ERC6551Registry" "$ERC6551REGISTRY" "contracts/ERC6551Registry.sol:ERC6551Registry"

# 4. ERC6551Account - no constructor args
verify_contract "ERC6551Account" "$ERC6551ACCOUNT" "contracts/ERC6551Account.sol:ERC6551Account"

# 5. LiquidityVault - constructor(address _foodToken)
LIQUIDITYVAULT_ARGS=$(cast abi-encode "constructor(address)" "$FOODSTAMPS")
verify_contract "LiquidityVault" "$LIQUIDITYVAULT" "contracts/LiquidityVault.sol:LiquidityVault" "$LIQUIDITYVAULT_ARGS"

# 6. TeamVesting - constructor(address _foodToken)
TEAMVESTING_ARGS=$(cast abi-encode "constructor(address)" "$FOODSTAMPS")
verify_contract "TeamVesting" "$TEAMVESTING" "contracts/TeamVesting.sol:TeamVesting" "$TEAMVESTING_ARGS"

# 7. EBTProgram - constructor(address _registry, address _ebtApplication)
EBTPROGRAM_ARGS=$(cast abi-encode "constructor(address,address)" "$ERC6551REGISTRY" "$EBTAPPLICATION")
verify_contract "EBTProgram" "$EBTPROGRAM" "contracts/EBTProgram.sol:EBTProgram" "$EBTPROGRAM_ARGS"

echo "============================================"
echo "  Verification Complete!"
echo "============================================"
echo ""
echo "View contracts on Sepolia Etherscan:"
echo "  EBTApplication:  https://sepolia.etherscan.io/address/$EBTAPPLICATION"
echo "  FoodStamps:      https://sepolia.etherscan.io/address/$FOODSTAMPS"
echo "  ERC6551Registry: https://sepolia.etherscan.io/address/$ERC6551REGISTRY"
echo "  ERC6551Account:  https://sepolia.etherscan.io/address/$ERC6551ACCOUNT"
echo "  LiquidityVault:  https://sepolia.etherscan.io/address/$LIQUIDITYVAULT"
echo "  TeamVesting:     https://sepolia.etherscan.io/address/$TEAMVESTING"
echo "  EBTProgram:      https://sepolia.etherscan.io/address/$EBTPROGRAM"
echo ""
