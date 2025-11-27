// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/// @title ILiquidityVault Interface
/// @notice Interface for the LiquidityVault contract that manages token distributions
interface ILiquidityVault {
    /// @notice Distribute tokens at mint time
    /// @param tba The token-bound account address
    /// @param amount The amount of tokens to distribute
    function distributeAtMint(address tba, uint256 amount) external;

    /// @notice Distribute tokens at claim time
    /// @param tba The token-bound account address
    /// @param amount The amount of tokens to distribute
    function distributeAtClaim(address tba, uint256 amount) external;

    /// @notice Distribute TGE airdrop tokens
    /// @param tba The token-bound account address
    /// @param amount The amount of tokens to distribute
    function distributeTGE(address tba, uint256 amount) external;

    /// @notice Deposit ETH into the vault (called after fundraising)
    function depositETH() external payable;

    /// @notice Execute monthly buyback and distribution
    function monthlyOperation() external;

    /// @notice Get the total tokens available for distribution
    function availableTokens() external view returns (uint256);

    /// @notice Get the ETH balance in the vault
    function ethBalance() external view returns (uint256);
}
