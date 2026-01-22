import { createConfig, http } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";

/**
 * Wagmi configuration for Web3 integration
 * Configured for Base Sepolia testnet
 */

// Get RPC URL from environment variable
const rpcUrl = process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org";

// Get WalletConnect Project ID (optional)
const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

// Create connectors array
const connectors = [
  injected(), // MetaMask and other injected wallets
  ...(walletConnectProjectId
    ? [walletConnect({ projectId: walletConnectProjectId })]
    : []), // WalletConnect (if project ID is provided)
];

// Create Wagmi config
export const wagmiConfig = createConfig({
  chains: [baseSepolia],
  connectors,
  transports: {
    [baseSepolia.id]: http(rpcUrl),
  },
});

