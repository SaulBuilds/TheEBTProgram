// SPDX-License-Identifier: MIT

pragma solidity ^0.8.30;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {ERC2981} from "@openzeppelin/contracts/token/common/ERC2981.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/security/Pausable.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ILiquidityVault} from "./interfaces/ILiquidityVault.sol";
import {IEBTApplication} from "./IEBTApplication.sol";
import {ERC6551Registry} from "./ERC6551Registry.sol";

/// @notice Interface for ERC6551Account lock management
interface IERC6551AccountLock {
    function lockAssets() external;
    function unlockAssets() external;
    function isLocked() external view returns (bool);
}

/// @title EBT Program ERC721 with ERC-6551 accounts, dynamic pricing, and new tokenomics
/// @notice NFT contract for EBT Cards with dynamic pricing (0.02-2 ETH), protocol-only claims, and reapplication
contract EBTProgram is ERC721URIStorage, ERC2981, Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ============ Errors ============
    error NotApproved();
    error Blacklisted();
    error AccountImplementationNotSet();
    error FundraisingAlreadyClosed();
    error FundraisingNotClosed();
    error PriceBelowMinimum();
    error PriceAboveMaximum();
    error InvalidPricePrecision();
    error AlreadyMinted();
    error HardCapReached();
    error NotOwnerOrApproved();
    error ClaimTooSoon();
    error ClaimLimitReached();
    error OnlyProtocol();
    error InvalidScore();
    error ReapplicationNotPending();
    error ReapplicationNotApproved();
    error MustCompleteAllClaims();
    error AlreadyClaimedTGE();
    error InvalidMerkleProof();
    error ETHAlreadyDistributed();
    error SoftCapNotReached();
    error InvalidAddress();
    error NotInitialized();
    error AlreadyInitialized();
    error TBAStillApproved();
    error TBANotLocked();
    error TokenNotMinted();
    error NoContributionToRefund();
    error AlreadyRefunded();
    error SoftCapReached();

    // ============ Enums ============
    enum ReapplicationStatus { NONE, PENDING, APPROVED, REJECTED }

    // ============ Structs ============
    struct TokenData {
        uint256 mintPrice;
        uint256 claimCount;
        uint256 lastClaimTime;
        uint256 reapplicationBaseAmount;
        ReapplicationStatus reapplicationStatus;
        bool tgeClaimed;
    }

    // ============ Constants ============
    uint256 public constant MIN_PRICE = 0.02 ether;
    uint256 public constant MAX_PRICE = 2 ether;
    uint256 public constant PRICE_PRECISION = 0.001 ether;
    uint256 public constant MAX_CLAIMS = 3;
    uint256 public constant CLAIM_INTERVAL = 30 days;
    uint256 public constant BASE_TOKENS_PER_MIN_PRICE = 20_000 * 1e18; // 20,000 tokens for 0.02 ETH

    // ETH distribution percentages (basis points, 10000 = 100%)
    uint256 public constant LIQUIDITY_PERCENT = 6500;  // 65%
    uint256 public constant MARKETING_PERCENT = 2000;  // 20%
    uint256 public constant TREASURY_PERCENT = 1000;   // 10%
    uint256 public constant TEAM_PERCENT = 500;        // 5%

    // ============ Immutables ============
    ERC6551Registry private immutable _registry;

    // ============ State Variables ============
    ILiquidityVault public liquidityVault;
    IERC20 public foodToken;  // $EBTC token for TGE airdrop distribution
    IEBTApplication private _ebtApplication;
    address private _accountImplementation;
    bytes private _initData;
    bool public implementationLocked = false;

    uint256 private _currentTokenId = 1;
    string public baseTokenURI = "";

    // Store the implementation used at mint time for each token
    mapping(uint256 => address) private _tokenImplementation;

    // Initialization state
    bool public initialized = false;

    // Fundraising parameters
    uint256 public softCap = 20 ether;
    uint256 public hardCap = 2000 ether;
    uint256 public totalRaised = 0;
    uint256 private _fundraisingPeriod = 30 days;
    uint256 public fundraisingStartTime;  // Set at initialization, not deployment
    bool public fundraisingClosed = false;
    bool public ethDistributed = false;

    // Distribution addresses
    address public treasuryWallet;
    address public marketingWallet;
    address public teamWallet;
    address public protocolCaller;  // Only this address can call claim()

    // TGE Airdrop
    bytes32 public tgeMerkleRoot;

    // Mappings
    mapping(uint256 => TokenData) public tokenData;
    mapping(uint256 => string) public tokenIdToUserID;
    mapping(uint256 => address) public tokenMinter;
    mapping(address => bool) private _blacklist;
    mapping(address => bool) public hasMinted;
    mapping(address => uint256) public contributions;
    mapping(address => bool) public hasRefunded;

    uint256 public lastMintBlock;

    // ============ Events ============
    event ContributionReceived(address indexed contributor, uint256 amount, uint256 tokenId);
    event FundraisingClosed(uint256 totalRaised, bool softCapReached);
    event ClaimProcessed(uint256 indexed tokenId, uint256 baseAmount, uint256 bonus, uint256 total);
    event ReapplicationRequested(uint256 indexed tokenId, address indexed owner);
    event ReapplicationApproved(uint256 indexed tokenId, uint256 newBaseAmount);
    event ReapplicationRejected(uint256 indexed tokenId);
    event TGEClaimed(uint256 indexed tokenId, uint256 amount);
    event ETHDistributed(uint256 liquidity, uint256 marketing, uint256 treasury, uint256 team);
    event ProtocolCallerUpdated(address indexed newCaller);
    event CapsUpdated(uint256 softCap, uint256 hardCap);
    event ContractInitialized(
        address indexed liquidityVault,
        address indexed protocolCaller,
        address treasury,
        address marketing,
        address team
    );
    event TBALocked(uint256 indexed tokenId, address indexed tba, address indexed approvedTo);
    event TBAUnlocked(uint256 indexed tokenId, address indexed tba);
    event RefundClaimed(address indexed contributor, uint256 amount);

    // ============ Constructor ============
    constructor(
        address registryAddress,
        address ebtApplicationAddress
    ) ERC721("The EBT Program", "SNAP") {
        _registry = ERC6551Registry(registryAddress);
        _ebtApplication = IEBTApplication(ebtApplicationAddress);
        // fundraisingStartTime is set in initialize() to prevent timing issues
    }

    // ============ Modifiers ============
    modifier whenInitialized() {
        if (!initialized) revert NotInitialized();
        _;
    }

    modifier duringFundraising() {
        require(!fundraisingClosed, "Fundraising closed");
        require(
            block.timestamp < fundraisingStartTime + _fundraisingPeriod,
            "Fundraising period ended"
        );
        _;
    }

    modifier afterFundraising() {
        require(
            fundraisingClosed || block.timestamp >= fundraisingStartTime + _fundraisingPeriod,
            "Fundraising still active"
        );
        _;
    }

    modifier onlyProtocol() {
        if (msg.sender != protocolCaller) revert OnlyProtocol();
        _;
    }

    modifier threeBlocksAfterLastMint() {
        require(block.number > lastMintBlock + 3, "Wait 3 blocks");
        _;
    }

    // ============ Initialization ============

    /// @notice Initialize the contract with all required addresses
    /// @dev Can only be called once. All addresses must be non-zero
    function initialize(
        address _liquidityVault,
        address _protocolCaller,
        address _treasury,
        address _marketing,
        address _team,
        address _accountImpl,
        address _foodToken
    ) external onlyOwner {
        if (initialized) revert AlreadyInitialized();
        if (_liquidityVault == address(0)) revert InvalidAddress();
        if (_protocolCaller == address(0)) revert InvalidAddress();
        if (_treasury == address(0)) revert InvalidAddress();
        if (_marketing == address(0)) revert InvalidAddress();
        if (_team == address(0)) revert InvalidAddress();
        if (_accountImpl == address(0)) revert InvalidAddress();
        if (_foodToken == address(0)) revert InvalidAddress();

        liquidityVault = ILiquidityVault(_liquidityVault);
        foodToken = IERC20(_foodToken);
        protocolCaller = _protocolCaller;
        treasuryWallet = _treasury;
        marketingWallet = _marketing;
        teamWallet = _team;
        _accountImplementation = _accountImpl;

        // Set implementation on registry
        _registry.setImplementation(_accountImpl);

        // Start fundraising at initialization time, not deployment time
        fundraisingStartTime = block.timestamp;

        initialized = true;

        emit ContractInitialized(
            _liquidityVault,
            _protocolCaller,
            _treasury,
            _marketing,
            _team
        );
    }

    /// @notice Check if all critical addresses are configured
    function isFullyConfigured() external view returns (bool) {
        return initialized &&
            address(liquidityVault) != address(0) &&
            address(foodToken) != address(0) &&
            protocolCaller != address(0) &&
            treasuryWallet != address(0) &&
            marketingWallet != address(0) &&
            teamWallet != address(0) &&
            _accountImplementation != address(0);
    }

    // ============ External Functions ============

    /// @notice Mint an EBT Card with dynamic pricing
    /// @param userID The user's unique identifier from the application
    function mint(string memory userID)
        external
        payable
        whenInitialized
        whenNotPaused
        duringFundraising
        threeBlocksAfterLastMint
        nonReentrant
    {
        // Validations
        if (_blacklist[msg.sender]) revert Blacklisted();
        if (!_ebtApplication.isUserApproved(userID)) revert NotApproved();
        // Verify the caller owns this userID (prevents Sybil attacks)
        string memory callerUserID = _ebtApplication.getUserIDByAddress(msg.sender);
        require(
            keccak256(bytes(callerUserID)) == keccak256(bytes(userID)),
            "UserID not owned by caller"
        );
        if (hasMinted[msg.sender]) revert AlreadyMinted();
        if (msg.value < MIN_PRICE) revert PriceBelowMinimum();
        if (msg.value > MAX_PRICE) revert PriceAboveMaximum();
        if (msg.value % PRICE_PRECISION != 0) revert InvalidPricePrecision();
        if (totalRaised + msg.value > hardCap) revert HardCapReached();

        uint256 newTokenId = _currentTokenId++;
        hasMinted[msg.sender] = true;
        lastMintBlock = block.number;

        // Store token data
        tokenData[newTokenId] = TokenData({
            mintPrice: msg.value,
            claimCount: 0,
            lastClaimTime: 0,
            reapplicationBaseAmount: 0,
            reapplicationStatus: ReapplicationStatus.NONE,
            tgeClaimed: false
        });

        tokenMinter[newTokenId] = msg.sender;
        tokenIdToUserID[newTokenId] = userID;
        contributions[msg.sender] += msg.value;
        totalRaised += msg.value;

        // Auto-close fundraising when hard cap is reached
        if (totalRaised >= hardCap && !fundraisingClosed) {
            fundraisingClosed = true;
            emit FundraisingClosed(totalRaised, true);
        }

        // Mint NFT
        _safeMint(msg.sender, newTokenId);

        // Set metadata URI
        string memory userMetadataURI = _ebtApplication.getMetadataURI(userID);
        if (bytes(userMetadataURI).length > 0) {
            _setTokenURI(newTokenId, userMetadataURI);
        } else {
            _setTokenURI(newTokenId, baseTokenURI);
        }

        // Create TBA and store the implementation used
        bytes32 salt = keccak256(abi.encodePacked(userID, newTokenId));
        _tokenImplementation[newTokenId] = _accountImplementation;
        address tba = _registry.createAccount(
            _accountImplementation,
            block.chainid,
            address(this),
            newTokenId,
            salt,
            _initData
        );

        // Lock implementation after first mint to prevent breaking existing TBAs
        if (!implementationLocked) {
            implementationLocked = true;
        }

        // Calculate and distribute initial tokens
        uint256 initialTokens = _calculateTokens(msg.value);
        liquidityVault.distributeAtMint(tba, initialTokens);

        emit ContributionReceived(msg.sender, msg.value, newTokenId);
    }

    /// @notice Protocol-only claim function with score multiplier
    /// @dev Score is now fetched from EBTApplication for security - prevents protocol caller manipulation
    /// @param tokenId The NFT token ID
    function claim(uint256 tokenId) external whenInitialized whenNotPaused onlyProtocol nonReentrant {
        require(_exists(tokenId), "Token does not exist");

        TokenData storage data = tokenData[tokenId];

        if (data.claimCount >= MAX_CLAIMS) revert ClaimLimitReached();
        if (data.lastClaimTime != 0 && block.timestamp < data.lastClaimTime + CLAIM_INTERVAL) {
            revert ClaimTooSoon();
        }

        // Fetch score from on-chain source for security (prevents protocol caller manipulation)
        string memory userID = tokenIdToUserID[tokenId];
        uint256 score = _ebtApplication.getUserScore(userID);

        // Validate score bounds (should already be validated at set time, but double-check)
        if (score > 1000) revert InvalidScore();

        // Determine base amount (use reapplication amount if set, otherwise calculate from mint price)
        uint256 baseAmount;
        if (data.reapplicationBaseAmount > 0) {
            baseAmount = data.reapplicationBaseAmount;
        } else {
            baseAmount = _calculateTokens(data.mintPrice);
        }

        // Calculate bonus: baseAmount * (score / 1000)
        uint256 bonus = (baseAmount * score) / 1000;
        uint256 totalAmount = baseAmount + bonus;

        // Update state
        data.claimCount++;
        data.lastClaimTime = block.timestamp;

        // Get TBA and distribute
        address tba = getTBA(tokenId);
        liquidityVault.distributeAtClaim(tba, totalAmount);

        // Update application contract
        _ebtApplication.incrementInstallmentCount(userID);

        emit ClaimProcessed(tokenId, baseAmount, bonus, totalAmount);
    }

    /// @notice Request reapplication after completing 3 claims
    /// @param tokenId The NFT token ID
    function reapply(uint256 tokenId) external {
        require(_exists(tokenId), "Token does not exist");
        require(ownerOf(tokenId) == msg.sender, "Not token owner");

        TokenData storage data = tokenData[tokenId];
        if (data.claimCount < MAX_CLAIMS) revert MustCompleteAllClaims();

        data.reapplicationStatus = ReapplicationStatus.PENDING;

        emit ReapplicationRequested(tokenId, msg.sender);
    }

    /// @notice Claim TGE airdrop tokens using merkle proof
    /// @dev TGE tokens are distributed from EBTProgram's 2B allocation (not from vault)
    /// @param tokenId The NFT token ID
    /// @param amount The airdrop amount
    /// @param merkleProof The merkle proof
    function claimTGEAirdrop(
        uint256 tokenId,
        uint256 amount,
        bytes32[] calldata merkleProof
    ) external whenNotPaused nonReentrant {
        require(_exists(tokenId), "Token does not exist");
        require(ownerOf(tokenId) == msg.sender, "Not token owner");

        TokenData storage data = tokenData[tokenId];
        if (data.tgeClaimed) revert AlreadyClaimedTGE();

        // Verify merkle proof
        address tba = getTBA(tokenId);
        bytes32 leaf = keccak256(abi.encodePacked(tokenId, tba, amount));
        if (!MerkleProof.verify(merkleProof, tgeMerkleRoot, leaf)) {
            revert InvalidMerkleProof();
        }

        data.tgeClaimed = true;

        // Transfer $EBTC tokens directly from EBTProgram's 2B allocation to the TBA
        foodToken.safeTransfer(tba, amount);

        emit TGEClaimed(tokenId, amount);
    }

    // ============ Admin Functions ============

    /// @notice Approve a reapplication with a new base amount
    /// @param tokenId The NFT token ID
    /// @param newBaseAmount The new base token amount for claims (can be less than original)
    function approveReapplication(uint256 tokenId, uint256 newBaseAmount) external onlyOwner {
        TokenData storage data = tokenData[tokenId];
        if (data.reapplicationStatus != ReapplicationStatus.PENDING) {
            revert ReapplicationNotPending();
        }

        data.claimCount = 0;
        data.lastClaimTime = 0;
        data.reapplicationBaseAmount = newBaseAmount;
        data.reapplicationStatus = ReapplicationStatus.APPROVED;

        emit ReapplicationApproved(tokenId, newBaseAmount);
    }

    /// @notice Reject a reapplication
    /// @param tokenId The NFT token ID
    function rejectReapplication(uint256 tokenId) external onlyOwner {
        TokenData storage data = tokenData[tokenId];
        if (data.reapplicationStatus != ReapplicationStatus.PENDING) {
            revert ReapplicationNotPending();
        }

        data.reapplicationStatus = ReapplicationStatus.REJECTED;

        emit ReapplicationRejected(tokenId);
    }

    /// @notice Close fundraising and check if soft cap was reached
    function closeFundraising() external onlyOwner afterFundraising {
        if (fundraisingClosed) revert FundraisingAlreadyClosed();

        fundraisingClosed = true;

        emit FundraisingClosed(totalRaised, totalRaised >= softCap);
    }

    /// @notice Distribute raised ETH to designated wallets
    function distributeETH() external onlyOwner nonReentrant {
        if (!fundraisingClosed) revert FundraisingNotClosed();
        if (ethDistributed) revert ETHAlreadyDistributed();
        if (totalRaised < softCap) revert SoftCapNotReached();
        if (treasuryWallet == address(0) || marketingWallet == address(0) ||
            teamWallet == address(0) || address(liquidityVault) == address(0)) {
            revert InvalidAddress();
        }

        ethDistributed = true;

        uint256 liquidityAmount = (totalRaised * LIQUIDITY_PERCENT) / 10000;
        uint256 marketingAmount = (totalRaised * MARKETING_PERCENT) / 10000;
        uint256 treasuryAmount = (totalRaised * TREASURY_PERCENT) / 10000;
        uint256 teamAmount = totalRaised - liquidityAmount - marketingAmount - treasuryAmount;

        // Transfer ETH - CEI pattern: state already updated above
        (bool success1,) = address(liquidityVault).call{value: liquidityAmount}("");
        require(success1, "Liquidity transfer failed");

        (bool success2,) = marketingWallet.call{value: marketingAmount}("");
        require(success2, "Marketing transfer failed");

        (bool success3,) = treasuryWallet.call{value: treasuryAmount}("");
        require(success3, "Treasury transfer failed");

        (bool success4,) = teamWallet.call{value: teamAmount}("");
        require(success4, "Team transfer failed");

        emit ETHDistributed(liquidityAmount, marketingAmount, treasuryAmount, teamAmount);
    }

    /// @notice Claim refund if soft cap was not reached
    /// @dev Only available after fundraising closes and if soft cap was NOT met
    function claimRefund() external nonReentrant {
        if (!fundraisingClosed) revert FundraisingNotClosed();
        if (totalRaised >= softCap) revert SoftCapReached();
        if (hasRefunded[msg.sender]) revert AlreadyRefunded();

        uint256 contribution = contributions[msg.sender];
        if (contribution == 0) revert NoContributionToRefund();

        // CEI pattern: update state before transfer
        hasRefunded[msg.sender] = true;
        contributions[msg.sender] = 0;

        (bool success,) = msg.sender.call{value: contribution}("");
        require(success, "Refund transfer failed");

        emit RefundClaimed(msg.sender, contribution);
    }

    /// @notice Set the protocol caller address (only this can call claim)
    function setProtocolCaller(address _protocolCaller) external onlyOwner {
        if (_protocolCaller == address(0)) revert InvalidAddress();
        protocolCaller = _protocolCaller;
        emit ProtocolCallerUpdated(_protocolCaller);
    }

    /// @notice Set the liquidity vault contract
    function setLiquidityVault(address _liquidityVault) external onlyOwner {
        if (_liquidityVault == address(0)) revert InvalidAddress();
        liquidityVault = ILiquidityVault(_liquidityVault);
    }

    /// @notice Set the $EBTC token address (emergency only)
    function setFoodToken(address _foodToken) external onlyOwner {
        if (_foodToken == address(0)) revert InvalidAddress();
        foodToken = IERC20(_foodToken);
    }

    /// @notice Set distribution wallet addresses
    function setDistributionWallets(
        address _treasury,
        address _marketing,
        address _team
    ) external onlyOwner {
        if (_treasury == address(0) || _marketing == address(0) || _team == address(0)) {
            revert InvalidAddress();
        }
        treasuryWallet = _treasury;
        marketingWallet = _marketing;
        teamWallet = _team;
    }

    /// @notice Set fundraising caps
    /// @dev Can only be changed before fundraising starts (before initialize)
    function setCaps(uint256 _softCap, uint256 _hardCap) external onlyOwner {
        require(fundraisingStartTime == 0, "Cannot change after fundraising started");
        require(_softCap > 0 && _hardCap >= _softCap, "Invalid caps");
        softCap = _softCap;
        hardCap = _hardCap;
        emit CapsUpdated(_softCap, _hardCap);
    }

    /// @notice Set TGE merkle root for airdrop
    function setTGEMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
        tgeMerkleRoot = _merkleRoot;
    }

    /// @notice Set the account implementation for TBAs
    /// @dev Can only be set before first mint (implementation locks after first mint)
    function setAccountImplementation(address accountImpl) external onlyOwner {
        require(!implementationLocked, "Implementation locked after first mint");
        require(accountImpl != address(0), "Invalid implementation");
        _accountImplementation = accountImpl;
        _registry.setImplementation(accountImpl);
    }

    /// @notice Set base token URI
    function setBaseTokenURI(string calldata newBaseURI) external onlyOwner {
        baseTokenURI = newBaseURI;
    }

    /// @notice Set EBT Application contract
    function setEBTApplication(address ebtApplicationAddress) external onlyOwner {
        if (ebtApplicationAddress == address(0)) revert InvalidAddress();
        _ebtApplication = IEBTApplication(ebtApplicationAddress);
    }

    /// @notice Set init data for TBA creation
    function setInitData(bytes calldata initData) external onlyOwner {
        _initData = initData;
    }

    /// @notice Set fundraising period duration
    /// @dev Can only be changed before fundraising starts (before initialize)
    function setFundraisingPeriod(uint256 period) external onlyOwner {
        require(fundraisingStartTime == 0, "Cannot change after fundraising started");
        _fundraisingPeriod = period;
    }

    /// @notice Set blacklist status for addresses
    function setBlacklistStatus(address[] calldata accounts, bool status) external onlyOwner {
        for (uint256 i = 0; i < accounts.length; ++i) {
            _blacklist[accounts[i]] = status;
        }
    }

    // ============ Emergency Functions ============

    /// @notice Pause the contract - stops minting, claiming, and TGE airdrops
    /// @dev Only owner can pause. Use in emergencies like security breaches
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Unpause the contract - resume normal operations
    /// @dev Only owner can unpause
    function unpause() external onlyOwner {
        _unpause();
    }

    /// @notice Emergency withdraw ETH from contract
    /// @dev Only for emergencies - use when distributeETH() fails partially
    /// @param to Recipient address
    /// @param amount Amount of ETH to withdraw
    function emergencyWithdrawETH(address payable to, uint256 amount) external onlyOwner {
        require(to != address(0), "Invalid recipient");
        require(amount <= address(this).balance, "Insufficient balance");
        (bool success,) = to.call{value: amount}("");
        require(success, "ETH transfer failed");
    }

    /// @notice Emergency withdraw ERC20 tokens from contract
    /// @dev Only for emergencies - recover stuck tokens
    /// @param token Token contract address
    /// @param to Recipient address
    /// @param amount Amount of tokens to withdraw
    function emergencyWithdrawTokens(address token, address to, uint256 amount) external onlyOwner {
        require(token != address(0), "Invalid token");
        require(to != address(0), "Invalid recipient");
        IERC20(token).transfer(to, amount);
    }

    // ============ View Functions ============

    /// @notice Get the TBA address for a token
    function getTBA(uint256 tokenId) public view returns (address) {
        // Use the implementation that was set at mint time for this token
        address impl = _tokenImplementation[tokenId];
        require(impl != address(0), "Token not minted");

        string memory userID = tokenIdToUserID[tokenId];
        bytes32 salt = keccak256(abi.encodePacked(userID, tokenId));
        return _registry.account(
            impl,
            block.chainid,
            address(this),
            tokenId,
            salt
        );
    }

    /// @notice Calculate tokens for a given ETH amount
    function calculateTokens(uint256 ethAmount) external pure returns (uint256) {
        return _calculateTokens(ethAmount);
    }

    /// @notice Check if an address is blacklisted
    function isBlacklisted(address account) external view returns (bool) {
        return _blacklist[account];
    }

    /// @notice Get current token ID counter
    function currentTokenId() external view returns (uint256) {
        return _currentTokenId;
    }

    /// @notice Check if token exists
    function exists(uint256 tokenId) external view returns (bool) {
        return _exists(tokenId);
    }

    /// @notice Get remaining TGE airdrop allocation
    /// @return The amount of $EBTC tokens available for TGE airdrops
    function tgeAllocationRemaining() external view returns (uint256) {
        if (address(foodToken) == address(0)) return 0;
        return foodToken.balanceOf(address(this));
    }

    // ============ TBA Locking (Marketplace Protection) ============

    /// @notice Override approve to auto-lock TBA when NFT is approved for transfer
    /// @dev This protects buyers from sellers draining TBA between listing and sale
    /// @param to Address to approve (marketplace) or address(0) to clear approval
    /// @param tokenId The token to approve
    function approve(address to, uint256 tokenId) public virtual override(ERC721, IERC721) {
        // Call parent implementation first
        super.approve(to, tokenId);

        // If approving (not clearing), lock the TBA
        if (to != address(0) && _exists(tokenId)) {
            address tba = getTBA(tokenId);
            if (tba.code.length > 0) {
                IERC6551AccountLock(tba).lockAssets();
                emit TBALocked(tokenId, tba, to);
            }
        }
    }

    /// @notice Override setApprovalForAll - DISABLED for security
    /// @dev setApprovalForAll is disabled because we cannot efficiently lock all TBAs.
    /// Use approve(tokenId) instead which properly locks the TBA before listing.
    function setApprovalForAll(address, bool) public virtual override(ERC721, IERC721) {
        revert("Use approve() instead - setApprovalForAll disabled for TBA security");
    }

    /// @notice Request to unlock TBA - only works if NFT has no active approvals
    /// @dev User must first remove all approvals before their TBA can be unlocked
    /// @param tokenId The token whose TBA to unlock
    function requestUnlock(uint256 tokenId) external {
        if (!_exists(tokenId)) revert TokenNotMinted();
        require(ownerOf(tokenId) == msg.sender, "Not token owner");

        // Check that there are no active approvals for this token
        address approved = getApproved(tokenId);
        if (approved != address(0)) revert TBAStillApproved();

        // Check that there are no operator approvals that could transfer this token
        // Note: We can't easily iterate all operators, so we check the most common case
        // If the owner has approved any operator, they must revoke before unlocking
        // This is a security trade-off: more protection at cost of some UX friction

        address tba = getTBA(tokenId);
        if (tba.code.length == 0) return; // No TBA deployed yet

        IERC6551AccountLock tbaAccount = IERC6551AccountLock(tba);
        if (!tbaAccount.isLocked()) revert TBANotLocked();

        tbaAccount.unlockAssets();
        emit TBAUnlocked(tokenId, tba);
    }

    /// @notice Check if a token's TBA is currently locked
    /// @param tokenId The token to check
    /// @return True if TBA is locked
    function isTBALocked(uint256 tokenId) external view returns (bool) {
        if (!_exists(tokenId)) return false;

        address tba = getTBA(tokenId);
        if (tba.code.length == 0) return false;

        return IERC6551AccountLock(tba).isLocked();
    }

    /// @notice Override _beforeTokenTransfer to handle TBA unlock on successful transfer
    /// @dev New owner receives unlocked TBA (fresh start)
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);

        // Skip on mint (from == address(0))
        if (from == address(0)) return;

        // On transfer, unlock the TBA for the new owner
        // This is safe because the transfer is atomic - if we reach here,
        // the transfer will succeed and new owner gets clean slate
        address tba = getTBA(tokenId);
        if (tba.code.length > 0) {
            IERC6551AccountLock tbaAccount = IERC6551AccountLock(tba);
            if (tbaAccount.isLocked()) {
                tbaAccount.unlockAssets();
                emit TBAUnlocked(tokenId, tba);
            }
        }
    }

    // ============ Internal Functions ============

    /// @notice Calculate token amount based on ETH price
    /// @dev Formula: (price / MIN_PRICE) * BASE_TOKENS = tokens
    function _calculateTokens(uint256 ethAmount) internal pure returns (uint256) {
        // (ethAmount / 0.02 ETH) * 20,000 tokens
        // = ethAmount * 20,000 / 0.02
        // = ethAmount * 1,000,000 (simplified)
        return (ethAmount * BASE_TOKENS_PER_MIN_PRICE) / MIN_PRICE;
    }

    function _exists(uint256 tokenId) internal view override returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC2981, ERC721URIStorage)
        returns (bool)
    {
        return
            ERC2981.supportsInterface(interfaceId) ||
            ERC721URIStorage.supportsInterface(interfaceId) ||
            super.supportsInterface(interfaceId);
    }

    // Allow contract to receive ETH
    receive() external payable {}
}
