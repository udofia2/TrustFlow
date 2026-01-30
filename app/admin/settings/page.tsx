"use client";

import { useState } from "react";
import { useConnection } from "wagmi";
import { useContractOwner } from "@/hooks/useContractOwner";
import { useAdminControls } from "@/hooks/useAdminControls";
import { WalletConnect } from "@/components/web3/WalletConnect";
import { NetworkSwitcher } from "@/components/web3/NetworkSwitcher";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import Link from "next/link";
import { formatAddress } from "@/lib/utils";

/**
 * Admin Panel - Settings & Emergency Controls
 * Only accessible by the contract owner
 */
export default function AdminSettingsPage() {
    const { address, isConnected } = useConnection();
    const { owner, isOwner, isLoading: isLoadingOwner } = useContractOwner();
    const {
        isPaused,
        isLoadingPauseState,
        pauseContract,
        unpauseContract,
        emergencyWithdraw,
        isPending,
        isConfirming
    } = useAdminControls();

    const [withdrawProjectId, setWithdrawProjectId] = useState("");
    const [withdrawError, setWithdrawError] = useState("");

    const handleTogglePause = () => {
        if (isPaused) {
            if (confirm("Are you sure you want to UNPAUSE the contract? Normal operations will resume.")) {
                unpauseContract();
            }
        } else {
            if (confirm("⚠️ WARNING: Are you sure you want to PAUSE the contract? All donations and fund releases will be halted.")) {
                pauseContract();
            }
        }
    };

    const handleWithdraw = () => {
        if (!withdrawProjectId.trim()) {
            setWithdrawError("Please enter a Project ID");
            return;
        }

        try {
            const pid = BigInt(withdrawProjectId);
            if (pid <= 0n) {
                setWithdrawError("Invalid Project ID");
                return;
            }

            if (confirm(`⚠️ CRITICAL: Are you sure you want to withdraw all funds from Project #${pid}? This action cannot be undone.`)) {
                emergencyWithdraw(pid);
                setWithdrawProjectId("");
            }
        } catch (e) {
            setWithdrawError("Invalid Project ID must be a number");
        }
    };

    // Loading state
    if (isLoadingOwner || isLoadingPauseState) {
        return (
            <div className="min-h-screen bg-gray-50">
                <header className="bg-deep-blue text-white shadow-md">
                    <div className="container mx-auto px-4 py-4">
                        <div className="flex items-center justify-between">
                            <Link href="/" className="text-white hover:underline">← Back to Home</Link>
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

    // Check access
    if (!isConnected || !address || !isOwner) {
        return (
            <div className="min-h-screen bg-gray-50">
                <header className="bg-deep-blue text-white shadow-md">
                    <div className="container mx-auto px-4 py-4">
                        <Link href="/" className="text-white hover:underline">← Back to Home</Link>
                    </div>
                </header>
                <main className="container mx-auto px-4 py-8">
                    <Card variant="outlined">
                        <CardBody>
                            <div className="text-center py-8">
                                <p className="text-charity-red text-lg font-semibold mb-2">Access Denied</p>
                                <p className="text-slate-grey opacity-70">Only the contract owner can access this panel.</p>
                            </div>
                        </CardBody>
                    </Card>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-deep-blue text-white shadow-md">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <h1 className="text-2xl font-bold">Admin Panel - Settings</h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link href="/admin/ngos" className="text-white hover:underline text-sm">
                                Manage NGOs
                            </Link>
                            <div className="h-4 w-px bg-white/30"></div>
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
            <main className="container mx-auto px-4 py-8 max-w-4xl">

                {/* Emergency Controls Section */}
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-slate-grey mb-4 flex items-center gap-2">
                        <span className="text-2xl">🚨</span> Emergency Controls
                    </h2>
                    <div className="bg-charity-red/5 border border-charity-red/20 rounded-lg p-6">

                        {/* Pause/Unpause */}
                        <div className="flex items-center justify-between mb-8 pb-8 border-b border-charity-red/10">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-grey mb-1">Contract Status</h3>
                                <p className="text-sm text-slate-grey opacity-70">
                                    Current State: <span className={`font-bold ${isPaused ? "text-charity-red" : "text-emerald-green"}`}>
                                        {isPaused ? "PAUSED" : "ACTIVE"}
                                    </span>
                                </p>
                                <p className="text-xs text-slate-grey opacity-60 mt-1 max-w-md">
                                    Pausing the contract halts all donations and fund releases. Use only in emergencies.
                                </p>
                            </div>
                            <Button
                                variant={isPaused ? "primary" : "secondary"}
                                className={isPaused ? "bg-emerald-green hover:bg-emerald-600 border-none" : "border-charity-red text-charity-red hover:bg-charity-red hover:text-white"}
                                onClick={handleTogglePause}
                                disabled={isPending || isConfirming}
                                isLoading={isPending || isConfirming}
                            >
                                {isPaused ? "Unpause Contract" : "Pause Contract"}
                            </Button>
                        </div>

                        {/* Emergency Withdraw */}
                        <div>
                            <h3 className="text-lg font-semibold text-slate-grey mb-1">Emergency Withdrawal</h3>
                            <p className="text-sm text-slate-grey opacity-70 mb-4 max-w-lg">
                                Withdraw all funds from a specific project to the owner wallet.
                                <strong> Requires contract to be PAUSED.</strong>
                            </p>

                            <div className="flex gap-3 items-start">
                                <div className="flex-1">
                                    <input
                                        type="number"
                                        value={withdrawProjectId}
                                        onChange={(e) => {
                                            setWithdrawProjectId(e.target.value);
                                            setWithdrawError("");
                                        }}
                                        placeholder="Project ID (e.g. 1)"
                                        disabled={!isPaused || isPending || isConfirming}
                                        className="w-full px-4 py-2 border border-slate-grey border-opacity-30 rounded-lg focus:outline-none focus:ring-2 focus:ring-charity-red focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    />
                                    {withdrawError && (
                                        <p className="mt-1 text-xs text-charity-red">{withdrawError}</p>
                                    )}
                                </div>
                                <Button
                                    variant="primary"
                                    className="bg-charity-red hover:bg-red-700 border-none"
                                    onClick={handleWithdraw}
                                    disabled={!isPaused || isPending || isConfirming}
                                    isLoading={isPending || isConfirming}
                                >
                                    Withdraw Funds
                                </Button>
                            </div>
                            {!isPaused && (
                                <p className="mt-2 text-xs text-bitcoin-orange flex items-center gap-1">
                                    <span>ℹ️</span> You must pause the contract before withdrawing funds.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
}
