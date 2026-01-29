import { connect, disconnect, isConnected, getLocalStorage, request } from "@stacks/connect";
import { isMainnet } from "./stacks";

/**
 * Stacks Connect configuration and utilities
 * Handles wallet connection and authentication
 */

export interface StacksUserData {
  addresses: {
    stx: Array<{ address: string }>;
    btc?: Array<{ address: string }>;
  };
}

/**
 * Check if an error is a user rejection
 */
const isUserRejection = (error: unknown): boolean => {
  // Check error name/type
  if (error instanceof Error) {
    const errorName = error.name?.toLowerCase() || "";
    const message = error.message.toLowerCase();
    
    return (
      errorName.includes("reject") ||
      errorName.includes("cancel") ||
      message.includes("user rejected") ||
      message.includes("user rejected the request") ||
      message.includes("request rejected") ||
      message.includes("rejected") ||
      message.includes("cancelled") ||
      message.includes("canceled") ||
      message.includes("user cancelled") ||
      message.includes("user canceled")
    );
  }
  
  // Check error object with message property
  if (
    typeof error === "object" &&
    error !== null
  ) {
    const errorObj = error as Record<string, unknown>;
    const message = String(errorObj.message || "").toLowerCase();
    const name = String(errorObj.name || "").toLowerCase();
    
    return (
      name.includes("reject") ||
      name.includes("cancel") ||
      message.includes("user rejected") ||
      message.includes("user rejected the request") ||
      message.includes("request rejected") ||
      message.includes("rejected") ||
      message.includes("cancelled") ||
      message.includes("canceled") ||
      message.includes("user cancelled") ||
      message.includes("user canceled")
    );
  }
  
  return false;
};

/**
 * Connect to Stacks wallet
 * Only works on client side (browser)
 * Returns null if user rejects the connection (not an error)
 * Throws error for actual connection failures
 */
export const connectStacksWallet = async (): Promise<any> => {
  if (typeof window === 'undefined') return null;
  try {
    if (isConnected()) {
      return getLocalStorage();
    }

    const response = await connect({
      network: isMainnet ? "mainnet" : "testnet",
    });

    return response;
  } catch (error) {
    // User rejection is not an error - just return null silently
    if (isUserRejection(error)) {
      return null;
    }
    
    // Log and rethrow actual errors
    console.error("Failed to connect wallet:", error);
    throw error;
  }
};

/**
 * Disconnect from Stacks wallet
 */
export const disconnectStacksWallet = (): void => {
  disconnect();
};

/**
 * Check if wallet is connected
 * Only works on client side (browser)
 */
export const isWalletConnected = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    return isConnected();
  } catch (error) {
    return false;
  }
};

/**
 * Get current user data from local storage
 * Only works on client side (browser)
 */
export const getStacksUserData = (): StacksUserData | null => {
  if (typeof window === 'undefined') return null;
  try {
    return getLocalStorage();
  } catch (error) {
    return null;
  }
};

/**
 * Get STX address from connected wallet
 * Only works on client side (browser)
 */
export const getStxAddress = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    const userData = getLocalStorage();
    return userData?.addresses?.stx?.[0]?.address || null;
  } catch (error) {
    return null;
  }
};

/**
 * Request method for wallet interactions
 * Used for contract calls, transfers, etc.
 */
export const requestStacksMethod = async (
  method: string,
  params: any
): Promise<any> => {
  try {
    return await request(method as any, params);
  } catch (error) {
    console.error(`Failed to execute ${method}:`, error);
    throw error;
  }
};

