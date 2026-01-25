"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { CHARITY_TRACKER_ADDRESS, CHARITY_TRACKER_ABI } from "@/lib/contract";
import { type Address } from "viem";
import { useEffect } from "react";
import toast from "react-hot-toast";

/**
 * Hook to register an NGO on the smart contract
 * @param ngoAddress - The NGO address to register
 * @returns Registration function, loading states, and transaction hash
 */
export function useRegisterNGO(ngoAddress?: Address) {
  const queryClient = useQueryClient();

  const {
    data: hash,
    writeContract,
    isPending,
    isError: isWriteError,
    error: writeError,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess,
    isError: isReceiptError,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash,
  });

  const registerNGO = async (address: Address) => {
    try {
      writeContract({
        address: CHARITY_TRACKER_ADDRESS,
        abi: CHARITY_TRACKER_ABI,
        functionName: "registerNGO",
        args: [address],
      });
    } catch (error) {
      console.error("Error registering NGO:", error);
      toast.error("Failed to register NGO");
    }
  };

  // Handle success
  useEffect(() => {
    if (isSuccess && hash) {
      toast.success("NGO registered successfully!");
      // Invalidate queries to refresh NGO status
      queryClient.invalidateQueries({ queryKey: ["isVerifiedNGO"] });
    }
  }, [isSuccess, hash, queryClient]);

  // Handle errors
  useEffect(() => {
    if (isWriteError && writeError) {
      toast.error(writeError.message || "Failed to register NGO");
    }
    if (isReceiptError && receiptError) {
      toast.error("Transaction failed");
    }
  }, [isWriteError, writeError, isReceiptError, receiptError]);

  return {
    registerNGO,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    isError: isWriteError || isReceiptError,
    error: writeError || receiptError,
  };
}

