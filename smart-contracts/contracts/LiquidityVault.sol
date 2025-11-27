// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/security/Pausable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ILiquidityVault} from "./interfaces/ILiquidityVault.sol";
import {MarketingVesting} from "./MarketingVesting.sol";

/// @title LiquidityVault
/// @notice Holds 65% of FOOD tokens (13B) and manages distributions for mints, claims, liquidity, and marketing vesting
/// @dev Receives ETH from fundraising for LP creation and buybacks. Also acts as factory for marketing vesting contracts.
contract LiquidityVault is ILiquidityVault, Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ============ Errors ============
    error OnlyEBTProgram();
    error InsufficientTokens();
    error InvalidAddress();
    error NoETHToProcess();
    error TooSoonForMonthlyOp();
    error SwapRouterNotSet();
    error VestingNotFound();
    error InvalidDuration();
    error ZeroAmount();

    // ============ Constants ============
    uint256 public constant DEFAULT_VESTING_DURATION = 90 days; // 3 months default

    // ============ State Variables ============
    IERC20 public immutable foodToken;
    address public ebtProgram;

    // Uniswap V3 integration
    address public swapRouter;
    address public weth;
    address public usdc;
    address public usdt;

    // Tracking
    uint256 public totalDistributed;
    uint256 public totalBoughtBack;
    uint256 public lastMonthlyOperation;

    // Pool addresses (set after pool creation)
    address public foodEthPool;
    address public foodUsdcPool;
    address public foodUsdtPool;

    // ============ Marketing Vesting Factory ============
    MarketingVesting[] public marketingVestingContracts;
    mapping(address => MarketingVesting[]) public beneficiaryVestings;
    uint256 public totalMarketingAllocated;

    // ============ Events ============
    event TokensDistributed(address indexed to, uint256 amount, string distributionType);
    event ETHReceived(address indexed from, uint256 amount);
    event MonthlyOperationExecuted(uint256 ethUsed, uint256 tokensBought);
    event LiquidityAdded(address indexed pool, uint256 tokenAmount, uint256 ethAmount);
    event SwapExecuted(address indexed tokenOut, uint256 amountIn, uint256 amountOut);
    event EBTProgramUpdated(address indexed newProgram);
    event SwapRouterUpdated(address indexed newRouter);

    // Marketing Vesting Events
    event MarketingVestingCreated(
        address indexed vestingContract,
        address indexed beneficiary,
        uint256 totalAllocation,
        uint256 vestingDuration,
        string partnerName,
        string partnershipType
    );
    event MarketingVestingRevoked(address indexed vestingContract, uint256 returnedAmount);
    event MarketingTokensReclaimed(address indexed from, uint256 amount);

    // ============ Constructor ============
    constructor(address _foodToken) {
        if (_foodToken == address(0)) revert InvalidAddress();
        foodToken = IERC20(_foodToken);
    }

    // ============ Modifiers ============
    modifier onlyEBTProgram() {
        if (msg.sender != ebtProgram) revert OnlyEBTProgram();
        _;
    }

    // ============ External Functions ============

    /// @notice Distribute tokens when an NFT is minted
    /// @param tba The token-bound account to receive tokens
    /// @param amount The amount of tokens to distribute
    function distributeAtMint(address tba, uint256 amount) external override onlyEBTProgram {
        _distribute(tba, amount, "mint");
    }

    /// @notice Distribute tokens at claim time
    /// @param tba The token-bound account to receive tokens
    /// @param amount The amount of tokens to distribute
    function distributeAtClaim(address tba, uint256 amount) external override onlyEBTProgram {
        _distribute(tba, amount, "claim");
    }

    /// @notice Distribute TGE airdrop tokens
    /// @param tba The token-bound account to receive tokens
    /// @param amount The amount of tokens to distribute
    function distributeTGE(address tba, uint256 amount) external override onlyEBTProgram {
        _distribute(tba, amount, "tge");
    }

    /// @notice Deposit ETH into the vault
    function depositETH() external payable override {
        emit ETHReceived(msg.sender, msg.value);
    }

    /// @notice Execute monthly buyback and liquidity operations
    /// @dev Can only be called once per 30 days, admin triggered
    function monthlyOperation() external override onlyOwner nonReentrant {
        if (block.timestamp < lastMonthlyOperation + 30 days) {
            revert TooSoonForMonthlyOp();
        }
        if (address(this).balance == 0) revert NoETHToProcess();

        lastMonthlyOperation = block.timestamp;

        uint256 currentEthBalance = address(this).balance;

        // For now, just emit event - actual swap logic will be added when SwapRouter is configured
        // The admin will need to set up the swap router and execute swaps manually or through this function

        emit MonthlyOperationExecuted(currentEthBalance, 0);
    }

    /// @notice Execute a token buyback using ETH
    /// @param ethAmount Amount of ETH to use for buyback
    /// @param minTokensOut Minimum tokens expected (slippage protection)
    function buybackTokens(uint256 ethAmount, uint256 minTokensOut) external onlyOwner nonReentrant {
        if (swapRouter == address(0)) revert SwapRouterNotSet();
        require(address(this).balance >= ethAmount, "Insufficient ETH");

        // Swap ETH for FOOD tokens via Uniswap V3
        // This is a placeholder - actual implementation depends on Uniswap V3 SwapRouter interface
        // The swapped tokens stay in the vault for future distributions

        // bytes memory path = abi.encodePacked(weth, uint24(3000), address(foodToken));
        // ISwapRouter.ExactInputParams memory params = ISwapRouter.ExactInputParams({
        //     path: path,
        //     recipient: address(this),
        //     deadline: block.timestamp + 300,
        //     amountIn: ethAmount,
        //     amountOutMinimum: minTokensOut
        // });
        // uint256 amountOut = ISwapRouter(swapRouter).exactInput{value: ethAmount}(params);

        // totalBoughtBack += amountOut;
        // emit SwapExecuted(address(foodToken), ethAmount, amountOut);
    }

    /// @notice Add liquidity to a pool
    /// @param pool The pool address
    /// @param tokenAmount Amount of FOOD tokens
    /// @param ethAmount Amount of ETH
    function addLiquidity(
        address pool,
        uint256 tokenAmount,
        uint256 ethAmount
    ) external onlyOwner nonReentrant {
        require(pool != address(0), "Invalid pool");
        require(address(this).balance >= ethAmount, "Insufficient ETH");
        require(foodToken.balanceOf(address(this)) >= tokenAmount, "Insufficient tokens");

        // Approve tokens for the pool/router
        // First reset to 0 to avoid safeApprove reverting on non-zero allowance
        foodToken.safeApprove(swapRouter, 0);
        foodToken.safeApprove(swapRouter, tokenAmount);

        // Actual liquidity addition logic depends on Uniswap V3 interface
        // This is a placeholder for the implementation

        emit LiquidityAdded(pool, tokenAmount, ethAmount);
    }

    // ============ Marketing Vesting Factory ============

    /// @notice Create a new marketing vesting contract for a partner
    /// @param beneficiary Address to receive vested tokens
    /// @param totalAllocation Total tokens to vest
    /// @param vestingDuration Duration of vesting in seconds (default 90 days if 0)
    /// @param revocable Whether the vesting can be revoked
    /// @param partnerName Name of the partner for transparency
    /// @param partnershipType Type: "KOL", "Ambassador", "Associate", etc.
    /// @return vestingContract Address of the created vesting contract
    function createMarketingVesting(
        address beneficiary,
        uint256 totalAllocation,
        uint256 vestingDuration,
        bool revocable,
        string calldata partnerName,
        string calldata partnershipType
    ) external onlyOwner nonReentrant returns (address vestingContract) {
        if (beneficiary == address(0)) revert InvalidAddress();
        if (totalAllocation == 0) revert ZeroAmount();
        if (foodToken.balanceOf(address(this)) < totalAllocation) revert InsufficientTokens();

        // Use default duration if not specified
        uint256 duration = vestingDuration > 0 ? vestingDuration : DEFAULT_VESTING_DURATION;

        // Deploy new vesting contract
        MarketingVesting vesting = new MarketingVesting(address(foodToken), address(this));

        // Transfer tokens to vesting contract
        foodToken.safeTransfer(address(vesting), totalAllocation);

        // Initialize the vesting
        vesting.initialize(
            beneficiary,
            totalAllocation,
            duration,
            revocable,
            partnerName,
            partnershipType
        );

        // Track the vesting contract
        marketingVestingContracts.push(vesting);
        beneficiaryVestings[beneficiary].push(vesting);
        totalMarketingAllocated += totalAllocation;

        emit MarketingVestingCreated(
            address(vesting),
            beneficiary,
            totalAllocation,
            duration,
            partnerName,
            partnershipType
        );

        return address(vesting);
    }

    /// @notice Create multiple marketing vesting contracts in batch
    /// @param beneficiaries Array of beneficiary addresses
    /// @param allocations Array of token allocations
    /// @param vestingDuration Duration of vesting (same for all)
    /// @param revocable Whether vestings can be revoked
    /// @param partnerNames Array of partner names
    /// @param partnershipTypes Array of partnership types
    function batchCreateMarketingVesting(
        address[] calldata beneficiaries,
        uint256[] calldata allocations,
        uint256 vestingDuration,
        bool revocable,
        string[] calldata partnerNames,
        string[] calldata partnershipTypes
    ) external onlyOwner nonReentrant {
        require(
            beneficiaries.length == allocations.length &&
            beneficiaries.length == partnerNames.length &&
            beneficiaries.length == partnershipTypes.length,
            "Array length mismatch"
        );

        uint256 totalRequired;
        for (uint256 i = 0; i < allocations.length; i++) {
            totalRequired += allocations[i];
        }
        if (foodToken.balanceOf(address(this)) < totalRequired) revert InsufficientTokens();

        uint256 duration = vestingDuration > 0 ? vestingDuration : DEFAULT_VESTING_DURATION;

        for (uint256 i = 0; i < beneficiaries.length; i++) {
            if (beneficiaries[i] == address(0)) revert InvalidAddress();
            if (allocations[i] == 0) revert ZeroAmount();

            MarketingVesting vesting = new MarketingVesting(address(foodToken), address(this));
            foodToken.safeTransfer(address(vesting), allocations[i]);

            vesting.initialize(
                beneficiaries[i],
                allocations[i],
                duration,
                revocable,
                partnerNames[i],
                partnershipTypes[i]
            );

            marketingVestingContracts.push(vesting);
            beneficiaryVestings[beneficiaries[i]].push(vesting);
            totalMarketingAllocated += allocations[i];

            emit MarketingVestingCreated(
                address(vesting),
                beneficiaries[i],
                allocations[i],
                duration,
                partnerNames[i],
                partnershipTypes[i]
            );
        }
    }

    /// @notice Revoke a marketing vesting contract
    /// @param vestingContract Address of the vesting contract to revoke
    function revokeMarketingVesting(address vestingContract) external onlyOwner nonReentrant {
        MarketingVesting vesting = MarketingVesting(vestingContract);

        uint256 balanceBefore = foodToken.balanceOf(address(this));
        vesting.revoke();
        uint256 returnedAmount = foodToken.balanceOf(address(this)) - balanceBefore;

        totalMarketingAllocated -= returnedAmount;

        emit MarketingVestingRevoked(vestingContract, returnedAmount);
    }

    // ============ Admin Functions ============

    /// @notice Set the EBT Program contract address
    function setEBTProgram(address _ebtProgram) external onlyOwner {
        if (_ebtProgram == address(0)) revert InvalidAddress();
        ebtProgram = _ebtProgram;
        emit EBTProgramUpdated(_ebtProgram);
    }

    /// @notice Set the Uniswap V3 swap router
    function setSwapRouter(address _swapRouter) external onlyOwner {
        if (_swapRouter == address(0)) revert InvalidAddress();
        swapRouter = _swapRouter;
        emit SwapRouterUpdated(_swapRouter);
    }

    /// @notice Set token addresses for swaps
    function setTokenAddresses(
        address _weth,
        address _usdc,
        address _usdt
    ) external onlyOwner {
        weth = _weth;
        usdc = _usdc;
        usdt = _usdt;
    }

    /// @notice Set pool addresses after creation
    function setPoolAddresses(
        address _foodEthPool,
        address _foodUsdcPool,
        address _foodUsdtPool
    ) external onlyOwner {
        foodEthPool = _foodEthPool;
        foodUsdcPool = _foodUsdcPool;
        foodUsdtPool = _foodUsdtPool;
    }

    /// @notice Emergency withdraw tokens (only owner)
    function emergencyWithdrawTokens(address to, uint256 amount) external onlyOwner {
        if (to == address(0)) revert InvalidAddress();
        foodToken.safeTransfer(to, amount);
    }

    /// @notice Emergency withdraw ETH (only owner)
    function emergencyWithdrawETH(address payable to, uint256 amount) external onlyOwner {
        if (to == address(0)) revert InvalidAddress();
        require(address(this).balance >= amount, "Insufficient ETH");
        (bool success,) = to.call{value: amount}("");
        require(success, "ETH transfer failed");
    }

    /// @notice Pause the vault - stops all distributions
    /// @dev Only owner can pause. Use in emergencies
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Unpause the vault - resume distributions
    /// @dev Only owner can unpause
    function unpause() external onlyOwner {
        _unpause();
    }

    // ============ View Functions ============

    /// @notice Get the total tokens available for distribution
    function availableTokens() external view override returns (uint256) {
        return foodToken.balanceOf(address(this));
    }

    /// @notice Get the ETH balance in the vault
    function ethBalance() external view override returns (uint256) {
        return address(this).balance;
    }

    /// @notice Get distribution statistics
    function getStats() external view returns (
        uint256 _totalDistributed,
        uint256 _totalBoughtBack,
        uint256 _availableTokens,
        uint256 _ethBalance
    ) {
        return (
            totalDistributed,
            totalBoughtBack,
            foodToken.balanceOf(address(this)),
            address(this).balance
        );
    }

    /// @notice Get total number of marketing vesting contracts
    function getMarketingVestingCount() external view returns (uint256) {
        return marketingVestingContracts.length;
    }

    /// @notice Get all marketing vesting contracts
    function getAllMarketingVestings() external view returns (MarketingVesting[] memory) {
        return marketingVestingContracts;
    }

    /// @notice Get vesting contracts for a specific beneficiary
    function getVestingsForBeneficiary(address beneficiary) external view returns (MarketingVesting[] memory) {
        return beneficiaryVestings[beneficiary];
    }

    /// @notice Get marketing vesting statistics
    function getMarketingStats() external view returns (
        uint256 totalContracts,
        uint256 totalAllocated,
        uint256 availableForMarketing
    ) {
        return (
            marketingVestingContracts.length,
            totalMarketingAllocated,
            foodToken.balanceOf(address(this))
        );
    }

    /// @notice Get detailed info for a specific vesting contract
    function getVestingInfo(address vestingContract) external view returns (MarketingVesting.VestingInfo memory) {
        return MarketingVesting(vestingContract).getVestingInfo();
    }

    // ============ Internal Functions ============

    /// @notice Internal distribution function
    function _distribute(address to, uint256 amount, string memory distributionType) internal whenNotPaused {
        if (to == address(0)) revert InvalidAddress();
        if (foodToken.balanceOf(address(this)) < amount) revert InsufficientTokens();

        foodToken.safeTransfer(to, amount);
        totalDistributed += amount;

        emit TokensDistributed(to, amount, distributionType);
    }

    // ============ Receive ETH ============
    receive() external payable {
        emit ETHReceived(msg.sender, msg.value);
    }
}
