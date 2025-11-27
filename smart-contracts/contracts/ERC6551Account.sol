// SPDX-License-Identifier: MIT

pragma solidity ^0.8.30;

import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {IERC1271} from "@openzeppelin/contracts/interfaces/IERC1271.sol";
import {SignatureChecker} from "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import {Bytecode} from "./Bytecode.sol";

/// @title ERC-6551 Token Bound Account with Listing Protection
/// @notice Token-bound account that locks all assets when NFT is listed for sale
/// @dev When _assetsLocked is true, NO assets can leave the TBA. This protects buyers
///      from sellers draining the TBA between listing and sale completion.
///
/// SECURITY MODEL:
/// 1. When NFT is approved for transfer (marketplace listing), assets auto-lock
/// 2. While locked, all outgoing transfers are blocked
/// 3. Unlock only possible when NFT has no active approvals
/// 4. On NFT transfer, new owner inherits the TBA with all assets intact
contract ERC6551Account is IERC165, IERC1271 {
    // ============ Events ============
    event TransactionExecuted(address indexed target, uint256 indexed value, bytes data);
    event AssetsLocked(address indexed locker);
    event AssetsUnlocked(address indexed unlocker);

    // ============ Errors ============
    error NotTokenOwner();
    error AssetsAreLocked();
    error AssetsNotLocked();
    error NFTStillApproved();
    error OnlyNFTContract();
    error ZeroAddress();

    // ============ State Variables ============
    uint256 private _nonce;

    /// @notice Global lock flag - when true, ALL outgoing transfers are blocked
    /// @dev This is intentionally a single boolean for all-or-nothing protection
    bool private _assetsLocked;

    // ============ Receive ETH ============
    receive() external payable {}

    // ============ Modifiers ============
    modifier onlyTokenOwner() {
        if (msg.sender != owner()) revert NotTokenOwner();
        _;
    }

    modifier whenNotLocked() {
        if (_assetsLocked) revert AssetsAreLocked();
        _;
    }

    modifier onlyNFTContract() {
        (, address tokenContract_,) = this.token();
        if (msg.sender != tokenContract_) revert OnlyNFTContract();
        _;
    }

    // ============ View Functions ============

    /// @notice Get the owner of this TBA (the NFT holder)
    function owner() public view returns (address) {
        (uint256 chainId_, address tokenContract_, uint256 tokenId_) = this.token();
        if (chainId_ != block.chainid) return address(0);
        return IERC721(tokenContract_).ownerOf(tokenId_);
    }

    /// @notice Check if assets are currently locked
    function isLocked() external view returns (bool) {
        return _assetsLocked;
    }

    /// @notice Get the nonce for signature replay protection
    function nonce() external view returns (uint256) {
        return _nonce;
    }

    /// @notice Get the token this account is bound to
    function token()
        external
        view
        returns (
            uint256 chainId_,
            address tokenContract_,
            uint256 tokenId_
        )
    {
        uint256 length = address(this).code.length;
        return
            abi.decode(
                Bytecode.codeAt(address(this), length - 0x60, length),
                (uint256, address, uint256)
            );
    }

    function supportsInterface(bytes4 interfaceId) public pure override returns (bool) {
        return
            (interfaceId == type(IERC165).interfaceId ||
                interfaceId == type(IERC1271).interfaceId);
    }

    function isValidSignature(bytes32 hash, bytes memory signature)
        external
        view
        returns (bytes4 magicValue)
    {
        bool isValid = SignatureChecker.isValidSignatureNow(owner(), hash, signature);

        if (isValid) {
            return IERC1271.isValidSignature.selector;
        }

        return "";
    }

    // ============ Lock Management (Called by NFT Contract) ============

    /// @notice Lock all assets - called by NFT contract when NFT is approved
    /// @dev Only the NFT contract can call this to ensure atomicity with approval
    function lockAssets() external onlyNFTContract {
        if (_assetsLocked) return; // Already locked, no-op

        _assetsLocked = true;
        emit AssetsLocked(msg.sender);
    }

    /// @notice Unlock assets - called by NFT contract when approval is removed
    /// @dev Only the NFT contract can call this after verifying no approvals exist
    function unlockAssets() external onlyNFTContract {
        if (!_assetsLocked) return; // Already unlocked, no-op

        _assetsLocked = false;
        emit AssetsUnlocked(msg.sender);
    }

    // ============ Execution Functions ============

    /// @notice Execute arbitrary call (only when unlocked)
    function executeCall(
        address to,
        uint256 value,
        bytes calldata data
    ) external payable onlyTokenOwner whenNotLocked returns (bytes memory result) {
        if (to == address(0)) revert ZeroAddress();

        _incrementNonce();

        bool success;
        (success, result) = to.call{value: value}(data);

        if (!success) {
            assembly {
                revert(add(result, 32), mload(result))
            }
        }
        emit TransactionExecuted(to, value, data);
    }

    // ============ Token Transfer Functions (All require unlocked state) ============

    /// @notice Transfer ERC20 tokens from this account
    function transferERC20(
        address tokenAddress,
        address to,
        uint256 amount
    ) external onlyTokenOwner whenNotLocked {
        if (tokenAddress == address(0) || to == address(0)) revert ZeroAddress();

        bool success = IERC20(tokenAddress).transfer(to, amount);
        require(success, "ERC20 transfer failed");
    }

    /// @notice Transfer ERC721 NFT from this account
    function transferERC721(
        address nftAddress,
        address to,
        uint256 tokenId_
    ) external onlyTokenOwner whenNotLocked {
        if (nftAddress == address(0) || to == address(0)) revert ZeroAddress();

        IERC721(nftAddress).safeTransferFrom(address(this), to, tokenId_);
    }

    /// @notice Transfer ERC1155 tokens from this account
    function transferERC1155(
        address tokenAddress,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) external onlyTokenOwner whenNotLocked {
        if (tokenAddress == address(0) || to == address(0)) revert ZeroAddress();

        IERC1155(tokenAddress).safeTransferFrom(address(this), to, id, amount, data);
    }

    /// @notice Batch transfer ERC1155 tokens from this account
    function transferERC1155Batch(
        address tokenAddress,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) external onlyTokenOwner whenNotLocked {
        if (tokenAddress == address(0) || to == address(0)) revert ZeroAddress();

        IERC1155(tokenAddress).safeBatchTransferFrom(address(this), to, ids, amounts, data);
    }

    // ============ Approval Functions (All require unlocked state) ============

    /// @notice Approve ERC20 spending (only when unlocked)
    function approveERC20(
        address tokenAddress,
        address spender,
        uint256 amount
    ) external onlyTokenOwner whenNotLocked {
        if (tokenAddress == address(0) || spender == address(0)) revert ZeroAddress();

        bool success = IERC20(tokenAddress).approve(spender, amount);
        require(success, "ERC20 approve failed");
    }

    /// @notice Approve ERC721 transfer (only when unlocked)
    function approveERC721(
        address nftAddress,
        address to,
        uint256 tokenId_
    ) external onlyTokenOwner whenNotLocked {
        if (nftAddress == address(0)) revert ZeroAddress();

        IERC721(nftAddress).approve(to, tokenId_);
    }

    /// @notice Set approval for all ERC1155 (only when unlocked)
    function setApprovalForAllERC1155(
        address tokenAddress,
        address operator,
        bool approved
    ) external onlyTokenOwner whenNotLocked {
        if (tokenAddress == address(0) || operator == address(0)) revert ZeroAddress();

        IERC1155(tokenAddress).setApprovalForAll(operator, approved);
    }

    // ============ Internal Functions ============

    function _incrementNonce() private {
        _nonce++;
    }
}
