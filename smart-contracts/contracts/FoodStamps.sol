// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/security/Pausable.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/// @title FoodStamps ERC20 Token ($EBTC)
/// @notice The EBT Program's utility token with 20B max supply
/// @dev Distribution: 65% Protocol, 20% Marketing, 10% NFT Holders, 5% Team
contract FoodStamps is ERC20, Ownable, Pausable, ReentrancyGuard {

    // ============ Constants ============
    uint256 public constant MAX_SUPPLY = 20_000_000_000 * 1e18; // 20 billion tokens

    // Distribution amounts
    uint256 public constant PROTOCOL_ALLOCATION = 13_000_000_000 * 1e18;   // 65% - 13B
    uint256 public constant MARKETING_ALLOCATION = 4_000_000_000 * 1e18;   // 20% - 4B
    uint256 public constant NFT_HOLDER_ALLOCATION = 2_000_000_000 * 1e18;  // 10% - 2B
    uint256 public constant TEAM_ALLOCATION = 1_000_000_000 * 1e18;        // 5%  - 1B

    // ============ State Variables ============
    address public liquidityVault;
    address public teamVesting;
    address public marketingWallet;
    address public ebtProgram;

    bool public initialDistributionDone;

    mapping(address => bool) public hasReceivedFoodStamps;

    // ============ Events ============
    event InitialDistributionCompleted(
        address liquidityVault,
        address teamVesting,
        address marketingWallet,
        address ebtProgram
    );
    event EBTProgramSet(address indexed newEBTProgram);
    event LiquidityVaultUpdated(address indexed newLiquidityVault);
    event TeamVestingUpdated(address indexed newTeamVesting);
    event MarketingWalletUpdated(address indexed newMarketingWallet);
    event FoodStampsMinted(address indexed to, uint256 amount);
    event Withdrawal(address indexed owner, uint256 amount);

    // ============ Constructor ============
    constructor() ERC20("FoodStamps", "EBTC") {
        // No initial mint - all tokens distributed via initialDistribution
    }

    // ============ External Functions ============

    /// @notice Perform initial token distribution at TGE
    /// @param _liquidityVault Address of the liquidity vault (receives 65%)
    /// @param _teamVesting Address of the team vesting contract (receives 5%)
    /// @param _marketingWallet Address of marketing wallet (receives 20%)
    /// @param _ebtProgram Address of EBT Program (receives 10% for TGE airdrop)
    function initialDistribution(
        address _liquidityVault,
        address _teamVesting,
        address _marketingWallet,
        address _ebtProgram
    ) external onlyOwner {
        require(!initialDistributionDone, "Already distributed");
        require(_liquidityVault != address(0), "Invalid liquidity vault");
        require(_teamVesting != address(0), "Invalid team vesting");
        require(_marketingWallet != address(0), "Invalid marketing wallet");
        require(_ebtProgram != address(0), "Invalid EBT program");

        initialDistributionDone = true;
        liquidityVault = _liquidityVault;
        teamVesting = _teamVesting;
        marketingWallet = _marketingWallet;
        ebtProgram = _ebtProgram;

        // Mint allocations
        _mint(_liquidityVault, PROTOCOL_ALLOCATION);   // 13B to LiquidityVault
        _mint(_teamVesting, TEAM_ALLOCATION);           // 1B to TeamVesting
        _mint(_marketingWallet, MARKETING_ALLOCATION);  // 4B to Marketing
        _mint(_ebtProgram, NFT_HOLDER_ALLOCATION);      // 2B to EBTProgram for TGE airdrop

        emit InitialDistributionCompleted(
            _liquidityVault,
            _teamVesting,
            _marketingWallet,
            _ebtProgram
        );
    }

    /// @notice Approve spender for token transfers (standard ERC20 approve wrapper)
    /// @dev This replaces the vulnerable approveProxy function
    /// @param spender The address to approve
    /// @param amount The amount to approve
    function approveSpender(address spender, uint256 amount) external returns (bool) {
        _approve(msg.sender, spender, amount);
        return true;
    }

    // Note: Standard ERC20 allowance and transferFrom are used (inherited from OpenZeppelin)

    /// @notice Mint new tokens (only by authorized minters)
    /// @dev Can be called by LiquidityVault for buybacks
    function mint(address to, uint256 amount) external whenNotPaused {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        require(
            msg.sender == liquidityVault || msg.sender == owner(),
            "Only vault or owner can mint"
        );
        _mint(to, amount);
        hasReceivedFoodStamps[to] = true;
        emit FoodStampsMinted(to, amount);
    }

    /// @notice Pause token transfers
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Unpause token transfers
    function unpause() external onlyOwner {
        _unpause();
    }

    /// @notice Check interface support
    function supportsInterface(bytes4 interfaceId) public pure returns (bool) {
        return interfaceId == type(IERC165).interfaceId;
    }

    /// @notice Withdraw any ETH accidentally sent to the contract
    function withdraw() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No ETH to withdraw");
        payable(owner()).transfer(balance);
        emit Withdrawal(owner(), balance);
    }

    // ============ Admin Functions ============

    /// @notice Update the liquidity vault address (emergency only)
    function setLiquidityVault(address _liquidityVault) external onlyOwner {
        require(_liquidityVault != address(0), "Invalid address");
        liquidityVault = _liquidityVault;
        emit LiquidityVaultUpdated(_liquidityVault);
    }

    /// @notice Update the team vesting address (emergency only)
    function setTeamVesting(address _teamVesting) external onlyOwner {
        require(_teamVesting != address(0), "Invalid address");
        teamVesting = _teamVesting;
        emit TeamVestingUpdated(_teamVesting);
    }

    /// @notice Update the marketing wallet address (emergency only)
    function setMarketingWallet(address _marketingWallet) external onlyOwner {
        require(_marketingWallet != address(0), "Invalid address");
        marketingWallet = _marketingWallet;
        emit MarketingWalletUpdated(_marketingWallet);
    }

    /// @notice Update the EBT Program address (emergency only)
    function setEBTProgram(address _ebtProgram) external onlyOwner {
        require(_ebtProgram != address(0), "Invalid address");
        ebtProgram = _ebtProgram;
        emit EBTProgramSet(_ebtProgram);
    }

    // ============ View Functions ============

    /// @notice Get allocation info
    function getAllocationInfo() external pure returns (
        uint256 protocol,
        uint256 marketing,
        uint256 nftHolder,
        uint256 team
    ) {
        return (
            PROTOCOL_ALLOCATION,
            MARKETING_ALLOCATION,
            NFT_HOLDER_ALLOCATION,
            TEAM_ALLOCATION
        );
    }

    /// @notice Get remaining mintable supply
    function remainingMintableSupply() external view returns (uint256) {
        return MAX_SUPPLY - totalSupply();
    }

    // ============ Internal Functions ============

    /// @notice Hook called before any transfer
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);

        // Track recipients
        if (to != address(0) && amount > 0) {
            hasReceivedFoodStamps[to] = true;
        }
    }
}
