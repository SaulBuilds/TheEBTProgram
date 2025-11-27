//SPDX-License-Identifier: MIT

pragma solidity ^0.8.30;

interface IEBTApplication {
    struct EBTApplicant {
        string username;
        string profilePicURL;
        string twitter;
        uint256 foodBudget;
        string userID;
        bool hasApplied;
        bool isApproved;
        uint256 installmentCount;
        uint256 score;
        string metadataURI;
    }

    function isUserApproved(string calldata userID) external view returns (bool);
    function getUserDetails(string calldata userID) external view returns (EBTApplicant memory);
    function incrementInstallmentCount(string calldata userID) external;
    function setProgramAsOwner(address programAddress) external;
    function getMetadataURI(string calldata userID) external view returns (string memory);
    function getUserScore(string calldata userID) external view returns (uint256);
    function getUserIDByAddress(address _address) external view returns (string memory);
}
