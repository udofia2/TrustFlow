import { formatUnits, formatEther as viemFormatEther } from "viem";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes
 * Combines clsx for conditional classes and tailwind-merge for conflict resolution
 * @param inputs - Class names or conditional class objects
 * @returns Merged class string
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format an Ethereum address to truncated format
 * @param address - Full Ethereum address
 * @returns Truncated address in format: 0x1234...5678
 */
export function formatAddress(address: string): string {
  if (!address || address.length < 10) {
    return address;
  }
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Format wei amount to ETH string
 * @param amount - Amount in wei (bigint or string)
 * @returns Formatted ETH string with appropriate decimals
 */
export function formatEther(amount: bigint | string | number): string {
  try {
    const bigIntAmount = toBigInt(amount);
    return viemFormatEther(bigIntAmount);
  } catch (error) {
    return "0";
  }
}

/**
 * Format USDC amount (6 decimals)
 * @param amount - Amount in smallest USDC unit (bigint or string)
 * @returns Formatted USDC string with 6 decimals
 */
export function formatUSDC(amount: bigint | string | number): string {
  try {
    const bigIntAmount = toBigInt(amount);
    return formatUnits(bigIntAmount, 6);
  } catch (error) {
    return "0";
  }
}

/**
 * Format number with commas for large numbers
 * @param num - Number, bigint, or string to format
 * @returns Formatted string with commas
 */
export function formatNumber(num: number | bigint | string): string {
  // Convert to string if it's a bigint or number
  const numStr = typeof num === "string" ? num : num.toString();
  
  // Handle bigint or large number strings
  if (typeof num === "bigint" || (typeof num === "string" && /^\d+$/.test(num))) {
    return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
  
  // Handle regular numbers
  if (typeof num === "number" && Number.isInteger(num)) {
    return num.toLocaleString("en-US");
  }
  
  // Handle decimal numbers
  const parts = numStr.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

/**
 * Format percentage value
 * @param value - Current value
 * @param total - Total value
 * @returns Formatted percentage string with 1 decimal place
 */
export function formatPercentage(value: number, total: number): string {
  if (total === 0) {
    return "0.0";
  }
  const percentage = (value / total) * 100;
  return percentage.toFixed(1);
}

/**
 * Recursively convert BigInt values to strings for JSON serialization
 * This is needed because JSON.stringify cannot serialize BigInt values
 * @param obj - Object that may contain BigInt values
 * @returns Object with BigInt values converted to strings
 */
export function serializeBigInt(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === "bigint") {
    return obj.toString();
  }

  if (Array.isArray(obj)) {
    return obj.map(serializeBigInt);
  }

  if (typeof obj === "object") {
    const result: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = serializeBigInt(obj[key]);
      }
    }
    return result;
  }

  return obj;
}

/**
 * Convert a string or BigInt to BigInt
 * Helper function to handle serialized BigInt values from React Query
 * @param value - String or BigInt value
 * @returns BigInt value
 */
export function toBigInt(value: string | bigint | number): bigint {
  if (typeof value === "bigint") {
    return value;
  }
  if (typeof value === "number") {
    return BigInt(value);
  }
  if (typeof value === "string") {
    try {
      return BigInt(value);
    } catch {
      return BigInt(0);
    }
  }
  return BigInt(0);
}

