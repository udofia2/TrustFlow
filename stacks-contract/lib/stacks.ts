import { StacksNetwork, STACKS_MAINNET, STACKS_TESTNET, networkFromName } from "@stacks/network";

/**
 * Stacks network configuration
 * Configured for Stacks Testnet and Mainnet
 */

// Get network from environment variable
const networkEnv = process.env.NEXT_PUBLIC_STACKS_NETWORK || "testnet";

// Create network instance
export const getStacksNetwork = (): StacksNetwork => {
  switch (networkEnv) {
    case "mainnet":
      return STACKS_MAINNET;
    case "testnet":
    default:
      return STACKS_TESTNET;
  }
};

// Export network instance
export const stacksNetwork = getStacksNetwork();

// Get API URL from environment or use default
export const getStacksApiUrl = (): string => {
  return (
    process.env.NEXT_PUBLIC_STACKS_API_URL ||
    (networkEnv === "mainnet"
      ? "https://api.hiro.so"
      : "https://api.testnet.hiro.so")
  );
};

// Contract address from environment variable
export const ILENOID_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_ILENOID_ADDRESS || "";

// Network info
export const isMainnet = networkEnv === "mainnet";
export const isTestnet = networkEnv === "testnet";

