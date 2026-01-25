"use client";

import { useParams, useRouter } from "next/navigation";
import { useProject, useProjectMilestones, useCurrentMilestone } from "@/hooks/useProject";
import { useConnection } from "wagmi";
import { ProjectCard } from "@/components/project/ProjectCard";
import { MilestoneCard } from "@/components/project/MilestoneCard";
import { VotingProgress } from "@/components/project/VotingProgress";
import { ReleaseFundsButton } from "@/components/project/ReleaseFundsButton";
import { DonateForm } from "@/components/donation/DonateForm";
import { DonationHistory } from "@/components/donation/DonationHistory";
import { WalletConnect } from "@/components/web3/WalletConnect";
import { NetworkSwitcher } from "@/components/web3/NetworkSwitcher";
import { Card, CardBody } from "@/components/ui/Card";
import {
  Skeleton,
  TextSkeleton,
  CardSkeleton,
  MilestoneCardSkeleton,
} from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatAddress, formatEther, formatUSDC, formatPercentage } from "@/lib/utils";
import { isAddress } from "viem";
import { USDC_ADDRESS } from "@/lib/contract";
import Link from "next/link";

/**
 * Project details page
 */
export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { address } = useConnection();

  // Get projectId from route params
  const projectIdParam = params.id as string;
  const projectId = projectIdParam ? BigInt(projectIdParam) : BigInt(0);

  // Fetch project data
  const { project, isLoading: isLoadingProject, isError: isErrorProject, error: projectError } = useProject(projectId);
  const { milestones, isLoading: isLoadingMilestones } = useProjectMilestones(projectId);
  const { milestone: currentMilestone, isLoading: isLoadingCurrentMilestone } = useCurrentMilestone(projectId);

  const isLoading = isLoadingProject || isLoadingMilestones || isLoadingCurrentMilestone;

  // Error state
  if (isErrorProject || !project) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-deep-blue text-white shadow-md">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="text-white hover:underline">
                ← Back to Projects
              </Link>
              <div className="flex items-center gap-4">
                <NetworkSwitcher />
                <WalletConnect />
              </div>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <Card variant="outlined">
            <CardBody>
              <div className="text-center py-12">
                <p className="text-charity-red text-xl font-semibold mb-2">
                  Project Not Found
                </p>
                <p className="text-slate-grey opacity-70 mb-4">
                  {projectError?.message || "The project you're looking for doesn't exist."}
                </p>
                <Link href="/">
                  <button className="px-6 py-2 bg-deep-blue text-white rounded-lg hover:bg-deep-blue-hover transition-colors">
                    Back to Projects
                  </button>
                </Link>
              </div>
            </CardBody>
          </Card>
        </main>
      </div>
    );
  }

  // Determine token type
  const isETH = project.donationToken === "0x0000000000000000000000000000000000000000" || !isAddress(project.donationToken);
  const isUSDC = project.donationToken.toLowerCase() === USDC_ADDRESS.toLowerCase();
  const tokenName = isETH ? "ETH" : isUSDC ? "USDC" : "tokens";

  // Format amounts
  const formattedGoal = isETH
    ? `${formatEther(project.goal)} ETH`
    : isUSDC
    ? `${formatUSDC(project.goal)} USDC`
    : `${formatEther(project.goal)} tokens`;

  const formattedDonated = isETH
    ? formatEther(project.totalDonated)
    : isUSDC
    ? formatUSDC(project.totalDonated)
    : formatEther(project.totalDonated);

  // Calculate progress
  const progressPercentage =
    project.goal > BigInt(0)
      ? formatPercentage(Number(project.totalDonated), Number(project.goal))
      : "0.0";

  // Status
  const status = project.isCompleted
    ? { label: "Completed", color: "bg-slate-grey" }
    : project.isActive
    ? { label: "Active", color: "bg-emerald-green" }
    : { label: "Inactive", color: "bg-slate-grey opacity-50" };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-deep-blue text-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <Link href="/" className="text-white hover:underline">
              ← Back to Projects
            </Link>
            <div className="flex items-center gap-4">
              <NetworkSwitcher />
              <WalletConnect />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Project Header */}
        {isLoadingProject ? (
          <Card variant="outlined" className="mb-6">
            <CardBody>
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Skeleton shape="text" height="2rem" width="40%" className="mb-2" />
                    <Skeleton shape="text" height="1rem" width="60%" />
                  </div>
                  <Skeleton shape="rectangle" height="2rem" width="100px" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Skeleton shape="text" height="0.875rem" width="50%" />
                    <Skeleton shape="text" height="1.5rem" width="70%" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton shape="text" height="0.875rem" width="50%" />
                    <Skeleton shape="text" height="1.5rem" width="70%" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton shape="text" height="0.875rem" width="30%" />
                  <Skeleton shape="rectangle" height="0.75rem" width="100%" />
                </div>
              </div>
            </CardBody>
          </Card>
        ) : (
          <Card variant="outlined" className="mb-6">
            <CardBody>
              <div className="flex items-start justify-between mb-4 flex-wrap gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-slate-grey mb-2">
                    Project #{project.id.toString()}
                  </h1>
                  <p className="text-slate-grey opacity-70">
                    NGO: {formatAddress(project.ngo)}
                  </p>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-medium text-white ${status.color}`}>
                  {status.label}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                <div>
                  <p className="text-sm text-slate-grey opacity-70 mb-1">Fundraising Goal:</p>
                  <p className="text-xl font-semibold text-slate-grey">{formattedGoal}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-grey opacity-70 mb-1">Total Donated:</p>
                  <p className="text-xl font-semibold text-emerald-green">{formattedDonated} {tokenName}</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-grey opacity-70">Progress</span>
                  <span className="font-medium text-slate-grey">{progressPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-emerald-green h-3 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(parseFloat(progressPercentage), 100)}%` }}
                  />
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Milestones */}
            <Card variant="outlined">
              <CardBody>
                <h2 className="text-xl font-semibold text-slate-grey mb-4">
                  Milestones {!isLoadingMilestones && `(${milestones.length})`}
                </h2>
                {isLoadingMilestones ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <MilestoneCardSkeleton key={i} />
                    ))}
                  </div>
                ) : milestones.length === 0 ? (
                  <EmptyState
                    variant="no-milestones"
                    title="No milestones defined"
                    description="This project doesn't have any milestones yet."
                  />
                ) : project ? (
                  <div className="space-y-4">
                    {milestones.map((milestone, index) => (
                      <MilestoneCard
                        key={index}
                        milestone={milestone}
                        index={index}
                        currentMilestoneIndex={project.currentMilestone}
                        donationToken={project.donationToken}
                      />
                    ))}
                  </div>
                ) : null}
              </CardBody>
            </Card>

            {/* Voting Progress for Current Milestone */}
            {isLoadingCurrentMilestone ? (
              <CardSkeleton />
            ) : currentMilestone && project ? (
              <div className="space-y-4">
                <VotingProgress
                  projectId={projectId}
                  milestoneId={project.currentMilestone}
                />
                {/* Fund Release Button (NGO only) */}
                {address && address.toLowerCase() === project.ngo.toLowerCase() && (
                  <ReleaseFundsButton projectId={projectId} />
                )}
              </div>
            ) : null}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Donation Form */}
            {isLoadingProject || !project ? (
              <CardSkeleton />
            ) : (
              <DonateForm
                projectId={projectId}
                donationToken={project.donationToken}
              />
            )}

            {/* Donation History */}
            {address && (
              <DonationHistory projectId={projectId} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

