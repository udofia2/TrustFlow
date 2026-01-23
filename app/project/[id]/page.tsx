"use client";

import { useParams, useRouter } from "next/navigation";
import { useProject, useProjectMilestones, useCurrentMilestone } from "@/hooks/useProject";
import { useAccount } from "wagmi";
import { ProjectCard } from "@/components/project/ProjectCard";
import { MilestoneCard } from "@/components/project/MilestoneCard";
import { VotingProgress } from "@/components/project/VotingProgress";
import { DonateForm } from "@/components/donation/DonateForm";
import { DonationHistory } from "@/components/donation/DonationHistory";
import { WalletConnect } from "@/components/web3/WalletConnect";
import { NetworkSwitcher } from "@/components/web3/NetworkSwitcher";
import { Spinner } from "@/components/ui/Spinner";
import { Card, CardBody } from "@/components/ui/Card";
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
  const { address } = useAccount();

  // Get projectId from route params
  const projectIdParam = params.id as string;
  const projectId = projectIdParam ? BigInt(projectIdParam) : BigInt(0);

  // Fetch project data
  const { project, isLoading: isLoadingProject, isError: isErrorProject, error: projectError } = useProject(projectId);
  const { milestones, isLoading: isLoadingMilestones } = useProjectMilestones(projectId);
  const { milestone: currentMilestone, isLoading: isLoadingCurrentMilestone } = useCurrentMilestone(projectId);

  const isLoading = isLoadingProject || isLoadingMilestones || isLoadingCurrentMilestone;

  // Loading state
  if (isLoading) {
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
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        </main>
      </div>
    );
  }

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Milestones */}
            <Card variant="outlined">
              <CardBody>
                <h2 className="text-xl font-semibold text-slate-grey mb-4">
                  Milestones ({milestones.length})
                </h2>
                <div className="space-y-4">
                  {milestones.length === 0 ? (
                    <p className="text-slate-grey opacity-70 text-center py-4">
                      No milestones defined for this project
                    </p>
                  ) : (
                    milestones.map((milestone, index) => (
                      <MilestoneCard
                        key={index}
                        milestone={milestone}
                        index={index}
                        currentMilestoneIndex={project.currentMilestone}
                        donationToken={project.donationToken}
                      />
                    ))
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Voting Progress for Current Milestone */}
            {currentMilestone && (
              <VotingProgress
                projectId={projectId}
                milestoneId={project.currentMilestone}
              />
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Donation Form */}
            <DonateForm
              projectId={projectId}
              donationToken={project.donationToken}
            />

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

