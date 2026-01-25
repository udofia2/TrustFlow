"use client";

import { useState } from "react";
import { useConnection } from "wagmi";
import { type Address } from "viem";
import { useProject, useCurrentMilestone } from "@/hooks/useProject";
import { useMilestoneVoteStatus } from "@/hooks/useVoting";
import { useReleaseFunds } from "@/hooks/useReleaseFunds";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { formatEther, formatUSDC } from "@/lib/utils";
import { isAddress } from "viem";
import { USDC_ADDRESS } from "@/lib/contract";

export interface ReleaseFundsButtonProps {
  projectId: number | bigint;
}

/**
 * ReleaseFundsButton component for NGOs to release funds
 */
export function ReleaseFundsButton({ projectId }: ReleaseFundsButtonProps) {
  const { address } = useConnection();
  const { project, isLoading: isLoadingProject } = useProject(projectId);
  const { milestone: currentMilestone, isLoading: isLoadingMilestone } = useCurrentMilestone(projectId);
  const { voteStatus, quorumMet, isLoading: isLoadingVoteStatus } = useMilestoneVoteStatus(
    projectId,
    project?.currentMilestone ?? BigInt(0)
  );
  const { releaseFunds, isPending, isConfirming } = useReleaseFunds(projectId);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  const isLoading = isLoadingProject || isLoadingMilestone || isLoadingVoteStatus;

  // Check if user is the project's NGO
  const isNGO = address && project && address.toLowerCase() === project.ngo.toLowerCase();

  // Check if milestone can be released
  const canRelease =
    isNGO &&
    project &&
    currentMilestone &&
    quorumMet &&
    project.balance >= currentMilestone.amountRequested &&
    !currentMilestone.fundsReleased &&
    !currentMilestone.approved;

  if (isLoading) {
    return null;
  }

  if (!isNGO) {
    return null;
  }

  if (!canRelease) {
    return null;
  }

  const handleRelease = () => {
    setShowConfirmModal(true);
  };

  const handleConfirm = async () => {
    setShowConfirmModal(false);
    await releaseFunds();
  };

  return (
    <>
      <Button
        variant="primary"
        onClick={handleRelease}
        isLoading={isPending || isConfirming}
        disabled={isPending || isConfirming}
        className="bg-emerald-green hover:bg-emerald-green-hover"
      >
        {isPending ? "Confirming..." : isConfirming ? "Releasing Funds..." : "Release Funds"}
      </Button>

      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirm Fund Release"
      >
        <div className="space-y-4">
          <p className="text-slate-grey">
            Are you sure you want to release funds for the current milestone?
          </p>
          {currentMilestone && project && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-slate-grey opacity-70 mb-2">Milestone Details:</p>
              <p className="text-slate-grey font-medium">{currentMilestone.description}</p>
              <p className="text-sm text-slate-grey mt-2">
                Amount:{" "}
                {(() => {
                  const isETH =
                    project.donationToken === "0x0000000000000000000000000000000000000000" ||
                    !isAddress(project.donationToken);
                  const isUSDC =
                    project.donationToken.toLowerCase() === USDC_ADDRESS.toLowerCase();
                  const formatted = isETH
                    ? `${formatEther(currentMilestone.amountRequested)} ETH`
                    : isUSDC
                    ? `${formatUSDC(currentMilestone.amountRequested)} USDC`
                    : `${formatEther(currentMilestone.amountRequested)} tokens`;
                  return formatted;
                })()}
              </p>
            </div>
          )}
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => setShowConfirmModal(false)}
              disabled={isPending || isConfirming}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirm}
              isLoading={isPending || isConfirming}
              disabled={isPending || isConfirming}
              className="bg-emerald-green hover:bg-emerald-green-hover"
            >
              Confirm Release
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

