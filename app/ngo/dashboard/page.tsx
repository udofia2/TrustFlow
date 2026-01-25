"use client";

import { useMemo } from "react";
import { useConnection } from "wagmi";
import { type Address } from "viem";
import { useIsVerifiedNGO } from "@/hooks/useNGO";
import { useAllProjects } from "@/hooks/useProject";
import { ReleaseFundsButton } from "@/components/project/ReleaseFundsButton";
import { WalletConnect } from "@/components/web3/WalletConnect";
import { NetworkSwitcher } from "@/components/web3/NetworkSwitcher";
import { Spinner } from "@/components/ui/Spinner";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatAddress, formatEther, formatUSDC, formatNumber } from "@/lib/utils";
import { isAddress } from "viem";
import { USDC_ADDRESS } from "@/lib/contract";
import Link from "next/link";

/**
 * NGO Dashboard page
 */
export default function NGODashboardPage() {
  const { address, isConnected } = useConnection();
  const { isVerified, isLoading: isLoadingNGO } = useIsVerifiedNGO(address);
  const { projects, isLoading: isLoadingProjects } = useAllProjects();

  // Filter projects by NGO address
  const ngoProjects = useMemo(() => {
    if (!address || !projects) {
      console.log("[NGO Dashboard] Filtering projects:", {
        hasAddress: !!address,
        address,
        projectsCount: projects?.length || 0,
        projects: projects?.map((p) => ({
          id: p.id.toString(),
          ngo: p.ngo,
          ngoLower: p.ngo.toLowerCase(),
        })),
      });
      return [];
    }
    
    const filtered = projects.filter(
      (project) => project.ngo.toLowerCase() === address.toLowerCase()
    );
    
    console.log("[NGO Dashboard] Filtered projects:", {
      totalProjects: projects.length,
      filteredCount: filtered.length,
      currentAddress: address,
      currentAddressLower: address.toLowerCase(),
      filteredProjects: filtered.map((p) => ({
        id: p.id.toString(),
        ngo: p.ngo,
        ngoLower: p.ngo.toLowerCase(),
        matches: p.ngo.toLowerCase() === address.toLowerCase(),
      })),
      allProjectNGOs: projects.map((p) => ({
        id: p.id.toString(),
        ngo: p.ngo,
        ngoLower: p.ngo.toLowerCase(),
        matches: p.ngo.toLowerCase() === address.toLowerCase(),
      })),
    });
    
    return filtered;
  }, [projects, address]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalProjects = ngoProjects.length;
    const activeProjects = ngoProjects.filter(
      (p) => p.isActive && !p.isCompleted
    ).length;
    const completedProjects = ngoProjects.filter((p) => p.isCompleted).length;
    const totalDonations = ngoProjects.reduce(
      (sum, p) => sum + p.totalDonated,
      BigInt(0)
    );

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      totalDonations,
    };
  }, [ngoProjects]);

  // Loading state
  if (isLoadingNGO || isLoadingProjects) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-deep-blue text-white shadow-md">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="text-white hover:underline">
                ← Back to Home
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

  // Not connected
  if (!isConnected || !address) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-deep-blue text-white shadow-md">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="text-white hover:underline">
                ← Back to Home
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
              <div className="text-center py-8">
                <p className="text-slate-grey mb-4">Please connect your wallet to view your dashboard</p>
                <WalletConnect />
              </div>
            </CardBody>
          </Card>
        </main>
      </div>
    );
  }

  // Not verified NGO
  if (!isVerified) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-deep-blue text-white shadow-md">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="text-white hover:underline">
                ← Back to Home
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
              <div className="text-center py-8">
                <p className="text-charity-red text-lg font-semibold mb-2">
                  Not a Verified NGO
                </p>
                <p className="text-slate-grey opacity-70 mb-4">
                  Only verified NGOs can access the dashboard. Apply to become a verified NGO to get started.
                </p>
                <Link href="/ngo/register">
                  <Button variant="primary">Apply for NGO Verification</Button>
                </Link>
              </div>
            </CardBody>
          </Card>
        </main>
      </div>
    );
  }

  // Format total donations
  const formatTotalDonations = (amount: bigint): string => {
    // Try to determine token type from first project (if exists)
    if (ngoProjects.length > 0) {
      const firstProject = ngoProjects[0];
      const isETH =
        firstProject.donationToken === "0x0000000000000000000000000000000000000000" ||
        !isAddress(firstProject.donationToken);
      const isUSDC =
        firstProject.donationToken.toLowerCase() === USDC_ADDRESS.toLowerCase();

      if (isETH) {
        return `${formatEther(amount)} ETH`;
      } else if (isUSDC) {
        return `${formatUSDC(amount)} USDC`;
      }
    }
    return formatNumber(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-deep-blue text-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold">NGO Dashboard</h1>
              <p className="text-sm opacity-90 mt-1">
                Manage your charity projects
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/" className="text-white hover:underline text-sm">
                ← Home
              </Link>
              <NetworkSwitcher />
              <WalletConnect />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card variant="outlined">
            <CardBody>
              <p className="text-sm text-slate-grey opacity-70 mb-1">Total Projects</p>
              <p className="text-2xl font-bold text-slate-grey">{stats.totalProjects}</p>
            </CardBody>
          </Card>
          <Card variant="outlined">
            <CardBody>
              <p className="text-sm text-slate-grey opacity-70 mb-1">Active Projects</p>
              <p className="text-2xl font-bold text-emerald-green">{stats.activeProjects}</p>
            </CardBody>
          </Card>
          <Card variant="outlined">
            <CardBody>
              <p className="text-sm text-slate-grey opacity-70 mb-1">Completed Projects</p>
              <p className="text-2xl font-bold text-slate-grey">{stats.completedProjects}</p>
            </CardBody>
          </Card>
          <Card variant="outlined">
            <CardBody>
              <p className="text-sm text-slate-grey opacity-70 mb-1">Total Donations</p>
              <p className="text-2xl font-bold text-emerald-green">
                {formatTotalDonations(stats.totalDonations)}
              </p>
            </CardBody>
          </Card>
        </div>

        {/* Projects List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-slate-grey">Your Projects</h2>
            <Link href="/project/create">
              <button className="px-4 py-2 bg-emerald-green text-white rounded-lg hover:bg-emerald-green-hover transition-colors text-sm font-medium">
                + Create Project
              </button>
            </Link>
          </div>

          {ngoProjects.length === 0 ? (
            <Card variant="outlined">
              <CardBody>
                <div className="text-center py-12">
                  <p className="text-slate-grey mb-2">No projects found</p>
                  <p className="text-sm text-slate-grey opacity-70 mb-4">
                    Create your first charity project to get started
                  </p>
                  <Link href="/project/create">
                    <button className="px-6 py-2 bg-emerald-green text-white rounded-lg hover:bg-emerald-green-hover transition-colors">
                      Create Project
                    </button>
                  </Link>
                </div>
              </CardBody>
            </Card>
          ) : (
            <div className="space-y-4">
              {ngoProjects.map((project) => {
                const isETH =
                  project.donationToken === "0x0000000000000000000000000000000000000000" ||
                  !isAddress(project.donationToken);
                const isUSDC =
                  project.donationToken.toLowerCase() === USDC_ADDRESS.toLowerCase();
                const formattedDonated = isETH
                  ? formatEther(project.totalDonated)
                  : isUSDC
                  ? formatUSDC(project.totalDonated)
                  : formatEther(project.totalDonated);
                const tokenName = isETH ? "ETH" : isUSDC ? "USDC" : "tokens";

                return (
                  <Card key={project.id.toString()} variant="outlined">
                    <CardBody>
                      <div className="flex items-start justify-between flex-wrap gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Link
                              href={`/project/${project.id}`}
                              className="text-lg font-semibold text-slate-grey hover:text-deep-blue hover:underline"
                            >
                              Project #{project.id.toString()}
                            </Link>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                project.isCompleted
                                  ? "bg-slate-grey text-white"
                                  : project.isActive
                                  ? "bg-emerald-green text-white"
                                  : "bg-slate-grey text-white opacity-50"
                              }`}
                            >
                              {project.isCompleted
                                ? "Completed"
                                : project.isActive
                                ? "Active"
                                : "Inactive"}
                            </span>
                          </div>
                          <p className="text-sm text-slate-grey opacity-70 mb-2">
                            Total Donations: {formattedDonated} {tokenName}
                          </p>
                          <p className="text-sm text-slate-grey opacity-70">
                            Current Milestone: {project.currentMilestone.toString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <ReleaseFundsButton projectId={project.id} />
                          <Link href={`/project/${project.id}`}>
                            <button className="px-4 py-2 border border-slate-grey border-opacity-30 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                              View Details
                            </button>
                          </Link>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

