"use client";

import { useConnection } from "wagmi";
import { useMilestoneVoteStatus } from "@/hooks/useVoting";
import { useHasVoted } from "@/hooks/useVoting";
import { useDonorContribution } from "@/hooks/useDonation";
import { useVoteMilestone } from "@/hooks/useVoting";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatEther, formatNumber } from "@/lib/utils";
import { parseContractError } from "@/lib/errors";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export interface VotingProgressProps {
  projectId: number | bigint;
  milestoneId: number | bigint;
}

/**
 * VotingProgress component for displaying voting progress and allowing votes
 */
export function VotingProgress({
  projectId,
  milestoneId,
}: VotingProgressProps) {
  const { address } = useConnection();
  const { voteStatus, quorumPercentage, quorumMet, isLoading: isLoadingStatus } =
    useMilestoneVoteStatus(projectId, milestoneId);
  const { hasVoted, isLoading: isLoadingVote } = useHasVoted(
    projectId,
    milestoneId,
    address
  );
  const { contribution, isLoading: isLoadingContribution } = useDonorContribution(
    projectId,
    address
  );
  const { vote, isPending, isConfirming, error: voteError } = useVoteMilestone(projectId);
  const [voteErrorMessage, setVoteErrorMessage] = useState<string>("");

  const isLoading = isLoadingStatus || isLoadingVote || isLoadingContribution;
  const canVote = address && contribution > BigInt(0) && !hasVoted && !isPending && !isConfirming;

  // Handle vote errors
  useEffect(() => {
    if (voteError) {
      const errorMessage = parseContractError(voteError);
      setVoteErrorMessage(errorMessage);
      toast.error(errorMessage);
    } else {
      setVoteErrorMessage("");
    }
  }, [voteError]);

  if (isLoading) {
    return (
      <Card variant="outlined">
        <CardBody>
          <div className="text-center py-4">
            <p className="text-slate-grey opacity-70">Loading voting status...</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (!voteStatus) {
    return (
      <Card variant="outlined">
        <CardBody>
          <div className="text-center py-4">
            <p className="text-slate-grey opacity-70">No voting data available</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  const voteWeight = Number(voteStatus.voteWeight);
  const snapshot = Number(voteStatus.snapshot);
  const progressPercentage = snapshot > 0 ? (voteWeight / snapshot) * 100 : 0;

  return (
    <Card variant="outlined">
      <CardBody>
        <h3 className="text-lg font-semibold text-slate-grey mb-4">
          Voting Progress
        </h3>

        <div className="space-y-4">
          {/* Vote stats */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-grey opacity-70 mb-1">Vote Weight:</p>
              <p className="font-semibold text-slate-grey">
                {formatNumber(voteWeight)}
              </p>
            </div>
            <div>
              <p className="text-slate-grey opacity-70 mb-1">Snapshot:</p>
              <p className="font-semibold text-slate-grey">
                {formatNumber(snapshot)}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-xs mb-2">
              <span className="text-slate-grey opacity-70">Quorum Progress</span>
              <span className="font-medium text-slate-grey">
                {quorumPercentage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${
                  quorumMet ? "bg-emerald-green" : "bg-bitcoin-orange"
                }`}
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
            </div>
            {quorumMet && (
              <p className="text-sm text-emerald-green font-medium mt-2">
                ✓ Quorum Met - Funds can be released
              </p>
            )}
          </div>

          {/* Vote button */}
          {address && (
            <div className="pt-4 border-t border-slate-grey border-opacity-20">
              {hasVoted ? (
                <p className="text-sm text-emerald-green font-medium">
                  ✓ You have voted on this milestone
                </p>
              ) : contribution === BigInt(0) ? (
                <p className="text-sm text-slate-grey opacity-70">
                  You need to contribute to vote on this milestone
                </p>
              ) : (
                <div className="space-y-2">
                  <Button
                    variant="primary"
                    onClick={() => {
                      setVoteErrorMessage("");
                      vote();
                    }}
                    isLoading={isPending || isConfirming}
                    disabled={isPending || isConfirming}
                    fullWidth
                  >
                    {isPending ? "Confirming..." : isConfirming ? "Processing..." : "Vote on Milestone"}
                  </Button>
                  {voteErrorMessage && (
                    <p className="text-xs text-charity-red text-center">
                      {voteErrorMessage}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {!address && (
            <div className="pt-4 border-t border-slate-grey border-opacity-20">
              <p className="text-sm text-slate-grey opacity-70 text-center">
                Connect your wallet to vote
              </p>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

