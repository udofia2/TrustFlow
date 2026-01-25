import { createConfig, http } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";

/**
 * Wagmi configuration for Web3 integration
 * Configured for Base Sepolia testnet
 * 
 * Note: In wagmi v3, connector dependencies must be installed separately.
 * - `injected()` works for MetaMask and other injected wallets (no extra dependency)
 * - `walletConnect()` requires WalletConnect Project ID (optional)
 * - `metaMask()` requires @metamask/sdk package (not used here to avoid extra dependency)
 */

// Get RPC URL from environment variable
// Fallback to public RPC, but recommend using a dedicated provider (Alchemy, Infura)
const rpcUrl = process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org";

// Get WalletConnect Project ID (optional but recommended)
// Get your Project ID from: https://cloud.reown.com/
const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

// Create connectors array
// injected() handles MetaMask and other browser-injected wallets without requiring @metamask/sdk
const connectors = [
  injected(), // Handles MetaMask, Coinbase Wallet, and other injected wallets
  ...(walletConnectProjectId
    ? [walletConnect({ projectId: walletConnectProjectId })]
    : []), // WalletConnect (if project ID is provided)
].filter(Boolean); // Remove any undefined connectors

// Create Wagmi config
export const wagmiConfig = createConfig({
  chains: [baseSepolia],
  connectors,
  transports: {
    [baseSepolia.id]: http(rpcUrl),
  },
});

