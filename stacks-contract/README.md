# Ilenoid Smart Contracts

**Blockchain-powered transparent charity donations on Stacks**

[![Live Frontend](https://img.shields.io/badge/Frontend-Live-brightgreen)](https://ilenoid.netlify.app/)
[![Testnet Deployed](https://img.shields.io/badge/Testnet-Deployed-success)](https://explorer.stacks.co/address/ST2W758Q6BS97GWK7STXTAW2ZG26YFXE4V5WMTG3Q?chain=testnet)
[![Open Source](https://img.shields.io/badge/Open%20Source-Yes-green)](https://github.com)

Smart contracts for the Ilenoid transparent charity tracker on Stacks blockchain. Ilenoid enables transparent, trustless, and decentralized charity donations with milestone-based fund release and donor voting.

## 🌐 Live Deployment

### Frontend
- **URL**: [https://ilenoid.netlify.app/](https://ilenoid.netlify.app/)
- **Status**: ✅ Live and operational

### Testnet Contracts
- **Deployer Address**: `ST2W758Q6BS97GWK7STXTAW2ZG26YFXE4V5WMTG3Q`
- **Main Contract**: [`ST2W758Q6BS97GWK7STXTAW2ZG26YFXE4V5WMTG3Q.ilenoid`](https://explorer.stacks.co/txid/ST2W758Q6BS97GWK7STXTAW2ZG26YFXE4V5WMTG3Q.ilenoid?chain=testnet)
- **NGO Registry**: [`ST2W758Q6BS97GWK7STXTAW2ZG26YFXE4V5WMTG3Q.ngo-registry`](https://explorer.stacks.co/txid/ST2W758Q6BS97GWK7STXTAW2ZG26YFXE4V5WMTG3Q.ngo-registry?chain=testnet)
- **Explorer**: [View on Stacks Explorer](https://explorer.stacks.co/address/ST2W758Q6BS97GWK7STXTAW2ZG26YFXE4V5WMTG3Q?chain=testnet)

### Deployment Details
- **Network**: Stacks Testnet
- **Deployment Date**: January 2026
- **Total Cost**: 0.321960 STX (319,380 + 2,580 microSTX)
- **Clarity Version**: 4
- **Epoch**: 3.3
- **Status**: ✅ Successfully deployed and confirmed

## Configuration

- **Clarity Version**: 4
- **Epoch**: "latest"
- **Framework**: Clarinet 3.13.0+

## Dependencies

### Smart Contracts (contractz/)
- `@stacks/clarinet-sdk: ^3.10.0` - Testing framework
- `@stacks/transactions: ^7.3.0` - **Used for contract interactions** ✅
- `vitest-environment-clarinet: ^3.0.2` - Test environment
- `vitest: ^4.0.7` - Test runner

### Frontend Integration
- `@stacks/connect: ^8.0.0` - **Wallet connectivity** ✅
- `@stacks/transactions: ^7.0.0` - **Transaction building** ✅

**Library Usage Details:**

**@stacks/transactions** is used in:
- `contractz/tests/helpers.ts` - Test utilities for contract calls
- `contractz/tests/ilenoid.test.ts` - Comprehensive test suite (37 tests)
- `lib/stacks-contract.ts` - Contract interaction layer
- `hooks/useProject.ts` - React hooks for project data
- Functions: `makeContractCall`, `fetchCallReadOnlyFunction`, `Cl` value constructors

**@stacks/connect** is used in:
- `lib/stacks-connect.ts` - Wallet connection and authentication
- `components/Providers.tsx` - React context providers
- Functions: `connect`, `disconnect`, `isConnected`, `request`

Both libraries are production-ready and actively used in the live frontend at [https://ilenoid.netlify.app/](https://ilenoid.netlify.app/). This open-source project demonstrates real-world usage of Stacks ecosystem tools for building transparent, decentralized applications.

## Getting Started

### Prerequisites

- [Clarinet](https://docs.stacks.co/build/clarinet) installed
- Node.js 18+ and npm

### Installation

```bash
cd contractz
npm install
```

### Development

```bash
# Check contracts
clarinet check

# Format contracts
clarinet fmt

# Run tests
npm test

# Run tests with coverage
npm run test:report

# Start devnet
clarinet devnet start
```

## Key Features

- ✅ **NGO Registration & Verification**: Secure registration system for verified NGOs
- ✅ **Project Creation with Milestones**: Create transparent charity projects with multiple milestones
- ✅ **Multi-Asset Donations**: Support for both STX and SIP-010 fungible tokens
- ✅ **Weighted Donor Voting**: Democratic voting system where vote weight equals donation amount
- ✅ **Milestone-Based Fund Release**: Transparent fund release based on donor consensus
- ✅ **Emergency Controls**: Pause/unpause mechanism and emergency withdrawal capabilities
- ✅ **Fully On-Chain**: All operations are transparent and verifiable on the blockchain
- ✅ **Clarity 4**: Built with the latest Clarity language features

## Source Contract

This Clarity implementation is the primary and active contract for the Ilenoid project on Stacks blockchain.

**Note**: A previous Solidity implementation for Base blockchain has been removed as the project has fully migrated to Stacks.

## Deployment

### Quick Deploy to Testnet

```bash
cd contractz
clarinet deployments generate --testnet --medium-cost
clarinet deployments apply --testnet
```

For detailed deployment instructions, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md).

### Deployment Costs
- **ilenoid.clar**: 319,380 microSTX (~0.319 STX)
- **ngo-registry.clar**: 2,580 microSTX (~0.003 STX)
- **Total**: 321,960 microSTX (~0.322 STX)

## Contract Architecture

### Main Contract: `ilenoid.clar`
- **Size**: 753 lines
- **Functions**: 20 (10 public + 10 read-only)
- **Features**: Full charity tracking system with voting and fund release

### Supporting Contract: `ngo-registry.clar`
- **Purpose**: NGO registration and verification
- **Integration**: Used by main contract for access control

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:report

# Check contract compilation
clarinet check
```

**Test Coverage**: 37 tests covering all major functionality
- NGO management
- Project creation
- STX and token donations
- Voting mechanisms
- Fund release
- Emergency controls

## Resources

- 🌐 [Live Frontend](https://ilenoid.netlify.app/)
- 📊 [Stacks Explorer - Testnet](https://explorer.stacks.co/address/ST2W758Q6BS97GWK7STXTAW2ZG26YFXE4V5WMTG3Q?chain=testnet)
- 📚 [Stacks Documentation](https://docs.stacks.co)
- 🔷 [Clarity Language Reference](https://docs.stacks.co/reference/clarity)
- 🛠️ [Clarinet Documentation](https://docs.stacks.co/build/clarinet)
- 💎 [SIP-010 Token Standard](https://github.com/stacksgov/sips/blob/main/sips/sip-010/sip-010-fungible-token-standard.md)
- 📖 [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- 📋 [Implementation Phases](./docs/IMPLEMENTATION_PHASES.md)

## Contributing

This is an open-source project built on Stacks blockchain. We welcome contributions from the community!

### Open Source Contributions

This project demonstrates:
- **Real-world Stacks ecosystem usage**: Production deployment using `@stacks/connect` and `@stacks/transactions`
- **Comprehensive testing**: 37 tests covering all major functionality
- **Full documentation**: Complete guides for deployment, development, and usage
- **Active development**: Regular updates and improvements
- **Public repository**: All code is open source and available for review

### How to Contribute
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

### Areas for Contribution
- Bug fixes and improvements
- Additional test coverage
- Documentation improvements
- Feature enhancements
- Performance optimizations

Contributions, feedback, and suggestions are welcome!

## License

See LICENSE file for details.

