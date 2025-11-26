// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {IERC1271} from "@openzeppelin/contracts/interfaces/IERC1271.sol";
import {SignatureChecker} from "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import {Bytecode} from "./Bytecode.sol";

/// @title ERC-6551 Minimal Account
/// @notice Token-bound account tied to an ERC721 owner
contract ERC6551Account is IERC165, IERC1271 {
    event TransactionExecuted(address indexed target, uint256 indexed value, bytes data);
    event AssetsLocked(uint256 indexed tokenId, address indexed marketplace);

    error NotTokenOwner();
    error AssetsLockedAlready();
    error AssetsNotLocked();

    uint256 private _nonce;
    bool private _assetsLocked;

    receive() external payable {}

    modifier onlyTokenOwner() {
        if (msg.sender != owner()) revert NotTokenOwner();
        _;
    }

    modifier onlyWhenLocked() {
        if (!_assetsLocked) revert AssetsNotLocked();
        _;
    }

    function owner() public view returns (address) {
        (uint256 chainId_, address tokenContract_, uint256 tokenId_) = this.token();
        if (chainId_ != block.chainid) return address(0);
        return IERC721(tokenContract_).ownerOf(tokenId_);
    }

    function executeCall(
        address to,
        uint256 value,
        bytes calldata data
    ) external payable onlyTokenOwner returns (bytes memory result) {
        if (to == address(0)) revert();

        _incrementNonce(); // Increment the nonce

        bool success;
        (success, result) = to.call{value: value}(data);

        if (!success) {
            assembly {
                revert(add(result, 32), mload(result))
            }
        }
        emit TransactionExecuted(to, value, data);
    }

    function approveTransferERC20(
        address tokenAddress,
        address spender,
        uint256 amount
    ) external onlyTokenOwner {
        if (_assetsLocked) revert AssetsLockedAlready();
        _assetsLocked = true;
        (, address tokenContract_, uint256 tokenId_) = this.token();
        bool ok = IERC20(tokenAddress).approve(spender, amount);
        require(ok, "Approve failed");
        emit AssetsLocked(tokenId_, tokenContract_);
    }


    function approveTransferERC721(
        address tokenAddress,
        address to,
        uint256 tokenId_
    ) external onlyTokenOwner {
        if (_assetsLocked) revert AssetsLockedAlready();
        _assetsLocked = true;
        (, address boundTokenContract, uint256 boundTokenId) = this.token();
        IERC721(tokenAddress).approve(to, tokenId_);
        emit AssetsLocked(boundTokenId, boundTokenContract);
    }

    function approveTransferERC1155(
        address tokenAddress,
        address to,
        uint256,
        uint256,
        bytes calldata
    ) external onlyTokenOwner {
        if (_assetsLocked) revert AssetsLockedAlready();
        _assetsLocked = true;
        (, address boundTokenContract, uint256 boundTokenId) = this.token();
        IERC1155(tokenAddress).setApprovalForAll(to, true);
        emit AssetsLocked(boundTokenId, boundTokenContract);
    }


    function transferERC20(
        address tokenAddress,
        address to,
        uint256 amount
    ) external onlyTokenOwner {
        if (!_assetsLocked) revert AssetsNotLocked();
        bytes memory data = abi.encodeWithSelector(
            bytes4(keccak256("transfer(address,uint256)")),
            to,
            amount
        );
        this.executeCall(tokenAddress, 0, data);
    }

    function transferNFT(
        address nftAddress,
        address to,
        uint256 tokenId_
    ) external onlyTokenOwner {
        if (!_assetsLocked) revert AssetsNotLocked();
        IERC721(nftAddress).safeTransferFrom(address(this), to, tokenId_);
    }

    function transferERC1155(
        address tokenAddress,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
        ) public onlyTokenOwner {
            IERC1155(tokenAddress).safeTransferFrom(address(this), to, id, amount, data);
        }

    function transferERC1155Batch(
        address tokenAddress,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public onlyTokenOwner {
        IERC1155(tokenAddress).safeBatchTransferFrom(address(this), to, ids, amounts, data);
    }

    function transferAccount(address /*newOwner*/ ) public view onlyWhenLocked {
        revert AssetsLockedAlready();
    }


    function lockAssets() external onlyTokenOwner {
        if (_assetsLocked) revert AssetsLockedAlready();
        _assetsLocked = true;
        (, address tokenContract_, uint256 tokenId_) = this.token();
        emit AssetsLocked(tokenId_, tokenContract_);
    }

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

    function nonce() external view returns (uint256) {
        return _nonce;
    }

    function _incrementNonce() private {
        _nonce++;
    }
}
