# Contributing to Ilenoid

Thank you for your interest in contributing to Ilenoid! This document provides guidelines and instructions for contributing.

## 🤝 How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/udofia2/ilenoid/issues)
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Environment details (browser, wallet, network)

### Suggesting Features

1. Check if the feature has already been suggested
2. Create a new issue with:
   - Clear description of the feature
   - Use case and benefits
   - Potential implementation approach (if you have ideas)

### Code Contributions

1. **Fork the repository**
2. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**:
   - Follow the code style guidelines
   - Write tests for new features
   - Update documentation
4. **Commit your changes**:
   ```bash
   git commit -m "Add: description of your changes"
   ```
   Use conventional commit messages:
   - `Add:` for new features
   - `Fix:` for bug fixes
   - `Update:` for updates to existing features
   - `Refactor:` for code refactoring
   - `Docs:` for documentation changes
5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```
6. **Create a Pull Request**:
   - Provide a clear description
   - Reference related issues
   - Request review from maintainers

## 📋 Development Setup

See the [README.md](README.md) for setup instructions.

### Running Tests

```bash
# Frontend tests
npm test

# Smart contract tests
cd contractz
npm test
# or
clarinet test

# Check contract compilation
clarinet check

# Format contracts
clarinet fmt
```

### Code Style

- **TypeScript/React**: Follow existing patterns
- **Clarity**: Follow [Clarity Style Guide](https://docs.stacks.co/docs/clarity/language-design)
- **Formatting**: Use Prettier (frontend) and `clarinet fmt` (contracts)

## 🎯 Areas for Contribution

### High Priority
- Bug fixes
- Security improvements
- Performance optimizations
- Documentation improvements

### Medium Priority
- New features (discuss in issues first)
- UI/UX improvements
- Test coverage improvements
- Accessibility improvements

### Nice to Have
- Translations
- Additional SIP-010 token support
- Analytics improvements
- Mobile optimizations
- Clarity contract optimizations
- Test coverage improvements

## 📝 Code Review Process

1. All PRs require at least one approval
2. Maintainers will review within 48 hours
3. Address feedback promptly
4. Once approved, maintainers will merge

## 🐛 Bug Report Template

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- Browser: [e.g. Chrome 120]
- Wallet: [e.g. Hiro Wallet, Xverse]
- Network: [e.g. Stacks Testnet, Stacks Mainnet]
- OS: [e.g. macOS 14.0]

**Additional context**
Any other relevant information.
```

## 💡 Feature Request Template

```markdown
**Is your feature request related to a problem?**
A clear description of the problem.

**Describe the solution you'd like**
What you want to happen.

**Describe alternatives you've considered**
Other solutions you've thought about.

**Additional context**
Any other relevant information.
```

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Thank You

Thank you for taking the time to contribute to Ilenoid! Your efforts help make charity more transparent and accountable.

