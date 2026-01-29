"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ILENOID_CONTRACT_INTERFACE } from "@/lib/contract";
import { callContractFunction, ClarityValues } from "@/lib/stacks-contract";
import toast from "react-hot-toast";

/**
 * Hook to release funds for a milestone
 */
export function useReleaseFunds(
  projectId: number | bigint,
  milestoneId: number | bigint
): {
  releaseFunds: () => Promise<void>;
  txId: string | undefined;
  isPending: boolean;
  isSuccess: boolean;
  error: Error | null;
} {
  const queryClient = useQueryClient();

  const {
    mutate: releaseFunds,
    data: txId,
    isPending,
    isSuccess,
    error,
  } = useMutation({
    mutationFn: async () => {
      const txId = await callContractFunction(
        ILENOID_CONTRACT_INTERFACE.public.releaseFunds,
        [
          ClarityValues.uint(Number(projectId)),
          ClarityValues.uint(Number(milestoneId)),
        ]
      );

      return txId;
    },
    onSuccess: (txId) => {
      toast.success(`Funds released! TX: ${txId.substring(0, 8)}...`);
      queryClient.invalidateQueries({ queryKey: ["project", Number(projectId)] });
      queryClient.invalidateQueries({ queryKey: ["projectMilestones", Number(projectId)] });
    },
    onError: (error: Error) => {
      toast.error(`Release failed: ${error.message}`);
    },
  });

  return {
    releaseFunds: async () => {
      await releaseFunds();
    },
    txId,
    isPending,
    isSuccess,
    error: error as Error | null,
  };
}
