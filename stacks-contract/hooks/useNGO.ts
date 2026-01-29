"use client";

import { useQuery } from "@tanstack/react-query";
import { ILENOID_CONTRACT_INTERFACE } from "@/lib/contract";
import { callReadOnlyFunction, ClarityValues } from "@/lib/stacks-contract";
import { getStxAddress } from "@/lib/stacks-connect";

/**
 * Hook to check if an address is a verified NGO
 */
export function useIsVerifiedNGO(ngoAddress?: string): {
  isVerified: boolean;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
} {
  const senderAddress = getStxAddress();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["isVerifiedNGO", ngoAddress],
    queryFn: async () => {
      if (!ngoAddress) return false;

      const result = await callReadOnlyFunction(
        ILENOID_CONTRACT_INTERFACE.readOnly.isVerifiedNGO,
        [ClarityValues.principal(ngoAddress)],
        senderAddress || undefined
      );

      return result.value || result || false;
    },
    enabled: !!ngoAddress && !!senderAddress,
  });

  return {
    isVerified: data || false,
    isLoading,
    isError,
    error: error as Error | null,
  };
}

/**
 * Hook to check if current user is a verified NGO
 */
export function useCurrentUserIsVerifiedNGO(): {
  isVerified: boolean;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
} {
  const currentAddress = getStxAddress();
  return useIsVerifiedNGO(currentAddress || undefined);
}
