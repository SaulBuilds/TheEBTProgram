// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {ERC2981} from "@openzeppelin/contracts/token/common/ERC2981.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {FoodStamps} from "./FoodStamps.sol";
import {IEBTApplication} from "./IEBTApplication.sol";
import {ERC6551Registry} from "./ERC6551Registry.sol";

/// @title EBT Program ERC721 with ERC-6551 accounts and fundraising mechanics
contract EBTProgram is ERC721URIStorage, ERC2981, Ownable, ReentrancyGuard {
    error NotApproved();
    error Blacklisted();
    error AccountImplementationNotSet();
    error FundraisingAlreadyClosed();
    error IncorrectPrice();
    error AlreadyMinted();
    error HardCapReached();
    error NotOwnerOrApproved();
    error InstallmentTooSoon();
    error InstallmentLimitReached();
    ERC6551Registry private immutable _registry;
    FoodStamps private immutable _foodStamps;
    uint256 private immutable _fundraisingStartTime;
    address private _accountImplementation;
    IEBTApplication private _ebtApplication;
    
   


    struct Royalty {
        address receiver;
        uint256 amount; // In basis points (1/10000)
    }


   
    bytes private _initData;

    uint256 private _currentTokenId = 0;
    string public baseTokenURI = "";
    
    

    uint256 private constant MINT_PRICE = 0.02 ether; // Constant mint price
    uint256 private constant INITIAL_FOODSTAMPS = 200_000 * 1e18;

    mapping(uint256 => uint256) public tokenMintingTime;
    mapping(uint256 => string) public tokenIdToUserID;
    mapping(uint256 => address) public tokenMinter;
    mapping(uint256 => bool) public tokenEverTransferred;
    mapping(uint256 => uint256) public lastInstallmentClaimed;
    mapping(uint256 => Royalty) internal royalties;
    mapping(uint256 => uint256) public tokenIdToPrice;
    mapping(uint256 => uint256) public installmentCount;


    mapping(address => uint256) private _contributions;
    uint256 private _totalFundsRaised = 0;
    uint256 private _hardCap = 30 ether; // Hard cap for funds raised
    uint256 private _softCap = 10 ether; // Soft cap for funds raised
    uint256 private _withdrawalPeriod = 1 weeks; // Duration of the fundraising period
    bool private _fundraisingClosed = false;
    bool private _softCapReached = false;
    address public multisig;
    address public deployerWallet;
    mapping(address => bool) private _blacklist;
    mapping(address => bool) public hasMinted; // Added to track if a user has minted a card
    uint256 public lastMintBlock; // To track last minted block
    address[] private _contributors;

    event ContributionReceived(address indexed contributor, uint256 amount);
    event FundraisingClosed(uint256 totalRaised, bool softCapReached);
    event RefundIssued(address indexed contributor, uint256 amount);
    event FundsWithdrawn(address indexed to, uint256 amount);
    event CapsUpdated(uint256 softCap, uint256 hardCap);

   

    constructor(
        address registryAddress,
        address foodStampsAddress,
        address ebtApplicationAddress
    ) ERC721("EBT Card", "EBTC") {
        _registry = ERC6551Registry(registryAddress);
        _foodStamps = FoodStamps(foodStampsAddress);
        _ebtApplication = IEBTApplication(ebtApplicationAddress); 
        _fundraisingStartTime = block.timestamp;
    }
    
    modifier duringFundraisingPeriod() {
        require(
            _fundraisingStartTime > 0 &&
                block.timestamp >= _fundraisingStartTime &&
                block.timestamp < _fundraisingStartTime + _withdrawalPeriod,
            "Not during the fundraising period"
        );
        _;
    }

    modifier afterFundraisingPeriod() {
        require(
            block.timestamp >= _fundraisingStartTime + _withdrawalPeriod,
            "Fundraising period has not ended"
        );
        _;
    }

    modifier threeBlocksAfterLastMint() {
        require(
            block.number > lastMintBlock + 3,
            "Need to wait for 3 blocks before next mint"
        );
        _;
    }

    modifier onlyApproved(string memory userID) {
        if (!_ebtApplication.isUserApproved(userID)) revert NotApproved();
        _;
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override (ERC2981, ERC721URIStorage) returns (bool) {
        return
            ERC2981.supportsInterface(interfaceId) ||
            ERC721URIStorage.supportsInterface(interfaceId) ||
            super.supportsInterface(interfaceId);
    }

    function setInitData(bytes calldata initData) external onlyOwner {
        _initData = initData;
    }

    function setPayoutAddresses(address multisigAddress, address deployer) external onlyOwner {
        require(multisigAddress != address(0) && deployer != address(0), "Invalid payout");
        multisig = multisigAddress;
        deployerWallet = deployer;
    }

    function setCaps(uint256 softCap_, uint256 hardCap_) external onlyOwner {
        require(softCap_ > 0 && hardCap_ >= softCap_, "Caps invalid");
        _softCap = softCap_;
        _hardCap = hardCap_;
        emit CapsUpdated(softCap_, hardCap_);
    }

    function setBaseTokenURI(string calldata newBaseURI) external onlyOwner {
        baseTokenURI = newBaseURI;
    }

    function setAccountImplementation(address accountImpl) external onlyOwner {
        require(accountImpl != address(0), "Invalid account implementation");
        _accountImplementation = accountImpl;
        _registry.setImplementation(accountImpl);
    }

    /// @notice Set internal account implementation reference without updating registry
    /// @dev Use when registry implementation is set separately (e.g., before ownership transfer)
    function setAccountImplementationInternal(address accountImpl) external onlyOwner {
        require(accountImpl != address(0), "Invalid account implementation");
        _accountImplementation = accountImpl;
    }

    function mint(string memory userID)
        external
        payable
        duringFundraisingPeriod
        onlyApproved(userID)
        threeBlocksAfterLastMint 
        nonReentrant
    {
        if (_blacklist[msg.sender]) revert Blacklisted();
        if (_accountImplementation == address(0)) revert AccountImplementationNotSet();
        if (_fundraisingClosed) revert FundraisingAlreadyClosed();
        if (msg.value != MINT_PRICE) revert IncorrectPrice();
        if (hasMinted[msg.sender]) revert AlreadyMinted();
        if (_totalFundsRaised + MINT_PRICE > _hardCap) revert HardCapReached();
        uint256 newTokenId = _currentTokenId;
        _currentTokenId = newTokenId + 1;
        hasMinted[msg.sender] = true;

        tokenIdToPrice[newTokenId] = msg.value;
        tokenMinter[newTokenId] = msg.sender;
        tokenIdToUserID[newTokenId] = userID;
        tokenMintingTime[newTokenId] = block.timestamp;
        _contributions[msg.sender] += MINT_PRICE;
        _totalFundsRaised += MINT_PRICE;
        _contributors.push(msg.sender);
        lastMintBlock = block.number;

        bytes32 salt = keccak256(abi.encodePacked(userID));

        _safeMint(msg.sender, newTokenId);

        // Use user-specific metadata URI if available, otherwise fallback to base URI
        string memory userMetadataURI = _ebtApplication.getMetadataURI(userID);
        if (bytes(userMetadataURI).length > 0) {
            _setTokenURI(newTokenId, userMetadataURI);
        } else {
            _setTokenURI(newTokenId, baseTokenURI);
        }

        address account = _registry.createAccount(
            _accountImplementation,
            block.chainid,
            address(this),
            newTokenId,
            salt,
            _initData
        );

        // Add a bonus if the user is a head of household
        uint256 amount = INITIAL_FOODSTAMPS;
        _foodStamps.mint(account, amount);

        emit ContributionReceived(msg.sender, MINT_PRICE);
    }


    function withdraw() external afterFundraisingPeriod nonReentrant {
        require(_fundraisingClosed, "Fundraising period is still open");
        require(!_softCapReached, "Soft cap met; no refunds");
        require(_contributions[msg.sender] > 0, "No contributions to withdraw");

        uint256 contributionAmount = _contributions[msg.sender];
        _contributions[msg.sender] = 0;

        _totalFundsRaised -= contributionAmount;
        payable(msg.sender).transfer(contributionAmount);
        emit RefundIssued(msg.sender, contributionAmount);
    }

    function closeFundraisingPeriod() external onlyOwner afterFundraisingPeriod nonReentrant {
        require(
            !_fundraisingClosed,
            "Fundraising period is already closed"
        );
        require(multisig != address(0) && deployerWallet != address(0), "Payouts not set");
        _fundraisingClosed = true;
        _softCapReached = _totalFundsRaised >= _softCap;

        if (_softCapReached) {
            uint256 multiSigAllocation = (_totalFundsRaised * 90) / 100;
            uint256 deployerWalletAllocation = _totalFundsRaised - multiSigAllocation;

            payable(multisig).transfer(multiSigAllocation);
            emit FundsWithdrawn(multisig, multiSigAllocation);
            payable(deployerWallet).transfer(deployerWalletAllocation);
            emit FundsWithdrawn(deployerWallet, deployerWalletAllocation);
        }

        emit FundraisingClosed(_totalFundsRaised, _softCapReached);
    }

    function setBlacklistStatus(address[] calldata accounts, bool status)
        external
        onlyOwner
    {
        require(accounts.length > 0, "No accounts provided");

        for (uint256 i = 0; i < accounts.length; ++i) {
            _blacklist[accounts[i]] = status;
        }
    }

    function isBlacklisted(address account) public view returns (bool) {
        return _blacklist[account];
    }

    function setRoyalty(
        uint256 royaltyTokenId,
        address receiver,
        uint256 amount
    ) external {
        require(_exists(royaltyTokenId), "Token does not exist");
        require(
            amount <= 10000,
            "Royalty amount must be <= 10000 (100%)"
        );
        require(
            msg.sender == ownerOf(royaltyTokenId),
            "Only the owner can set the royalty"
        );

        royalties[royaltyTokenId] = Royalty(receiver, amount);
    }

    function claimInstallment(uint256 tokenId) external {

        require(_exists(tokenId), "Token does not exist");
        if (!_isApprovedOrOwner(_msgSender(), tokenId)) revert NotOwnerOrApproved();
        if (installmentCount[tokenId] >= 3) revert InstallmentLimitReached();
        if (lastInstallmentClaimed[tokenId] + 30 days > block.timestamp) revert InstallmentTooSoon();

        // Get the price paid for the token
        uint256 tokenPrice = tokenIdToPrice[tokenId];

        // Calculate the installment amount based on the token price
        uint256 installmentAmount = 200_000 * tokenPrice; // scale with wei price (0.02 ETH -> 4000 EBT assuming 18 decimals)

        // Update the last claimed timestamp
        lastInstallmentClaimed[tokenId] = block.timestamp;

        // Increment installment count
        string memory userID = tokenIdToUserID[tokenId];
        installmentCount[tokenId] = installmentCount[tokenId] + 1;

        // Call the incrementInstallmentCount function of the EBTApplication contract
        _ebtApplication.incrementInstallmentCount(userID);

        _foodStamps.mint(ownerOf(tokenId), installmentAmount);
    }

    function setWithdrawalPeriod(uint256 withdrawalPeriod) external onlyOwner {
        _withdrawalPeriod = withdrawalPeriod;
    }

    function currentTokenId() public view returns (uint256) {
        return _currentTokenId;
    }

    function totalFundsRaised() external view returns (uint256) {
        return _totalFundsRaised;
    }

    function hardCap() external view returns (uint256) {
        return _hardCap;
    }

    function softCap() external view returns (uint256) {
        return _softCap;
    }

    function _transfer(address from, address to, uint256 tokenId)
        internal
        override
    {
        super._transfer(from, to, tokenId);

        if (from != address(0)) {
            tokenEverTransferred[tokenId] = true;
        }
    }
    function setEBTApplication(address ebtApplicationAddress) external onlyOwner {
        _ebtApplication = IEBTApplication(ebtApplicationAddress);
        _ebtApplication.setProgramAsOwner(address(this));
    }

}
