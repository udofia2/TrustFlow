# Ilenoid Contract Deployment

This directory contains deployment plans for the Ilenoid smart contracts on different Stacks networks.

## Deployment Plans

### Devnet
- **File**: `default.devnet-plan.yaml`
- **Purpose**: Local development and testing
- **Network**: Devnet (localhost)
- **Usage**: Automatically deployed when running `clarinet devnet start`

### Testnet
- **File**: `default.testnet-plan.yaml` (generate with `clarinet deployments generate --testnet`)
- **Purpose**: Public testnet deployment for integration testing
- **Network**: Stacks Testnet
- **Prerequisites**:
  - Testnet STX in deployer account (use faucet if needed)
  - Valid mnemonic configured in `settings/Testnet.toml`

### Mainnet
- **File**: `default.mainnet-plan.yaml` (generate with `clarinet deployments generate --mainnet`)
- **Purpose**: Production deployment
- **Network**: Stacks Mainnet
- **Prerequisites**:
  - Thorough testing on testnet
  - Security audit completed
  - Sufficient STX for deployment fees
  - Secure key management (prefer hardware wallet)

## Deployment Commands

### Generate Deployment Plan

```bash
# Devnet
clarinet deployments generate --devnet --medium-cost

# Testnet
clarinet deployments generate --testnet --medium-cost

# Mainnet
clarinet deployments generate --mainnet --high-cost
```

### Apply Deployment

```bash
# Devnet (manual deployment)
clarinet deployments apply --devnet

# Testnet
clarinet deployments apply --testnet

# Mainnet
clarinet deployments apply --mainnet
```

## Contract Details

### Main Contract: `ilenoid.clar`
- **Clarity Version**: 4
- **Epoch**: "latest"
- **Size**: ~752 lines
- **Functions**: 20 (10 public + 10 read-only)

### Contract Features
- NGO registration and verification
- Project creation with milestones
- STX and SIP-010 token donations
- Weighted donor voting
- Milestone-based fund release
- Emergency controls (pause/unpause, withdrawal)

## Deployment Checklist

### Pre-Deployment
- [ ] Contract compiles without errors (`clarinet check`)
- [ ] All tests pass (`npm test`)
- [ ] Code review completed
- [ ] Security review completed (for mainnet)
- [ ] Deployment account has sufficient STX
- [ ] Network configuration verified (`settings/<network>.toml`)

### Deployment
- [ ] Generate deployment plan
- [ ] Review deployment plan
- [ ] Apply deployment plan
- [ ] Verify contract deployment on explorer
- [ ] Test contract functions on deployed network

### Post-Deployment
- [ ] Verify contract address
- [ ] Register initial NGOs (if needed)
- [ ] Test critical functions
- [ ] Update frontend with contract address
- [ ] Monitor contract activity

## Network Configuration

### Devnet
- **Stacks Node**: `http://localhost:20443`
- **Bitcoin Node**: `http://devnet:devnet@localhost:18443`
- **Deployer**: Configured in `settings/Devnet.toml`

### Testnet
- **Stacks Node**: `https://api.testnet.hiro.so`
- **Bitcoin Node**: Testnet Bitcoin node
- **Deployer**: Configure mnemonic in `settings/Testnet.toml`
- **Faucet**: https://explorer.stacks.co/sandbox/faucet

### Mainnet
- **Stacks Node**: `https://api.hiro.so`
- **Bitcoin Node**: Mainnet Bitcoin node
- **Deployer**: Configure mnemonic in `settings/Mainnet.toml`
- **Security**: Use hardware wallet or encrypted mnemonic

## Cost Estimation

Deployment costs vary based on:
- Contract size
- Network congestion
- Fee rate selected

Typical costs:
- **Devnet**: Free (local)
- **Testnet**: ~5,000-10,000 microSTX
- **Mainnet**: ~50,000-100,000 microSTX

Use `--low-cost`, `--medium-cost`, `--high-cost`, or `--manual-cost` flags to control fee rates.

## Security Notes

1. **Never commit mnemonics** to version control
2. **Use encrypted mnemonics** for mainnet: `clarinet deployments encrypt`
3. **Test thoroughly** on testnet before mainnet deployment
4. **Verify contract address** after deployment
5. **Keep deployment keys secure** and backed up

## Troubleshooting

### Deployment Fails
- Check account has sufficient STX
- Verify network configuration
- Check contract compilation
- Review error messages in deployment output

### Contract Not Found After Deployment
- Wait for block confirmation
- Verify contract address
- Check network explorer

### Insufficient Funds
- Request testnet STX from faucet
- Check account balance
- Verify fee rate settings

## Resources

- [Clarinet Deployment Guide](https://docs.stacks.co/build/clarinet/contract-deployment)
- [Stacks Explorer](https://explorer.stacks.co)
- [Stacks Documentation](https://docs.stacks.co)

