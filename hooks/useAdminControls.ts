"use client";

import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { CHARITY_TRACKER_ADDRESS, CHARITY_TRACKER_ABI } from "@/lib/contract";
import { type Address } from "viem";
import { useEffect } from "react";
import toast from "react-hot-toast";

/**
 * Hook to manage Admin Emergency Controls (Pause, Unpause, Emergency Withdraw)
 */
export function useAdminControls() {
  const queryClient = useQueryClient();

  // Read Pause State
  const { data: isPaused, isLoading: isLoadingPauseState, refetch: refetchPauseState } = useReadContract({
    address: CHARITY_TRACKER_ADDRESS,
    abi: CHARITY_TRACKER_ABI,
    functionName: "paused",
  });

  // Write Hook
  const {
    data: hash,
    writeContract,
    isPending,
    isError: isWriteError,
    error: writeError,
  } = useWriteContract();

  // Transaction Receipt
  const {
    isLoading: isConfirming,
    isSuccess,
    isError: isReceiptError,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash,
  });

  // Action: Pause Contract
  const pauseContract = async () => {
    try {
      writeContract({
        address: CHARITY_TRACKER_ADDRESS,
        abi: CHARITY_TRACKER_ABI,
        functionName: "pause",
      });
    } catch (error) {
      console.error("Error pausing contract:", error);
      toast.error("Failed to pause contract");
    }
  };

  // Action: Unpause Contract
  const unpauseContract = async () => {
    try {
      writeContract({
        address: CHARITY_TRACKER_ADDRESS,
        abi: CHARITY_TRACKER_ABI,
        functionName: "unpause",
      });
    } catch (error) {
      console.error("Error unpausing contract:", error);
      toast.error("Failed to unpause contract");
    }
  };

  // Action: Emergency Withdraw
  const emergencyWithdraw = async (projectId: bigint) => {
    try {
      writeContract({
        address: CHARITY_TRACKER_ADDRESS,
        abi: CHARITY_TRACKER_ABI,
        functionName: "emergencyWithdraw",
        args: [projectId],
      });
    } catch (error) {
      console.error("Error withdrawing funds:", error);
      toast.error("Failed to withdraw funds");
    }
  };

  // Handle success
  useEffect(() => {
    if (isSuccess && hash) {
      toast.success("Transaction completed successfully!");
      // Invalidate queries to refresh contract state
      queryClient.invalidateQueries({ queryKey: ["paused"] });
      // Refetch paused state immediately
      refetchPauseState();
    }
  }, [isSuccess, hash, queryClient, refetchPauseState]);

  // Handle errors
  useEffect(() => {
    if (isWriteError && writeError) {
      toast.error(writeError.message || "Transaction failed");
    }
    if (isReceiptError && receiptError) {
      toast.error("Transaction failed");
    }
  }, [isWriteError, writeError, isReceiptError, receiptError]);

  return {
    isPaused: isPaused as boolean,
    isLoadingPauseState,
    pauseContract,
    unpauseContract,
    emergencyWithdraw,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    isError: isWriteError || isReceiptError,
    error: writeError || receiptError,
  };
}
