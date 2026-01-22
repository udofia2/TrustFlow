import { type Address } from "viem";
import CharityTrackerABI from "./abi/CharityTracker.json";

/**
 * Contract configuration for CharityTracker
 * Contains contract address, ABI, and related addresses
 */

// Contract address from environment variable
export const CHARITY_TRACKER_ADDRESS = (process.env
  .NEXT_PUBLIC_CHARITY_TRACKER_ADDRESS || "0x0000000000000000000000000000000000000000") as Address;

// USDC token address from environment variable
export const USDC_ADDRESS = (process.env
  .NEXT_PUBLIC_USDC_ADDRESS || "0x0000000000000000000000000000000000000000") as Address;

// Contract ABI - extract abi field from the JSON file
export const CHARITY_TRACKER_ABI = (CharityTrackerABI as { abi: readonly any[] }).abi;

