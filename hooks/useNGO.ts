"use client";

import { useConnection, useReadContract } from "wagmi";
import { CHARITY_TRACKER_ADDRESS, CHARITY_TRACKER_ABI } from "@/lib/contract";
import { type Address } from "viem";

/**
 * Hook to check if an address is a verified NGO
 * @param ngoAddress - The NGO address to check
 * @returns Verification status, loading state, and error state
 */
export function useIsVerifiedNGO(ngoAddress: Address | undefined): {
  isVerified: boolean;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
} {
  const { data, isLoading, isError, error } = useReadContract({
    address: CHARITY_TRACKER_ADDRESS,
    abi: CHARITY_TRACKER_ABI,
    functionName: "isVerifiedNGO",
    args: ngoAddress ? [ngoAddress] : undefined,
    query: {
      enabled: !!ngoAddress,
    },
  });

  // Return boolean (default to false if not verified or error)
  const isVerified: boolean = (data as boolean | undefined) ?? false;

  return {
    isVerified,
    isLoading,
    isError,
    error,
  };
}

