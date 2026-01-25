"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { CHARITY_TRACKER_ADDRESS, CHARITY_TRACKER_ABI } from "@/lib/contract";
import { type Address } from "viem";
import { useEffect } from "react";
import toast from "react-hot-toast";

/**
 * Hook to revoke an NGO's verification status
 * @param ngoAddress - The NGO address to revoke
 * @returns Revocation function, loading states, and transaction hash
 */
export function useRevokeNGO(ngoAddress?: Address) {
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

  const revokeNGO = async (address: Address) => {
    try {
      writeContract({
        address: CHARITY_TRACKER_ADDRESS,
        abi: CHARITY_TRACKER_ABI,
        functionName: "revokeNGO",
        args: [address],
      });
    } catch (error) {
      console.error("Error revoking NGO:", error);
      toast.error("Failed to revoke NGO");
    }
  };

  // Handle success
  useEffect(() => {
    if (isSuccess && hash) {
      toast.success("NGO verification revoked successfully!");
      // Invalidate queries to refresh NGO status
      queryClient.invalidateQueries({ queryKey: ["isVerifiedNGO"] });
    }
  }, [isSuccess, hash, queryClient]);

  // Handle errors
  useEffect(() => {
    if (isWriteError && writeError) {
      toast.error(writeError.message || "Failed to revoke NGO");
    }
    if (isReceiptError && receiptError) {
      toast.error("Transaction failed");
    }
  }, [isWriteError, writeError, isReceiptError, receiptError]);

  return {
    revokeNGO,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    isError: isWriteError || isReceiptError,
    error: writeError || receiptError,
  };
}

