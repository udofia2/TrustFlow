"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ILENOID_CONTRACT_INTERFACE } from "@/lib/contract";
import { callContractFunction, ClarityValues } from "@/lib/stacks-contract";
import toast from "react-hot-toast";

/**
 * Hook to revoke NGO status (owner only)
 */
export function useRevokeNGO(): {
  revokeNGO: (ngoAddress: string) => Promise<void>;
  txId: string | undefined;
  isPending: boolean;
  isSuccess: boolean;
  error: Error | null;
} {
  const queryClient = useQueryClient();

  const {
    mutate: revokeNGO,
    data: txId,
    isPending,
    isSuccess,
    error,
  } = useMutation({
    mutationFn: async (ngoAddress: string) => {
      const txId = await callContractFunction(
        ILENOID_CONTRACT_INTERFACE.public.revokeNGO,
        [ClarityValues.principal(ngoAddress)]
      );

      return txId;
    },
    onSuccess: (txId) => {
      toast.success(`NGO revoked! TX: ${txId.substring(0, 8)}...`);
      queryClient.invalidateQueries({ queryKey: ["isVerifiedNGO"] });
    },
    onError: (error: Error) => {
      toast.error(`Revocation failed: ${error.message}`);
    },
  });

  return {
    revokeNGO: async (ngoAddress: string) => {
      await revokeNGO(ngoAddress);
    },
    txId,
    isPending,
    isSuccess,
    error: error as Error | null,
  };
}
