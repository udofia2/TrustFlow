"use client";

import { useQuery } from "@tanstack/react-query";
import { callReadOnlyFunction } from "@/lib/stacks-contract";
import { getStxAddress } from "@/lib/stacks-connect";
import { useConnection } from "./useConnection";

/**
 * Hook to get contract owner address
 * Note: In Clarity, we can read data variables directly
 */
export function useContractOwner(): {
  owner: string | undefined;
  isOwner: boolean;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
} {
  const senderAddress = getStxAddress();
  const { address } = useConnection();

  // Note: This would need to be implemented in the contract as a read-only function
  // For now, we'll return undefined as the contract doesn't expose this directly
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["contractOwner"],
    queryFn: async () => {
      // If contract has a get-owner function, call it here
      // For now, return undefined
      return undefined;
    },
    enabled: false, // Disabled until contract exposes owner
  });

  // Check if current address is the owner
  const addressStr = address ? String(address) : null;
  const dataStr = data ? String(data) : null;
  const isOwner = !!addressStr && !!dataStr && addressStr.toLowerCase() === dataStr.toLowerCase();

  return {
    owner: data,
    isOwner,
    isLoading,
    isError,
    error: error as Error | null,
  };
}
