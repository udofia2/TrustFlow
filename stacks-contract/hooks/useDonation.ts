"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ILENOID_CONTRACT_INTERFACE } from "@/lib/contract";
import { callReadOnlyFunction, callContractFunction, ClarityValues } from "@/lib/stacks-contract";
import { getStxAddress } from "@/lib/stacks-connect";
import { useEffect, useRef } from "react";
import toast from "react-hot-toast";

/**
 * Hook to fetch donor contribution
 */
export function useDonorContribution(
  projectId: number | bigint,
  donorAddress: string | undefined
): {
  contribution: bigint;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
} {
  const senderAddress = getStxAddress();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["donorContribution", Number(projectId), donorAddress],
    queryFn: async () => {
      if (!donorAddress) return BigInt(0);

      const result = await callReadOnlyFunction(
        ILENOID_CONTRACT_INTERFACE.readOnly.getDonorContribution,
        [
          ClarityValues.uint(Number(projectId)),
          ClarityValues.principal(donorAddress),
        ],
        senderAddress || undefined
      );

      const contribution = BigInt(result.value || result || 0);
      // Serialize BigInt to string for React Query
      return contribution.toString();
    },
    enabled: projectId > 0 && !!donorAddress && !!senderAddress,
  });

  // Convert serialized string back to BigInt
  const contribution = data ? BigInt(data) : BigInt(0);

  return {
    contribution,
    isLoading,
    isError,
    error: error as Error | null,
  };
}

/**
 * Hook for STX donations
 */
export function useDonateSTX(projectId: number | bigint): {
  donate: (amount: string) => Promise<void>;
  txId: string | undefined;
  isPending: boolean;
  isSuccess: boolean;
  error: Error | null;
} {
  const queryClient = useQueryClient();
  const prevSuccessRef = useRef(false);

  const {
    mutate: donate,
    data: txId,
    isPending,
    isSuccess,
    error,
  } = useMutation({
    mutationFn: async (amount: string) => {
      // Convert amount to microSTX (1 STX = 1,000,000 microSTX)
      const amountMicroSTX = BigInt(Math.floor(parseFloat(amount) * 1_000_000));
      const senderAddress = getStxAddress();
      
      if (!senderAddress) {
        throw new Error("Wallet not connected");
      }

      // Call the donate function with STX amount parameter
      // The contract will use stx-transfer? to transfer from sender to contract
      const { callContractFunctionWithSTX } = await import("@/lib/stacks-contract");
      const txId = await callContractFunctionWithSTX(
        ILENOID_CONTRACT_INTERFACE.public.donate,
        [
          ClarityValues.uint(Number(projectId)),
          ClarityValues.uint(Number(amountMicroSTX)),
        ],
        amountMicroSTX,
        senderAddress
      );

      return txId;
    },
    onSuccess: (txId) => {
      toast.success(`Donation transaction submitted! TX: ${txId.substring(0, 8)}...`);
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["project", Number(projectId)] });
      queryClient.invalidateQueries({ queryKey: ["allProjects"] });
      queryClient.invalidateQueries({ queryKey: ["donorContribution", Number(projectId)] });
    },
    onError: (error: Error) => {
      toast.error(`Donation failed: ${error.message}`);
    },
  });

  // Show success toast only once
  useEffect(() => {
    if (isSuccess && !prevSuccessRef.current) {
      prevSuccessRef.current = true;
    } else if (!isSuccess) {
      prevSuccessRef.current = false;
    }
  }, [isSuccess]);

  return {
    donate: async (amount: string) => {
      await donate(amount);
    },
    txId,
    isPending,
    isSuccess,
    error: error as Error | null,
  };
}

/**
 * Hook for ETH donations (compatibility alias)
 * Note: Stacks uses STX, not ETH. This is an alias for useDonateSTX.
 */
export function useDonateETH(projectId: number | bigint) {
  return useDonateSTX(projectId);
}

/**
 * Hook for ERC20 token donations (compatibility alias)
 * Note: Stacks doesn't support ERC20 tokens. This is an alias for useDonateSTX.
 * For Stacks-native tokens, use useDonateSTX directly.
 */
export function useDonateERC20(projectId: number | bigint) {
  return useDonateSTX(projectId);
}

