"use client";

import { useConnection, useReadContract } from "wagmi";
import { CHARITY_TRACKER_ADDRESS, CHARITY_TRACKER_ABI } from "@/lib/contract";
import { type Address } from "viem";

/**
 * Hook to check if the current connected address is the contract owner
 * @returns Owner address, whether current user is owner, loading state, and error state
 */
export function useContractOwner(): {
  owner: Address | undefined;
  isOwner: boolean;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
} {
  const { address } = useConnection();

  const { data: owner, isLoading, isError, error } = useReadContract({
    address: CHARITY_TRACKER_ADDRESS,
    abi: CHARITY_TRACKER_ABI,
    functionName: "owner",
  });

  const isOwner = address && owner ? address.toLowerCase() === (owner as Address).toLowerCase() : false;

  return {
    owner: owner as Address | undefined,
    isOwner,
    isLoading,
    isError,
    error,
  };
}

