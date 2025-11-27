// SPDX-License-Identifier: MIT

pragma solidity ^0.8.30;

import {Create2} from "@openzeppelin/contracts/utils/Create2.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

interface IERC6551Registry {
    event AccountCreated(
        address account,
        address implementation,
        uint256 chainId,
        address tokenContract,
        uint256 tokenId,
        bytes32 seed
    );

    function createAccount(
        address implementation,
        uint256 chainId,
        address tokenContract,
        uint256 tokenId,
        bytes32 seed,
        bytes calldata initData
    ) external returns (address);

    function account(
        address implementation,
        uint256 chainId,
        address tokenContract,
        uint256 tokenId,
        bytes32 seed
    ) external view returns (address);

    function setImplementation(address implementation) external;
}

/// @title ERC-6551 Registry (minimal proxy)
contract ERC6551Registry is IERC6551Registry, ReentrancyGuard, Ownable {
    error InitializationFailed();
    error ImplementationNotSet();
    address private _implementation;

    mapping(bytes32 => address) private _accounts;

    constructor() {}

    function createAccount(
        address implementation,
        uint256 chainId,
        address tokenContract,
        uint256 tokenId,
        bytes32 seed,
        bytes calldata initData
    ) external override nonReentrant returns (address) {
        address impl = _implementation == address(0) ? implementation : _implementation;
        if (impl == address(0)) revert ImplementationNotSet();

        bytes32 accountSalt = keccak256(abi.encode(impl, chainId, tokenContract, tokenId, seed));

        address newAccount = _accounts[accountSalt];
        if (newAccount != address(0)) {
            return newAccount;
        }

        bytes memory bytecode = _creationCode(impl, seed, chainId, tokenContract, tokenId);

        newAccount = Create2.deploy(0, accountSalt, bytecode);
        _accounts[accountSalt] = newAccount;

        if (initData.length != 0) {
            (bool success, ) = newAccount.call(initData);
            if (!success) revert InitializationFailed();
        }

        emit AccountCreated(
            newAccount,
            impl,
            chainId,
            tokenContract,
            tokenId,
            seed
        );

        return newAccount;
    }

    function account(
        address implementation,
        uint256 chainId,
        address tokenContract,
        uint256 tokenId,
        bytes32 seed
    ) external view override returns (address) {
        bytes32 accountSalt = keccak256(abi.encode(implementation, chainId, tokenContract, tokenId, seed));
        return _accounts[accountSalt];
    }

    function setImplementation(address implementation) external onlyOwner {
        require(implementation != address(0), "implementation zero");
        _implementation = implementation;
    }

    function getImplementation() external view returns (address) {
        return _implementation;
    }

    function _creationCode(
        address implementation_,
        bytes32 salt_,
        uint256 chainId_,
        address tokenContract_,
        uint256 tokenId_
    ) internal pure returns (bytes memory) {
        // Per ERC-6551 spec, runtime bytecode is 173 bytes:
        // - 10 bytes proxy prefix
        // - 20 bytes implementation address
        // - 15 bytes proxy suffix
        // - 32 bytes salt
        // - 32 bytes chainId
        // - 32 bytes tokenContract
        // - 32 bytes tokenId
        // Total: 10 + 20 + 15 + 32 + 32 + 32 + 32 = 173 bytes
        //
        // The init code (first 10 bytes) returns 0xAD (173) bytes of runtime code
        return
            abi.encodePacked(
                hex"3d60ad80600a3d3981f3363d3d373d3d3d363d73",
                implementation_,
                hex"5af43d82803e903d91602b57fd5bf3",
                abi.encode(salt_, chainId_, tokenContract_, tokenId_)
            );
    }
}
