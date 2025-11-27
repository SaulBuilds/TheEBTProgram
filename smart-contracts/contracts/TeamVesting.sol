// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title TeamVesting
/// @notice Manages the 5% team token allocation (1B tokens) with vesting
/// @dev Vesting schedule: 1% at TGE, then 1% per month for 4 months
contract TeamVesting is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ Errors ============
    error InvalidAddress();
    error NothingToClaim();
    error TGENotStarted();
    error TeamWalletNotSet();
    error VestingAlreadyTerminated();
    error AlreadyTerminated();

    // ============ Constants ============
    uint256 public constant TOTAL_ALLOCATION = 1_000_000_000 * 1e18; // 1B tokens (5% of 20B)
    uint256 public constant MONTHLY_RELEASE = 200_000_000 * 1e18;    // 200M tokens (1% of 20B)
    uint256 public constant VESTING_DURATION = 4;                     // 4 months after TGE
    uint256 public constant MONTH = 30 days;

    // ============ State Variables ============
    IERC20 public immutable foodToken;
    address public teamWallet;
    uint256 public tgeTimestamp;
    uint256 public totalClaimed;
    bool public tgeStarted;
    bool public terminated;  // M-2 fix: Emergency termination flag

    // ============ Events ============
    event TGEStarted(uint256 timestamp);
    event TokensClaimed(address indexed to, uint256 amount, uint256 monthsClaimed);
    event TeamWalletUpdated(address indexed oldWallet, address indexed newWallet);
    event VestingTerminated(uint256 returnedAmount);  // M-2 fix

    // ============ Constructor ============
    constructor(address _foodToken) {
        if (_foodToken == address(0)) revert InvalidAddress();
        foodToken = IERC20(_foodToken);
    }

    // ============ External Functions ============

    /// @notice Start the TGE (Token Generation Event)
    /// @dev Can only be called once by owner
    function startTGE() external onlyOwner {
        require(!tgeStarted, "TGE already started");
        tgeStarted = true;
        tgeTimestamp = block.timestamp;
        emit TGEStarted(tgeTimestamp);
    }

    /// @notice Claim available vested tokens
    /// @dev Calculates how many months have passed and releases accordingly
    /// @dev M-2 fix: Added termination check
    function claim() external nonReentrant {
        if (terminated) revert VestingAlreadyTerminated();
        if (!tgeStarted) revert TGENotStarted();
        if (teamWallet == address(0)) revert TeamWalletNotSet();

        uint256 claimable = getClaimableAmount();
        if (claimable == 0) revert NothingToClaim();

        totalClaimed += claimable;
        foodToken.safeTransfer(teamWallet, claimable);

        emit TokensClaimed(teamWallet, claimable, getMonthsPassed());
    }

    // ============ Admin Functions ============

    /// @notice Set the team wallet address (multisig)
    /// @param _teamWallet The team multisig wallet address
    function setTeamWallet(address _teamWallet) external onlyOwner {
        if (_teamWallet == address(0)) revert InvalidAddress();
        address oldWallet = teamWallet;
        teamWallet = _teamWallet;
        emit TeamWalletUpdated(oldWallet, _teamWallet);
    }

    /// @notice Emergency withdraw (only before TGE or if something goes wrong)
    function emergencyWithdraw(address to) external onlyOwner {
        if (to == address(0)) revert InvalidAddress();
        uint256 balance = foodToken.balanceOf(address(this));
        foodToken.safeTransfer(to, balance);
    }

    /// @notice Terminate vesting - return unvested tokens and prevent further claims
    /// @dev M-2 fix: Emergency termination capability for fraud or contract issues
    /// @param returnTo Address to return unvested tokens to
    function terminateVesting(address returnTo) external onlyOwner {
        if (terminated) revert AlreadyTerminated();
        if (returnTo == address(0)) revert InvalidAddress();

        terminated = true;

        // Return all remaining tokens (both vested unclaimed + unvested)
        uint256 balance = foodToken.balanceOf(address(this));
        if (balance > 0) {
            foodToken.safeTransfer(returnTo, balance);
        }

        emit VestingTerminated(balance);
    }

    // ============ View Functions ============

    /// @notice Get the amount of tokens currently claimable
    /// @return The amount of tokens that can be claimed
    function getClaimableAmount() public view returns (uint256) {
        if (!tgeStarted) return 0;

        uint256 monthsPassed = getMonthsPassed();

        // Cap at 5 months (TGE + 4 months of vesting)
        if (monthsPassed > VESTING_DURATION) {
            monthsPassed = VESTING_DURATION;
        }

        // Total unlocked = (monthsPassed + 1) * MONTHLY_RELEASE
        // +1 because TGE release counts as month 0
        uint256 totalUnlocked = (monthsPassed + 1) * MONTHLY_RELEASE;

        // Cap at total allocation
        if (totalUnlocked > TOTAL_ALLOCATION) {
            totalUnlocked = TOTAL_ALLOCATION;
        }

        // Claimable = unlocked - already claimed
        if (totalUnlocked <= totalClaimed) return 0;
        return totalUnlocked - totalClaimed;
    }

    /// @notice Get the number of complete months since TGE
    /// @return The number of months passed
    function getMonthsPassed() public view returns (uint256) {
        if (!tgeStarted) return 0;
        return (block.timestamp - tgeTimestamp) / MONTH;
    }

    /// @notice Get the total amount unlocked so far
    /// @return The total unlocked amount
    function getTotalUnlocked() public view returns (uint256) {
        if (!tgeStarted) return 0;

        uint256 monthsPassed = getMonthsPassed();
        if (monthsPassed > VESTING_DURATION) {
            monthsPassed = VESTING_DURATION;
        }

        uint256 totalUnlocked = (monthsPassed + 1) * MONTHLY_RELEASE;
        if (totalUnlocked > TOTAL_ALLOCATION) {
            totalUnlocked = TOTAL_ALLOCATION;
        }

        return totalUnlocked;
    }

    /// @notice Get the remaining locked tokens
    /// @return The amount of tokens still locked
    function getRemainingLocked() public view returns (uint256) {
        return TOTAL_ALLOCATION - getTotalUnlocked();
    }

    /// @notice Get vesting schedule info
    /// @return _tgeStarted Whether TGE has started
    /// @return _tgeTimestamp The TGE timestamp
    /// @return _monthsPassed Months since TGE
    /// @return _totalUnlocked Total tokens unlocked
    /// @return _totalClaimed Total tokens claimed
    /// @return _claimable Currently claimable amount
    function getVestingInfo() external view returns (
        bool _tgeStarted,
        uint256 _tgeTimestamp,
        uint256 _monthsPassed,
        uint256 _totalUnlocked,
        uint256 _totalClaimed,
        uint256 _claimable
    ) {
        return (
            tgeStarted,
            tgeTimestamp,
            getMonthsPassed(),
            getTotalUnlocked(),
            totalClaimed,
            getClaimableAmount()
        );
    }

    /// @notice Get token balance held by this contract
    function tokenBalance() external view returns (uint256) {
        return foodToken.balanceOf(address(this));
    }
}
