"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ILENOID_CONTRACT_INTERFACE } from "@/lib/contract";
import { callContractFunction, ClarityValues } from "@/lib/stacks-contract";
import toast from "react-hot-toast";

/**
 * Hook to register an NGO (owner only)
 */
export function useRegisterNGO(): {
  registerNGO: (ngoAddress: string) => Promise<void>;
  txId: string | undefined;
  isPending: boolean;
  isSuccess: boolean;
  error: Error | null;
} {
  const queryClient = useQueryClient();

  const {
    mutate: registerNGO,
    data: txId,
    isPending,
    isSuccess,
    error,
  } = useMutation({
    mutationFn: async (ngoAddress: string) => {
      const txId = await callContractFunction(
        ILENOID_CONTRACT_INTERFACE.public.registerNGO,
        [ClarityValues.principal(ngoAddress)]
      );

      return txId;
    },
    onSuccess: (txId) => {
      toast.success(`NGO registered! TX: ${txId.substring(0, 8)}...`);
      queryClient.invalidateQueries({ queryKey: ["isVerifiedNGO"] });
    },
    onError: (error: Error) => {
      toast.error(`Registration failed: ${error.message}`);
    },
  });

  return {
    registerNGO: async (ngoAddress: string) => {
      await registerNGO(ngoAddress);
    },
    txId,
    isPending,
    isSuccess,
    error: error as Error | null,
  };
}
