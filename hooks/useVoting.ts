"use client";

import { useReadContract, useConnection, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CHARITY_TRACKER_ADDRESS, CHARITY_TRACKER_ABI } from "@/lib/contract";
import { type VoteStatus } from "@/types/contract";
import { formatPercentage } from "@/lib/utils";
import { type Address } from "viem";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { parseContractError } from "@/lib/errors";

/**
 * Type guard to check if data is a tuple/array
 */
function isTuple(data: unknown): data is unknown[] {
  return Array.isArray(data);
}

/**
 * Safely transform contract vote status data to VoteStatus type
 */
function transformVoteStatusData(data: unknown): VoteStatus | null {
  if (!isTuple(data) || data.length < 3) {
    return null;
  }

  return {
    voteWeight: data[0] as bigint,
    snapshot: data[1] as bigint,
    canRelease: data[2] as boolean,
  };
}

/**
 * Hook to fetch milestone voting status
 * @param projectId - The project ID
 * @param milestoneId - The milestone ID
 * @returns Vote status, quorum percentage, quorum met status, loading state, and error state
 */
export function useMilestoneVoteStatus(
  projectId: number | bigint,
  milestoneId: number | bigint
): {
  voteStatus: VoteStatus | undefined;
  quorumPercentage: string;
  quorumMet: boolean;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
} {
  const { data, isLoading, isError, error } = useReadContract({
    address: CHARITY_TRACKER_ADDRESS,
    abi: CHARITY_TRACKER_ABI,
    functionName: "getMilestoneVoteStatus",
    args: [BigInt(projectId), BigInt(milestoneId)],
    query: {
      enabled: projectId > 0 && milestoneId > 0,
    },
  });

  // Transform the contract response to VoteStatus type
  const voteStatus: VoteStatus | undefined = data
    ? transformVoteStatusData(data) ?? undefined
    : undefined;

  // Calculate quorum percentage (voteWeight / snapshot * 100)
  const quorumPercentage =
    voteStatus && voteStatus.snapshot > BigInt(0)
      ? formatPercentage(
          Number(voteStatus.voteWeight),
          Number(voteStatus.snapshot)
        )
      : "0.0";

  // Check if quorum is met (>50%)
  const quorumMet: boolean =
    !!voteStatus &&
    voteStatus.snapshot > BigInt(0) &&
    voteStatus.voteWeight > voteStatus.snapshot / BigInt(2);

  return {
    voteStatus,
    quorumPercentage,
    quorumMet,
    isLoading,
    isError,
    error,
  };
}

/**
 * Hook to check if a donor has voted on a milestone
 * @param projectId - The project ID
 * @param milestoneId - The milestone ID
 * @param donorAddress - The donor's address
 * @returns Whether the donor has voted, loading state, and error state
 */
export function useHasVoted(
  projectId: number | bigint,
  milestoneId: number | bigint,
  donorAddress: Address | undefined
): {
  hasVoted: boolean;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
} {
  const { data, isLoading, isError, error } = useReadContract({
    address: CHARITY_TRACKER_ADDRESS,
    abi: CHARITY_TRACKER_ABI,
    functionName: "hasDonorVoted",
    args: [BigInt(projectId), BigInt(milestoneId), donorAddress!],
    query: {
      enabled: projectId > 0 && milestoneId >= 0 && !!donorAddress,
    },
  });

  // Return boolean (default to false if not voted or error)
  const hasVoted: boolean = (data as boolean | undefined) ?? false;

  return {
    hasVoted,
    isLoading,
    isError,
    error,
  };
}

/**
 * Hook for voting on milestones
 * @param projectId - The project ID
 * @returns Vote function, transaction hash, loading states, success state, and error
 */
export function useVoteMilestone(projectId: number | bigint): {
  vote: () => Promise<void>;
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

  const vote = async () => {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    try {
      await writeContract.mutate({
        address: CHARITY_TRACKER_ADDRESS,
        abi: CHARITY_TRACKER_ABI,
        functionName: "voteMilestone",
        args: [BigInt(projectId)],
      });
    } catch (error) {
      // Error is handled by writeError
      console.error("Vote error:", error);
    }
  };

  // Show toast notifications on success/error changes
  useEffect(() => {
    if (isSuccess && !prevSuccessRef.current) {
      toast.success("Vote recorded successfully!");
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
    vote,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error: writeError || receiptError,
  };
}

