"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ILENOID_CONTRACT_INTERFACE } from "@/lib/contract";
import { callReadOnlyFunction, callContractFunction, ClarityValues } from "@/lib/stacks-contract";
import { getStxAddress } from "@/lib/stacks-connect";
import { useProject, useProjectMilestones } from "./useProject";
import toast from "react-hot-toast";

/**
 * Hook to check if a donor has voted on a milestone
 */
export function useHasVoted(
  projectId: number | bigint,
  milestoneId: number | bigint
): {
  hasVoted: boolean;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
} {
  const senderAddress = getStxAddress();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["hasVoted", Number(projectId), Number(milestoneId), senderAddress],
    queryFn: async () => {
      if (!senderAddress) return false;

      const result = await callReadOnlyFunction(
        ILENOID_CONTRACT_INTERFACE.readOnly.hasDonorVoted,
        [
          ClarityValues.uint(Number(projectId)),
          ClarityValues.uint(Number(milestoneId)),
          ClarityValues.principal(senderAddress),
        ],
        senderAddress
      );

      return result.value || result || false;
    },
    enabled: projectId > 0 && milestoneId >= 0 && !!senderAddress,
  });

  return {
    hasVoted: data || false,
    isLoading,
    isError,
    error: error as Error | null,
  };
}

/**
 * Hook to vote on a milestone
 */
export function useVoteOnMilestone(
  projectId: number | bigint,
  milestoneId: number | bigint
): {
  vote: (approve: boolean) => Promise<void>;
  txId: string | undefined;
  isPending: boolean;
  isSuccess: boolean;
  error: Error | null;
} {
  const queryClient = useQueryClient();

  const {
    mutate: vote,
    data: txId,
    isPending,
    isSuccess,
    error,
  } = useMutation({
    mutationFn: async (approve: boolean) => {
      const txId = await callContractFunction(
        ILENOID_CONTRACT_INTERFACE.public.voteOnMilestone,
        [
          ClarityValues.uint(Number(projectId)),
          ClarityValues.uint(Number(milestoneId)),
          ClarityValues.bool(approve),
        ]
      );

      return txId;
    },
    onSuccess: (txId) => {
      toast.success(`Vote submitted! TX: ${txId.substring(0, 8)}...`);
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["hasVoted", Number(projectId), Number(milestoneId)] });
      queryClient.invalidateQueries({ queryKey: ["projectMilestones", Number(projectId)] });
      queryClient.invalidateQueries({ queryKey: ["project", Number(projectId)] });
    },
    onError: (error: Error) => {
      toast.error(`Vote failed: ${error.message}`);
    },
  });

  return {
    vote: async (approve: boolean) => {
      await vote(approve);
    },
    txId,
    isPending,
    isSuccess,
    error: error as Error | null,
  };
}

/**
 * Hook to get milestone vote status
 * Returns voting information for a milestone including quorum status
 */
export function useMilestoneVoteStatus(
  projectId: number | bigint,
  milestoneId: number | bigint
): {
  voteStatus: {
    voteWeight: bigint;
    snapshot: bigint;
    canRelease: boolean;
  } | null;
  quorumPercentage: number;
  quorumMet: boolean;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
} {
  // Get project to access totalDonated (used as snapshot)
  const { project, isLoading: isLoadingProject } = useProject(projectId);
  
  // Get milestone to access voteWeight
  const { milestones, isLoading: isLoadingMilestones } = useProjectMilestones(projectId);
  
  const milestone = milestones[Number(milestoneId)];
  
  const isLoading = isLoadingProject || isLoadingMilestones;
  
  // Calculate vote status from milestone data
  // For Stacks, we use voteWeight from milestone and totalDonated from project as snapshot
  const snapshot = project?.totalDonated || BigInt(0);
  const voteWeight = milestone?.voteWeight || BigInt(0);
  
  // Quorum is >50% of snapshot
  const quorumThreshold = snapshot / BigInt(2);
  const quorumMet = voteWeight > quorumThreshold && snapshot > BigInt(0);
  const quorumPercentage = snapshot > BigInt(0) 
    ? Number((voteWeight * BigInt(100)) / snapshot)
    : 0;
  
  const voteStatus = milestone && project ? {
    voteWeight,
    snapshot,
    canRelease: quorumMet && project.balance >= (milestone.amountRequested || BigInt(0)),
  } : null;

  return {
    voteStatus,
    quorumPercentage,
    quorumMet,
    isLoading,
    isError: false,
    error: null,
  };
}

/**
 * Hook to vote on a milestone (alias for useVoteOnMilestone)
 */
export function useVoteMilestone(
  projectId: number | bigint,
  milestoneId: number | bigint
) {
  return useVoteOnMilestone(projectId, milestoneId);
}
