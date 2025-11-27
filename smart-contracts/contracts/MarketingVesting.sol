// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/// @title MarketingVesting
/// @notice Linear vesting contract for marketing partnerships (KOLs, ambassadors, associates)
/// @dev Deploys via LiquidityVault factory - tokens vest linearly over a configurable period
contract MarketingVesting is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ Errors ============
    error NotBeneficiary();
    error NotFactory();
    error VestingNotStarted();
    error NothingToClaim();
    error AlreadyRevoked();
    error NotRevocable();
    error ZeroAddress();
    error ZeroAmount();
    error InvalidDuration();
    error AlreadyInitialized();  // M-3 fix

    // ============ State Variables ============
    IERC20 public immutable token;
    address public immutable factory;
    address public beneficiary;
    bool private _initialized;  // M-3 fix: Prevent re-initialization

    uint256 public totalAllocation;
    uint256 public claimed;
    uint256 public vestingStart;
    uint256 public vestingDuration;

    bool public revocable;
    bool public revoked;

    string public partnerName;
    string public partnershipType; // "KOL", "Ambassador", "Associate", etc.

    // ============ Structs ============
    struct VestingInfo {
        address beneficiary;
        uint256 totalAllocation;
        uint256 claimed;
        uint256 vested;
        uint256 claimable;
        uint256 vestingStart;
        uint256 vestingDuration;
        uint256 timeRemaining;
        bool revocable;
        bool revoked;
        string partnerName;
        string partnershipType;
    }

    // ============ Events ============
    event VestingInitialized(
        address indexed beneficiary,
        uint256 totalAllocation,
        uint256 vestingStart,
        uint256 vestingDuration,
        string partnerName,
        string partnershipType
    );
    event TokensClaimed(address indexed beneficiary, uint256 amount);
    event VestingRevoked(address indexed beneficiary, uint256 unvestedAmount);
    event BeneficiaryUpdated(address indexed oldBeneficiary, address indexed newBeneficiary);

    // ============ Constructor ============
    constructor(address _token, address _factory) {
        if (_token == address(0)) revert ZeroAddress();
        if (_factory == address(0)) revert ZeroAddress();
        token = IERC20(_token);
        factory = _factory;
    }

    // ============ Modifiers ============
    modifier onlyBeneficiary() {
        if (msg.sender != beneficiary) revert NotBeneficiary();
        _;
    }

    modifier onlyFactory() {
        if (msg.sender != factory) revert NotFactory();
        _;
    }

    // ============ Initialization ============

    /// @notice Initialize the vesting contract (called by factory)
    /// @dev M-3 fix: Added initialization check to prevent race conditions
    /// @param _beneficiary Address receiving the vested tokens
    /// @param _totalAllocation Total tokens to vest
    /// @param _vestingDuration Duration of vesting in seconds
    /// @param _revocable Whether the vesting can be revoked by admin
    /// @param _partnerName Name of the partner for transparency
    /// @param _partnershipType Type of partnership (KOL, Ambassador, etc.)
    function initialize(
        address _beneficiary,
        uint256 _totalAllocation,
        uint256 _vestingDuration,
        bool _revocable,
        string calldata _partnerName,
        string calldata _partnershipType
    ) external onlyFactory {
        // M-3 fix: Prevent re-initialization
        if (_initialized) revert AlreadyInitialized();
        _initialized = true;

        if (_beneficiary == address(0)) revert ZeroAddress();
        if (_totalAllocation == 0) revert ZeroAmount();
        if (_vestingDuration == 0) revert InvalidDuration();

        beneficiary = _beneficiary;
        totalAllocation = _totalAllocation;
        vestingStart = block.timestamp;
        vestingDuration = _vestingDuration;
        revocable = _revocable;
        partnerName = _partnerName;
        partnershipType = _partnershipType;

        emit VestingInitialized(
            _beneficiary,
            _totalAllocation,
            vestingStart,
            _vestingDuration,
            _partnerName,
            _partnershipType
        );
    }

    // ============ External Functions ============

    /// @notice Claim vested tokens
    function claim() external onlyBeneficiary nonReentrant {
        if (vestingStart == 0) revert VestingNotStarted();

        uint256 claimableAmount = vestedAmount() - claimed;
        if (claimableAmount == 0) revert NothingToClaim();

        claimed += claimableAmount;
        token.safeTransfer(beneficiary, claimableAmount);

        emit TokensClaimed(beneficiary, claimableAmount);
    }

    /// @notice Revoke vesting and return unvested tokens to factory
    /// @dev Only callable by factory (admin controlled)
    function revoke() external onlyFactory nonReentrant {
        if (!revocable) revert NotRevocable();
        if (revoked) revert AlreadyRevoked();

        // Calculate vested amount BEFORE setting revoked flag
        uint256 vestedAtRevoke = vestedAmount();
        uint256 unvestedAtRevoke = totalAllocation - vestedAtRevoke;

        // Now set revoked flag
        revoked = true;

        // Update allocation to only what's vested
        totalAllocation = vestedAtRevoke;

        // Return unvested tokens to factory
        if (unvestedAtRevoke > 0) {
            token.safeTransfer(factory, unvestedAtRevoke);
        }

        emit VestingRevoked(beneficiary, unvestedAtRevoke);
    }

    /// @notice Update beneficiary address (only by current beneficiary)
    /// @param newBeneficiary New address to receive vested tokens
    function updateBeneficiary(address newBeneficiary) external onlyBeneficiary {
        if (newBeneficiary == address(0)) revert ZeroAddress();

        address oldBeneficiary = beneficiary;
        beneficiary = newBeneficiary;

        emit BeneficiaryUpdated(oldBeneficiary, newBeneficiary);
    }

    // ============ View Functions ============

    /// @notice Calculate total vested amount (linear vesting)
    function vestedAmount() public view returns (uint256) {
        if (vestingStart == 0) return 0;
        if (revoked) return totalAllocation; // If revoked, all remaining is vested

        uint256 elapsed = block.timestamp - vestingStart;

        if (elapsed >= vestingDuration) {
            return totalAllocation;
        }

        // Linear vesting: amount * elapsed / duration
        return (totalAllocation * elapsed) / vestingDuration;
    }

    /// @notice Get claimable amount
    function claimable() external view returns (uint256) {
        return vestedAmount() - claimed;
    }

    /// @notice Get unvested amount
    function unvested() external view returns (uint256) {
        return totalAllocation - vestedAmount();
    }

    /// @notice Get vesting progress as percentage (basis points)
    function vestingProgress() external view returns (uint256) {
        if (totalAllocation == 0) return 0;
        return (vestedAmount() * 10000) / totalAllocation;
    }

    /// @notice Get time remaining until fully vested
    function timeRemaining() external view returns (uint256) {
        if (vestingStart == 0) return vestingDuration;

        uint256 elapsed = block.timestamp - vestingStart;
        if (elapsed >= vestingDuration) return 0;

        return vestingDuration - elapsed;
    }

    /// @notice Get full vesting info for transparency
    function getVestingInfo() external view returns (VestingInfo memory) {
        uint256 vested = vestedAmount();
        uint256 elapsed = vestingStart > 0 ? block.timestamp - vestingStart : 0;
        uint256 remaining = elapsed >= vestingDuration ? 0 : vestingDuration - elapsed;

        return VestingInfo({
            beneficiary: beneficiary,
            totalAllocation: totalAllocation,
            claimed: claimed,
            vested: vested,
            claimable: vested - claimed,
            vestingStart: vestingStart,
            vestingDuration: vestingDuration,
            timeRemaining: remaining,
            revocable: revocable,
            revoked: revoked,
            partnerName: partnerName,
            partnershipType: partnershipType
        });
    }
}
