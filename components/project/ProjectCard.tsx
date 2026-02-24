"use client";

import Link from "next/link";
import { memo, useMemo } from "react";
import { type Project } from "@/types/contract";
import { type DemoMeta } from "@/lib/demoProjects";
import { Card, CardBody, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatAddress, formatEther, formatUSDC, formatPercentage } from "@/lib/utils";
import { isAddress } from "viem";
import { USDC_ADDRESS } from "@/lib/contract";
import { useUIStore } from "@/stores/uiStore";

export interface ProjectCardProps {
  project: Project;
  /** Optional display metadata injected by demo/placeholder data */
  meta?: Partial<DemoMeta>;
}

/**
 * ProjectCard component for displaying project information in a card
 * Memoized to prevent unnecessary re-renders
 */
export const ProjectCard = memo(function ProjectCard({ project, meta }: ProjectCardProps) {
  const { openDonateModal } = useUIStore();

  const handleDonateClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openDonateModal(project.id);
  };

  // Memoize expensive calculations
  const { progressPercentage, formattedGoal, formattedDonated, status } = useMemo(() => {
    // Calculate progress percentage
    const progress =
      project.goal > BigInt(0)
        ? formatPercentage(Number(project.totalDonated), Number(project.goal))
        : "0.0";

    // Determine if token is ETH (address(0)) or ERC20
    const isETH = project.donationToken === "0x0000000000000000000000000000000000000000" || !isAddress(project.donationToken);
    const isUSDC = project.donationToken.toLowerCase() === USDC_ADDRESS.toLowerCase();

    // Format amounts based on token type
    const goal = isETH
      ? `${formatEther(project.goal)} ETH`
      : isUSDC
      ? `${formatUSDC(project.goal)} USDC`
      : `${formatEther(project.goal)} tokens`;

    const donated = isETH
      ? formatEther(project.totalDonated)
      : isUSDC
      ? formatUSDC(project.totalDonated)
      : formatEther(project.totalDonated);

    // Determine status
    const projectStatus = project.isCompleted
      ? { label: "Completed", color: "bg-slate-grey text-white" }
      : project.isActive
      ? { label: "Active", color: "bg-emerald-green text-white" }
      : { label: "Inactive", color: "bg-slate-grey text-white opacity-50" };

    return {
      progressPercentage: progress,
      formattedGoal: goal,
      formattedDonated: donated,
      status: projectStatus,
    };
  }, [project.goal, project.totalDonated, project.donationToken, project.isCompleted, project.isActive]);

  // Derived vote state for the current milestone
  const voteQuorum = meta?.voteQuorumPct ?? 0;
  const quorumMet  = voteQuorum >= 50;
  const votingActive = !project.isCompleted && project.isActive && voteQuorum > 0;

  return (
    <Link href={`/project/${project.id}`}>
      <Card variant="outlined" className="h-full transition-all hover:shadow-lg flex flex-col">
        <CardBody className="flex-1">
          {/* ── Header row ─────────────────────────────── */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0 pr-2">
              {/* Name (demo) or fallback to Project #N */}
              <h3 className="text-lg font-semibold text-slate-grey mb-0.5 leading-snug">
                {meta?.name ?? `Project #${project.id.toString()}`}
              </h3>
              {/* Category badge */}
              {meta?.category && (
                <span className="inline-block text-xs font-medium text-electric-purple bg-electric-purple/10 rounded px-2 py-0.5 mb-1">
                  {meta.category}
                </span>
              )}
              <p className="text-xs text-slate-grey opacity-60">
                NGO: {formatAddress(project.ngo)}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 ${status.color}`}>
              {status.label}
            </span>
          </div>

          {/* ── Description ─────────────────────────────── */}
          {meta?.description && (
            <p className="text-sm text-slate-grey opacity-70 leading-relaxed mb-4 line-clamp-2">
              {meta.description}
            </p>
          )}

          <div className="space-y-3">
            {/* ── Funding amounts ──────────────────────── */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-gray-50 rounded-lg px-3 py-2">
                <p className="text-slate-grey opacity-60 text-xs mb-0.5">Goal</p>
                <p className="font-semibold text-slate-grey">{formattedGoal}</p>
              </div>
              <div className="bg-gray-50 rounded-lg px-3 py-2">
                <p className="text-slate-grey opacity-60 text-xs mb-0.5">Raised</p>
                <p className="font-semibold text-slate-grey">
                  {formattedDonated}{" "}
                  <span className="text-xs font-normal opacity-60">{meta?.tokenSymbol}</span>
                </p>
              </div>
            </div>

            {/* ── Progress bar ─────────────────────────── */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-grey opacity-70">Funded</span>
                <span className="font-semibold text-slate-grey">{progressPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-emerald-green h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(parseFloat(progressPercentage), 100)}%` }}
                />
              </div>
            </div>

            {/* ── Milestone row ────────────────────────── */}
            {meta?.currentMilestoneLabel && (
              <div className="border border-gray-100 rounded-lg px-3 py-2 text-xs">
                <p className="text-slate-grey opacity-50 mb-0.5 uppercase tracking-wide font-semibold" style={{ fontSize: "0.625rem" }}>
                  Milestone {Number(project.currentMilestone) + 1}
                  {meta.totalMilestones ? ` of ${meta.totalMilestones}` : ""}
                </p>
                <p className="text-slate-grey font-medium leading-snug">{meta.currentMilestoneLabel}</p>
              </div>
            )}

            {/* ── Donor vote bar (only when voting is happening) ── */}
            {votingActive && (
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-grey opacity-70">Donor approval</span>
                  <span
                    className={`font-semibold ${quorumMet ? "text-emerald-green" : "text-bitcoin-orange"}`}
                  >
                    {voteQuorum}%
                    {quorumMet ? " ✓ Quorum met" : " · 50% needed"}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 relative">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      quorumMet ? "bg-emerald-green" : "bg-bitcoin-orange"
                    }`}
                    style={{ width: `${Math.min(voteQuorum, 100)}%` }}
                  />
                  {/* 50% quorum marker */}
                  <div className="absolute top-0 bottom-0 w-px bg-slate-grey opacity-30" style={{ left: "50%" }} />
                </div>
              </div>
            )}
          </div>
        </CardBody>

        <CardFooter className="pt-0 flex gap-2">
          <Link
            href={`/project/${project.id}`}
            className="flex-1"
            onClick={(e) => e.stopPropagation()}
          >
            <Button variant="secondary" size="sm" fullWidth>
              View Details
            </Button>
          </Link>
          {!project.isCompleted && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleDonateClick}
              className="flex-1"
            >
              Donate
            </Button>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
});

