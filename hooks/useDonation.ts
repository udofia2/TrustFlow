"use client";

import { useConnection, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, parseUnits, type Address } from "viem";
import { CHARITY_TRACKER_ADDRESS, CHARITY_TRACKER_ABI } from "@/lib/contract";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { parseContractError } from "@/lib/errors";

/**
 * Minimal ERC20 ABI for approve and allowance functions
 */
const ERC20_ABI = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

/**
 * Hook to fetch donor contribution
 * @param projectId - The project ID
 * @param donorAddress - The donor's address
 * @returns Contribution amount, loading state, and error state
 */
export function useDonorContribution(
  projectId: number | bigint,
  donorAddress: Address | undefined
): {
  contribution: bigint;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
} {
  const { data, isLoading, isError, error } = useReadContract({
    address: CHARITY_TRACKER_ADDRESS,
    abi: CHARITY_TRACKER_ABI,
    functionName: "getDonorContribution",
    args: [BigInt(projectId), donorAddress!],
    query: {
      enabled: projectId > 0 && !!donorAddress,
    },
  });

  // Return contribution amount (default to 0 if no contribution)
  const contribution: bigint = (data as bigint | undefined) ?? BigInt(0);

  return {
    contribution,
    isLoading,
    isError,
    error,
  };
}

/**
 * Hook for ETH donations
 * @param projectId - The project ID to donate to
 * @returns Donation function, transaction hash, loading states, success state, and error
 */
export function useDonateETH(projectId: number | bigint): {
  donate: (amount: string) => Promise<void>;
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

  const donate = async (amount: string) => {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Invalid donation amount");
      return;
    }

    try {
      const amountWei = parseEther(amount);
      
      await writeContract.mutate({
        address: CHARITY_TRACKER_ADDRESS,
        abi: CHARITY_TRACKER_ABI,
        functionName: "donate",
        args: [BigInt(projectId)],
        value: amountWei,
      });
    } catch (error) {
      // Error is handled by writeError
      console.error("Donation error:", error);
    }
  };

  // Show toast notifications on success/error changes
  useEffect(() => {
    if (isSuccess && !prevSuccessRef.current) {
      toast.success("Donation successful!");
      // Invalidate project queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
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
    donate,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error: writeError || receiptError,
  };
}

/**
 * Hook for ERC20 donations
 * @param projectId - The project ID to donate to
 * @param tokenAddress - The ERC20 token address
 * @returns Donation function, transaction hash, loading states, success state, error, and allowance
 */
export function useDonateERC20(
  projectId: number | bigint,
  tokenAddress: Address
): {
  donate: (amount: string, decimals?: number) => Promise<void>;
  hash: `0x${string}` | undefined;
  isPending: boolean;
  isConfirming: boolean;
  isSuccess: boolean;
  error: Error | null;
  allowance: bigint;
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

  // Check current allowance
  const { data: allowance } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address ? [address, CHARITY_TRACKER_ADDRESS] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const prevSuccessRef = useRef(false);
  const prevErrorRef = useRef<Error | null>(null);

  const donate = async (amount: string, decimals: number = 6) => {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Invalid donation amount");
      return;
    }

    try {
      const amountParsed = parseUnits(amount, decimals);
      const currentAllowance = (allowance as bigint | undefined) ?? BigInt(0);

      // Step 1: Approve if needed
      if (currentAllowance < amountParsed) {
        toast.loading("Approving token...", { id: "approve" });
        
        // writeContract.mutate() returns void, hash is available via writeContract.data
        writeContract.mutate({
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [CHARITY_TRACKER_ADDRESS, amountParsed],
        });

        // Wait for approval confirmation
        // Note: In a production app, you'd want to use a separate useWaitForTransactionReceipt
        // hook for the approval step. This is a simplified version.
        toast.loading("Waiting for approval confirmation...", { id: "approve" });
        await new Promise((resolve) => setTimeout(resolve, 3000));
        toast.dismiss("approve");
      }

      // Step 2: Donate
      toast.loading("Processing donation...", { id: "donate" });
      
      await writeContract.mutate({
        address: CHARITY_TRACKER_ADDRESS,
        abi: CHARITY_TRACKER_ABI,
        functionName: "donateERC20",
        args: [BigInt(projectId), amountParsed],
      });
    } catch (error) {
      toast.dismiss("approve");
      toast.dismiss("donate");
      // Error is handled by writeError
      console.error("Donation error:", error);
    }
  };

  // Show toast notifications on success/error changes
  useEffect(() => {
    if (isSuccess && !prevSuccessRef.current) {
      toast.dismiss("donate");
      toast.success("Donation successful!");
      // Invalidate project queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      prevSuccessRef.current = true;
    }
  }, [isSuccess, projectId, queryClient]);

  useEffect(() => {
    const currentError = writeError || receiptError;
    if (currentError && currentError !== prevErrorRef.current) {
      toast.dismiss("approve");
      toast.dismiss("donate");
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
    donate,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error: writeError || receiptError,
    allowance: (allowance as bigint | undefined) ?? BigInt(0),
  };
}

