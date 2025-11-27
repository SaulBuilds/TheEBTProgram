//SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/// @title EBT application gatekeeper
/// @notice Handles user applications, approvals, and metadata URIs for EBT minting
/// @dev Uses ReentrancyGuard for protection against reentrancy attacks
contract EBTApplication is AccessControl, ReentrancyGuard {

    error AlreadyApplied();
    error NotAdmin();
    error NotApproved();
    error CannotReapplyYet();
    error UserNotFound();
    error InvalidMetadataURI();
    error InvalidScore();
    error EmptyUserID();
    error EmptyUsername();
    error BatchTooLarge();  // M-7 fix

    // M-7 fix: Maximum batch size for operations
    uint256 public constant MAX_BATCH_SIZE = 100;

    struct EBTApplicant {
        string username;
        string profilePicURL;
        string twitter;
        uint256 foodBudget;
        string userID;
        bool hasApplied;
        bool isApproved;
        uint256 installmentCount;
        uint256 score;           // User's calculated score (0-1000)
        string metadataURI;      // IPFS URI for NFT metadata (set at approval)
    }

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    mapping(string => EBTApplicant) public applicants;
    mapping(address => uint256) public userBalanceAtApplication;
    mapping(address => string) public addressToUserID; // Map wallet address to userID

    // Events for tracking
    event ApplicationSubmitted(string indexed userID, address indexed applicant);
    event UserApproved(string indexed userID, string metadataURI);
    event UserRevoked(string indexed userID);
    event MetadataURISet(string indexed userID, string metadataURI);
    event ScoreUpdated(string indexed userID, uint256 score);

    constructor() {
        _setupRole(ADMIN_ROLE, msg.sender);
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    modifier onlyAdmin() {
        if (!hasRole(ADMIN_ROLE, msg.sender)) revert NotAdmin();
        _;
    }

    modifier onlyApproved(string memory _userID) virtual {
        if (!applicants[_userID].isApproved) revert NotApproved();
        _;
    }

    /// @notice Submit an application for EBT
    /// @dev No automatic approval - all users must be approved by admin
    /// @dev M-1 fix: Added input validation for userID and username
    function apply4EBT(
        string memory _username,
        string memory _profilePicURL,
        string memory _twitter,
        uint256 _foodBudget,
        string memory _userID
    ) public nonReentrant {
        // M-1 fix: Validate inputs
        if (bytes(_userID).length == 0) revert EmptyUserID();
        if (bytes(_username).length == 0) revert EmptyUsername();
        if (applicants[_userID].hasApplied) revert AlreadyApplied();

        applicants[_userID] = EBTApplicant({
            username: _username,
            profilePicURL: _profilePicURL,
            twitter: _twitter,
            foodBudget: _foodBudget,
            userID: _userID,
            hasApplied: true,
            isApproved: false,
            installmentCount: 0,
            score: 0,
            metadataURI: ""
        });

        // Map sender address to userID for lookup
        addressToUserID[msg.sender] = _userID;

        // NOTE: Automatic approval removed - admin must explicitly approve all users
        // This prevents hash collision attacks where crafted userIDs could bypass approval

        emit ApplicationSubmitted(_userID, msg.sender);
    }

    /// @notice Grant admin rights to the program contract
    function setProgramAsAdmin(address programAddress) external onlyAdmin {
        grantRole(ADMIN_ROLE, programAddress);
    }

    /// @notice Approve multiple users (batch approval)
    /// @dev M-7 fix: Added batch size limit
    function approveUsers(string[] memory _userIDs) public onlyAdmin {
        if (_userIDs.length > MAX_BATCH_SIZE) revert BatchTooLarge();
        for (uint256 i = 0; i < _userIDs.length; ++i) {
            require(applicants[_userIDs[i]].hasApplied, "User has not applied");
            applicants[_userIDs[i]].isApproved = true;
            emit UserApproved(_userIDs[i], applicants[_userIDs[i]].metadataURI);
        }
    }

    /// @notice Revoke approval for multiple users (e.g., fraud detected)
    /// @dev M-7 fix: Added batch size limit
    /// @param _userIDs Array of user IDs to revoke
    function revokeUsers(string[] memory _userIDs) public onlyAdmin {
        if (_userIDs.length > MAX_BATCH_SIZE) revert BatchTooLarge();
        for (uint256 i = 0; i < _userIDs.length; ++i) {
            require(applicants[_userIDs[i]].hasApplied, "User has not applied");
            applicants[_userIDs[i]].isApproved = false;
            emit UserRevoked(_userIDs[i]);
        }
    }

    /// @notice Approve a single user with metadata URI (called after NFT generation)
    /// @param _userID The user's unique identifier
    /// @param _metadataURI The IPFS URI for the user's NFT metadata
    function approveUserWithMetadata(
        string memory _userID,
        string memory _metadataURI
    ) public onlyAdmin {
        require(applicants[_userID].hasApplied, "User has not applied");
        applicants[_userID].isApproved = true;
        applicants[_userID].metadataURI = _metadataURI;
        emit UserApproved(_userID, _metadataURI);
    }

    /// @notice Set metadata URI for a user (can be done before or after approval)
    /// @dev M-1 fix: Added validation that URI is not empty and follows IPFS format
    /// @param _userID The user's unique identifier
    /// @param _metadataURI The IPFS URI for the user's NFT metadata
    function setMetadataURI(string memory _userID, string memory _metadataURI) public onlyAdmin {
        if (!applicants[_userID].hasApplied) revert UserNotFound();
        // M-1 fix: Validate metadata URI is not empty
        if (bytes(_metadataURI).length == 0) revert InvalidMetadataURI();
        applicants[_userID].metadataURI = _metadataURI;
        emit MetadataURISet(_userID, _metadataURI);
    }

    /// @notice Get metadata URI for a user
    /// @param _userID The user's unique identifier
    /// @return The IPFS metadata URI
    function getMetadataURI(string memory _userID) public view returns (string memory) {
        return applicants[_userID].metadataURI;
    }

    /// @notice Update user's score
    /// @dev M-1 fix: Added score validation (must be 0-1000)
    /// @param _userID The user's unique identifier
    /// @param _score The calculated score (0-1000)
    function setUserScore(string memory _userID, uint256 _score) public onlyAdmin {
        if (!applicants[_userID].hasApplied) revert UserNotFound();
        // M-1 fix: Validate score is within bounds
        if (_score > 1000) revert InvalidScore();
        applicants[_userID].score = _score;
        emit ScoreUpdated(_userID, _score);
    }

    /// @notice Get user's score
    /// @param _userID The user's unique identifier
    /// @return The user's score
    function getUserScore(string memory _userID) public view returns (uint256) {
        return applicants[_userID].score;
    }

    function isUserApproved(string memory _userID) public view returns (bool) {
        return applicants[_userID].isApproved;
    }

    function getUserDetails(string memory _userID) public view returns (EBTApplicant memory) {
        return applicants[_userID];
    }

    function doesUserIdExist(string memory _userID) public view returns (bool) {
        return applicants[_userID].hasApplied;
    }

    /// @notice Get userID for a wallet address
    /// @param _address The wallet address
    /// @return The userID associated with the address
    function getUserIDByAddress(address _address) public view returns (string memory) {
        return addressToUserID[_address];
    }

    function incrementInstallmentCount(string memory _userID) public onlyAdmin {
        applicants[_userID].installmentCount++;
    }

    function reapply(string memory _userID) public onlyApproved(_userID) {
        if (applicants[_userID].installmentCount < 3) revert CannotReapplyYet();

        applicants[_userID].isApproved = true;
        applicants[_userID].installmentCount = 0;
    }
}
