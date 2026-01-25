"use client";

import { useConnection } from "wagmi";
import { type Address, isAddress } from "viem";
import { useDonorContribution } from "@/hooks/useDonation";
import { useProject } from "@/hooks/useProject";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatEther, formatUSDC } from "@/lib/utils";
import { USDC_ADDRESS } from "@/lib/contract";
import Link from "next/link";

export interface DonationHistoryProps {
  projectId: number | bigint;
}

/**
 * DonationHistory component for displaying donor's contribution history
 */
export function DonationHistory({ projectId }: DonationHistoryProps) {
  const { address, isConnected } = useConnection();
  const { contribution, isLoading, isError, error } = useDonorContribution(
    projectId,
    address
  );
  const { project } = useProject(projectId);

  if (!isConnected || !address) {
    return (
      <Card variant="outlined">
        <CardBody>
          <p className="text-center text-slate-grey opacity-70">
            Connect your wallet to view your donation history
          </p>
        </CardBody>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card variant="outlined">
        <CardBody>
          <div className="space-y-4">
            <Skeleton shape="text" height="1.5rem" width="40%" />
            <Skeleton shape="text" height="2rem" width="60%" />
          </div>
        </CardBody>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card variant="outlined">
        <CardBody>
          <div className="text-center py-4">
            <p className="text-charity-red mb-2">Failed to load donation history</p>
            <p className="text-sm text-slate-grey opacity-70">
              {error?.message || "An error occurred"}
            </p>
          </div>
        </CardBody>
      </Card>
    );
  }

  // Determine token type
  const donationToken = project?.donationToken || "0x0000000000000000000000000000000000000000";
  const isETH = donationToken === "0x0000000000000000000000000000000000000000" || !isAddress(donationToken);
  const isUSDC = donationToken.toLowerCase() === USDC_ADDRESS.toLowerCase();

  // Format contribution amount
  const formattedAmount = isETH
    ? formatEther(contribution)
    : isUSDC
    ? formatUSDC(contribution)
    : formatEther(contribution);

  const tokenName = isETH ? "ETH" : isUSDC ? "USDC" : "tokens";

  return (
    <Card variant="outlined">
      <CardBody>
        <h3 className="text-lg font-semibold text-slate-grey mb-4">
          Your Contribution
        </h3>

        {contribution === BigInt(0) ? (
          <EmptyState
            variant="no-donations"
            title="No contributions yet"
            description="Be the first to support this project!"
          />
        ) : (
          <div className="space-y-3">
            <div>
              <p className="text-sm text-slate-grey opacity-70 mb-1">
                Total Contribution:
              </p>
              <p className="text-2xl font-bold text-emerald-green">
                {formattedAmount} {tokenName}
              </p>
            </div>

            {/* Optional: Link to BaseScan for transaction history */}
            <div className="pt-3 border-t border-slate-grey border-opacity-20">
              <Link
                href={`https://sepolia.basescan.org/address/${address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-electric-purple hover:underline"
              >
                View on BaseScan →
              </Link>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

