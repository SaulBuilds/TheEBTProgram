# Contributing to The EBT Program

Thank you for your interest in contributing to The EBT Program! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Security](#security)

## Code of Conduct

This project adheres to a code of conduct. By participating, you are expected to uphold this code:

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive feedback
- Respect differing viewpoints and experiences

## Getting Started

### Prerequisites

- **Node.js** 18+
- **Foundry** - [Installation Guide](https://book.getfoundry.sh/getting-started/installation)
- **Git**
- A code editor (VS Code recommended)

### Fork and Clone

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR_USERNAME/TheEBTProgram.git
cd TheEBTProgram

# Add upstream remote
git remote add upstream https://github.com/ORIGINAL_OWNER/TheEBTProgram.git
```

## Development Setup

### Smart Contracts

```bash
cd smart-contracts

# Install Foundry dependencies
forge install

# Build contracts
forge build

# Run tests
forge test
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.local.example .env.local

# Start development server
npm run dev
```

### Backend (Optional)

```bash
cd ebt-express

# Install dependencies
npm install

# Set up database
npm run prisma:generate
npm run prisma:migrate

# Start development server
npm run dev
```

## How to Contribute

### Types of Contributions

We welcome many types of contributions:

1. **Bug Fixes** - Fix issues in contracts, frontend, or backend
2. **Features** - Add new functionality (discuss first in an issue)
3. **Documentation** - Improve docs, add examples, fix typos
4. **Tests** - Add unit tests, integration tests, or fuzz tests
5. **Security** - Report vulnerabilities (see [Security](#security))
6. **Refactoring** - Improve code quality without changing behavior

### Issue First

Before starting work:

1. **Check existing issues** - Someone may already be working on it
2. **Create an issue** - Describe what you want to do
3. **Wait for feedback** - Especially for large changes
4. **Get assigned** - Prevents duplicate work

### Branch Naming

Use descriptive branch names:

```
feat/add-claim-notifications
fix/tba-locking-edge-case
docs/improve-deployment-guide
test/add-fuzz-tests-mint
refactor/optimize-gas-usage
```

## Pull Request Process

### 1. Create Your Branch

```bash
# Sync with upstream
git fetch upstream
git checkout main
git merge upstream/main

# Create feature branch
git checkout -b feat/your-feature-name
```

### 2. Make Your Changes

- Write clean, readable code
- Follow existing code style
- Add tests for new functionality
- Update documentation as needed

### 3. Test Your Changes

```bash
# Smart contracts
cd smart-contracts
forge test
forge fmt --check

# Frontend
cd frontend
npm run type-check
npm run build

# Backend
cd ebt-express
npm test
```

### 4. Commit Your Changes

We use [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Format: <type>(<scope>): <description>

# Examples:
git commit -m "feat(contracts): add merkle proof deadline validation"
git commit -m "fix(frontend): resolve wallet connection error on mobile"
git commit -m "docs: add deployment guide for mainnet"
git commit -m "test(contracts): add fuzz tests for mint function"
git commit -m "refactor(backend): simplify application approval logic"
```

#### Commit Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `test` | Adding or fixing tests |
| `refactor` | Code change that doesn't fix a bug or add a feature |
| `perf` | Performance improvement |
| `style` | Formatting, missing semicolons, etc. |
| `chore` | Maintenance tasks |
| `ci` | CI/CD changes |

### 5. Push and Create PR

```bash
git push origin feat/your-feature-name
```

Then create a Pull Request on GitHub with:

- **Clear title** following commit convention
- **Description** of what changed and why
- **Link to issue** if applicable
- **Screenshots** for UI changes
- **Test results** or coverage changes

### 6. Review Process

- Maintainers will review your PR
- Address any requested changes
- Once approved, your PR will be merged

## Coding Standards

### Solidity

Follow the [Solidity Style Guide](https://docs.soliditylang.org/en/latest/style-guide.html):

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/// @title MyContract
/// @notice Brief description
/// @dev Technical details
contract MyContract is ERC721 {
    // State variables
    uint256 public constant MAX_SUPPLY = 1000;
    uint256 private _counter;

    // Events
    event TokenMinted(address indexed to, uint256 indexed tokenId);

    // Errors
    error MaxSupplyReached();
    error InvalidAddress();

    // Modifiers
    modifier onlyValidAddress(address addr) {
        if (addr == address(0)) revert InvalidAddress();
        _;
    }

    // Constructor
    constructor() ERC721("MyToken", "MTK") {}

    // External functions
    function mint(address to) external onlyValidAddress(to) {
        if (_counter >= MAX_SUPPLY) revert MaxSupplyReached();
        _mint(to, ++_counter);
        emit TokenMinted(to, _counter);
    }

    // View functions
    function totalMinted() external view returns (uint256) {
        return _counter;
    }
}
```

### TypeScript

Follow the project's ESLint and Prettier configuration:

```typescript
// Use explicit types
interface UserData {
  userId: string;
  walletAddress: `0x${string}`;
  createdAt: Date;
}

// Prefer const and arrow functions
const calculateReward = (score: number): bigint => {
  const baseAmount = BigInt('20000000000000000000000');
  return baseAmount + (baseAmount * BigInt(score)) / BigInt(1000);
};

// Use async/await over promises
async function fetchUserData(userId: string): Promise<UserData> {
  const response = await fetch(`/api/users/${userId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch user data');
  }
  return response.json();
}
```

### Format Code

```bash
# Solidity
cd smart-contracts && forge fmt

# TypeScript/JavaScript
cd frontend && npm run format
cd ebt-express && npm run format
```

## Testing Guidelines

### Smart Contract Tests

Write tests using Foundry's testing framework:

```solidity
// foundry-test/unit/MyContract.t.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";
import "../../contracts/MyContract.sol";

contract MyContractTest is Test {
    MyContract public myContract;
    address public user = makeAddr("user");

    function setUp() public {
        myContract = new MyContract();
    }

    function test_MintSuccess() public {
        vm.prank(user);
        myContract.mint(user);

        assertEq(myContract.balanceOf(user), 1);
        assertEq(myContract.ownerOf(1), user);
    }

    function test_RevertWhen_MaxSupplyReached() public {
        // Mint all tokens
        for (uint256 i = 0; i < 1000; i++) {
            myContract.mint(makeAddr(string(abi.encodePacked(i))));
        }

        // Should revert
        vm.expectRevert(MyContract.MaxSupplyReached.selector);
        myContract.mint(user);
    }

    function testFuzz_MintWithDifferentAddresses(address to) public {
        vm.assume(to != address(0));

        myContract.mint(to);
        assertEq(myContract.ownerOf(1), to);
    }
}
```

### Test Coverage Requirements

- **New features**: Must include tests
- **Bug fixes**: Should include regression test
- **Minimum coverage**: 80% for new code

```bash
# Check coverage
forge coverage
```

## Documentation

### When to Update Docs

- Adding new features
- Changing existing behavior
- Adding new contracts or functions
- Changing deployment process

### Documentation Locations

| Type | Location |
|------|----------|
| Root README | `README.md` |
| Smart Contracts | `smart-contracts/README.md` |
| Frontend | `frontend/README.md` |
| Security | `smart-contracts/SECURITY_AUDIT.md` |
| API | Code comments + OpenAPI (planned) |

### NatSpec Comments

Document all public functions:

```solidity
/// @notice Mints a new EBT Card NFT
/// @dev Creates TBA and distributes initial tokens
/// @param userID The unique identifier from the application
/// @return tokenId The ID of the minted NFT
function mint(string calldata userID) external payable returns (uint256 tokenId) {
    // Implementation
}
```

## Security

### Reporting Vulnerabilities

**DO NOT** create public issues for security vulnerabilities.

Instead:
1. Email security@ebtprogram.xyz
2. Or use GitHub's private security advisory feature
3. Include detailed reproduction steps
4. Allow time for the team to respond (48-72 hours)

### Security Considerations

When contributing:

- Never commit private keys or secrets
- Review code for common vulnerabilities (reentrancy, overflow, etc.)
- Consider edge cases and failure modes
- Add appropriate access controls
- Use OpenZeppelin contracts where possible

## Questions?

- **Discord**: [Join our Discord](#) (link TBD)
- **GitHub Discussions**: For general questions
- **Issues**: For bugs and feature requests

---

Thank you for contributing to The EBT Program!
