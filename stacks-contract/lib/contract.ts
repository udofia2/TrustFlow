import { ILENOID_CONTRACT_ADDRESS } from "./stacks";

/**
 * Contract configuration for Ilenoid
 * Contains contract address and interface definitions for Clarity contracts
 * 
 * Note: Clarity contracts don't use ABIs like Solidity.
 * Instead, we define the contract interface here for type safety.
 */

// Contract address from environment variable (Stacks address format: SP...)
export const ILENOID_ADDRESS = ILENOID_CONTRACT_ADDRESS;

// Contract name (used in contract calls)
export const ILENOID_CONTRACT_NAME = "ilenoid";

/**
 * Clarity contract function signatures
 * These match the functions defined in contracts/ilenoid.clar
 */
export const ILENOID_CONTRACT_INTERFACE = {
  // Read-only functions
  readOnly: {
    getProjectCounter: "get-project-counter",
    isVerifiedNGO: "is-verified-ngo",
    getProject: "get-project",
    getMilestone: "get-milestone",
    getDonorContribution: "get-donor-contribution",
    hasDonorVoted: "has-donor-voted",
  },
  // Public functions
  public: {
    registerNGO: "register-ngo",
    revokeNGO: "revoke-ngo",
    pauseContract: "pause-contract",
    unpauseContract: "unpause-contract",
    createProject: "create-project",
    donate: "donate",
    voteOnMilestone: "vote-on-milestone",
    releaseFunds: "release-funds",
  },
} as const;

// Legacy exports for backward compatibility during migration
export const CHARITY_TRACKER_ADDRESS = ILENOID_ADDRESS;
export const CHARITY_TRACKER_ABI = null; // Clarity doesn't use ABIs

// Export ILENOID_ABI for backward compatibility (Clarity doesn't use ABIs)
// This is set to null since Clarity contracts don't have ABIs like Solidity
export const ILENOID_ABI = null;

// USDC is not available on Stacks - this is a placeholder for compatibility
// Stacks uses STX as the native token, not ERC-20 tokens
// If you need stablecoins on Stacks, consider using wrapped tokens or other Stacks-native tokens
export const USDC_ADDRESS = "" as const;

