"use client";

import { useConnection, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CHARITY_TRACKER_ADDRESS, CHARITY_TRACKER_ABI } from "@/lib/contract";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { parseContractError } from "@/lib/errors";

/**
 * Hook for releasing funds (NGO only)
 * @param projectId - The project ID
 * @returns Release function, transaction hash, loading states, success state, and error
 */
export function useReleaseFunds(projectId: number | bigint): {
  releaseFunds: () => Promise<void>;
  hash: `0x${string}` | undefined;
  isPending: boolean;
  isConfirming: boolean;
  isSuccess: boolean;
  error: Error | null;
} {
  const { address } = useConnection();
  const queryClient = useQueryClient();
  const writeContract = useWriteContract();
  const hash = writeContract.data;
  const isPending = writeContract.isPending;
  const writeError = writeContract.error;
  const {
    isLoading: isConfirming,
    isSuccess,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash,
  });

  const prevSuccessRef = useRef(false);
  const prevErrorRef = useRef<Error | null>(null);

  const releaseFunds = async () => {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    try {
      await writeContract.mutate({
        address: CHARITY_TRACKER_ADDRESS,
        abi: CHARITY_TRACKER_ABI,
        functionName: "releaseFunds",
        args: [BigInt(projectId)],
      });
    } catch (error) {
      // Error is handled by writeError
      console.error("Release funds error:", error);
    }
  };

  // Show toast notifications on success/error changes
  useEffect(() => {
    if (isSuccess && !prevSuccessRef.current) {
      toast.success("Funds released successfully!");
      // Invalidate project queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["voteStatus", projectId] });
      prevSuccessRef.current = true;
    }
  }, [isSuccess, projectId, queryClient]);

  useEffect(() => {
    const currentError = writeError || receiptError;
    if (currentError && currentError !== prevErrorRef.current) {
      const errorMessage = parseContractError(currentError);
      toast.error(errorMessage);
      prevErrorRef.current = currentError;
    }
  }, [writeError, receiptError]);

  // Reset refs when transaction starts
  useEffect(() => {
    if (isPending) {
      prevSuccessRef.current = false;
      prevErrorRef.current = null;
    }
  }, [isPending]);

  return {
    releaseFunds,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error: writeError || receiptError,
  };
}

