# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| Testnet | :white_check_mark: |
| Mainnet | Not yet deployed   |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please report it responsibly.

### How to Report

**DO NOT** create public GitHub issues for security vulnerabilities.

Instead, please:

1. **Email**: Send details to security@ebtprogram.xyz
2. **GitHub Security Advisory**: Use [GitHub's private security advisory feature](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing/privately-reporting-a-security-vulnerability)
3. **Encrypted Communication**: PGP key available upon request

### What to Include

Please provide:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)
- Your contact information

### Response Timeline

| Stage | Timeline |
|-------|----------|
| Initial Response | 48-72 hours |
| Triage & Assessment | 1 week |
| Fix Development | Depends on severity |
| Public Disclosure | After fix is deployed |

### Responsible Disclosure

We kindly ask that you:

- Allow reasonable time for us to fix the issue
- Avoid exploiting the vulnerability
- Do not disclose publicly until we've addressed it
- Act in good faith

### Recognition

We appreciate security researchers and may:

- Credit you in our security advisories
- Include you in our Hall of Fame
- Offer bug bounty rewards (program TBD)

## Security Measures

### Smart Contract Security

#### Access Control

All contracts implement role-based access control:

```solidity
// Example roles
modifier onlyOwner()           // Contract owner
modifier onlyProtocol()        // Protocol caller for claims
modifier onlyEBTProgram()      // Cross-contract calls
modifier onlyNFTContract()     // TBA locking control
```

#### Reentrancy Protection

All state-modifying functions use OpenZeppelin's `ReentrancyGuard`:

```solidity
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";

function mint(string calldata userID) external payable nonReentrant {
    // Implementation
}
```

#### Emergency Controls

| Contract | Emergency Functions |
|----------|-------------------|
| FoodStamps | `pause()`, `unpause()` |
| EBTProgram | `setBlacklistStatus()` |
| LiquidityVault | `emergencyWithdrawTokens()`, `emergencyWithdrawETH()` |

### TBA Asset Locking

Token Bound Accounts implement automatic locking when NFTs are approved for transfer:

```
Approve NFT → TBA Locked → Cannot withdraw assets
Transfer NFT → TBA Unlocked → New owner has access
Cancel Approval → Request Unlock → Assets accessible again
```

This prevents:
- Seller draining TBA between listing and sale
- Front-running attacks on marketplace transactions
- Asset theft via approval manipulation

### Audit Status

| Severity | Count | Status |
|----------|-------|--------|
| Critical | 6 | All Fixed |
| High | 8 | In Progress |
| Medium | 9 | Planned |
| Low | 8 | Best Practices |

See [SECURITY_AUDIT.md](smart-contracts/SECURITY_AUDIT.md) for the full audit report.

### Known Limitations

1. **Block-Based Rate Limiting**
   - Current: 3 blocks between mints
   - Risk: Can be gamed with multiple wallets
   - Plan: Time-based limiting for mainnet

2. **Protocol Caller Trust**
   - Claims executed by protocol address
   - Trust assumption: Protocol caller is honest
   - Mitigation: Multisig for mainnet

3. **Merkle Proof Security**
   - Current: Basic merkle verification
   - Missing: Chain ID and deadline
   - Plan: Add for mainnet deployment

## Security Best Practices

### For Users

1. **Verify Contract Addresses**
   - Always verify you're interacting with official contracts
   - Check addresses on Etherscan

2. **Use Hardware Wallets**
   - Store valuable NFTs on hardware wallets
   - Never share private keys

3. **Check Approvals**
   - Review token approvals before confirming
   - Revoke unused approvals periodically

4. **Verify Transactions**
   - Read transaction details before signing
   - Be cautious of phishing sites

### For Developers

1. **Follow Security Checklist**
   - [ ] Use `nonReentrant` on external functions
   - [ ] Validate all inputs
   - [ ] Use SafeMath/Solidity 0.8+ checks
   - [ ] Follow checks-effects-interactions pattern
   - [ ] Emit events for state changes
   - [ ] Use `onlyOwner` for admin functions

2. **Testing Requirements**
   - Unit tests for all functions
   - Fuzz tests for edge cases
   - Integration tests for flows
   - Security-specific tests

3. **Code Review**
   - All PRs require review
   - Security-sensitive changes need extra review
   - Use static analysis tools

## Security Tools

### Recommended Tools

| Tool | Purpose |
|------|---------|
| [Slither](https://github.com/crytic/slither) | Static analysis |
| [Mythril](https://github.com/ConsenSys/mythril) | Security analysis |
| [Foundry Fuzz](https://book.getfoundry.sh/forge/fuzz-testing) | Fuzz testing |
| [Echidna](https://github.com/crytic/echidna) | Property-based testing |

### Running Security Checks

```bash
# Static analysis with Slither
pip install slither-analyzer
slither smart-contracts/contracts/

# Foundry fuzz tests
cd smart-contracts
forge test --fuzz-runs 10000

# Check for common issues
forge test --match-contract Security
```

## Incident Response

### Severity Levels

| Level | Description | Response Time |
|-------|-------------|---------------|
| Critical | Funds at risk, active exploit | Immediate |
| High | Significant vulnerability | 24 hours |
| Medium | Limited impact vulnerability | 1 week |
| Low | Best practice improvement | Next release |

### Response Procedure

1. **Assess** - Determine severity and impact
2. **Contain** - Pause affected contracts if needed
3. **Fix** - Develop and test patch
4. **Deploy** - Deploy fix to affected networks
5. **Communicate** - Notify users and community
6. **Review** - Post-mortem and improvements

## Contact

- **Security Email**: security@ebtprogram.xyz
- **GitHub Security**: Use private vulnerability reporting
- **Discord**: #security channel (for general questions only)

## Acknowledgments

We thank the following for their contributions to our security:

- Internal Security Review Team
- Community Security Researchers

---

Last Updated: November 2024
