"use client";

import { useState, useEffect } from "react";
import { useConnection } from "wagmi";
import { type Address } from "viem";
import { useContractOwner } from "@/hooks/useContractOwner";
import { useRegisterNGO } from "@/hooks/useRegisterNGO";
import { useRevokeNGO } from "@/hooks/useRevokeNGO";
import { useIsVerifiedNGO } from "@/hooks/useNGO";
import { WalletConnect } from "@/components/web3/WalletConnect";
import { NetworkSwitcher } from "@/components/web3/NetworkSwitcher";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import Link from "next/link";
import { formatAddress } from "@/lib/utils";
import toast from "react-hot-toast";

interface NGOApplication {
  walletAddress: string;
  organizationName: string;
  description: string;
  contactEmail: string;
  website?: string;
  registrationNumber?: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
}

/**
 * Admin Panel for managing NGO registrations
 * Only accessible by the contract owner
 */
export default function AdminNGOPage() {
  const { address, isConnected } = useConnection();
  const { owner, isOwner, isLoading: isLoadingOwner } = useContractOwner();
  const { registerNGO, isPending: isRegistering, isConfirming: isConfirmingRegister } = useRegisterNGO();
  const { revokeNGO, isPending: isRevoking, isConfirming: isConfirmingRevoke } = useRevokeNGO();
  
  const [applications, setApplications] = useState<NGOApplication[]>([]);
  const [verifiedNGOs, setVerifiedNGOs] = useState<Address[]>([]);
  const [directRegisterAddress, setDirectRegisterAddress] = useState("");
  const [directRegisterError, setDirectRegisterError] = useState("");

  // Load applications from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("ngo_applications");
    if (stored) {
      try {
        const apps = JSON.parse(stored) as NGOApplication[];
        setApplications(apps);
      } catch (error) {
        console.error("Error loading applications:", error);
      }
    }
  }, []);

  // Check verification status for all applications
  const pendingApplications = applications.filter((app) => app.status === "pending");
  const approvedApplications = applications.filter((app) => app.status === "approved");
  const rejectedApplications = applications.filter((app) => app.status === "rejected");

  const handleApprove = async (application: NGOApplication) => {
    try {
      // Update application status in localStorage
      const updated = applications.map((app) =>
        app.walletAddress.toLowerCase() === application.walletAddress.toLowerCase()
          ? { ...app, status: "approved" as const }
          : app
      );
      setApplications(updated);
      localStorage.setItem("ngo_applications", JSON.stringify(updated));
      
      // Also update individual application
      localStorage.setItem(
        `ngo_application_${application.walletAddress.toLowerCase()}`,
        JSON.stringify({ ...application, status: "approved" })
      );

      // Register on smart contract
      await registerNGO(application.walletAddress as Address);
    } catch (error) {
      console.error("Error approving application:", error);
      toast.error("Failed to approve application");
    }
  };

  const handleReject = (application: NGOApplication) => {
    try {
      const updated = applications.map((app) =>
        app.walletAddress.toLowerCase() === application.walletAddress.toLowerCase()
          ? { ...app, status: "rejected" as const }
          : app
      );
      setApplications(updated);
      localStorage.setItem("ngo_applications", JSON.stringify(updated));
      
      // Also update individual application
      localStorage.setItem(
        `ngo_application_${application.walletAddress.toLowerCase()}`,
        JSON.stringify({ ...application, status: "rejected" })
      );

      toast.success("Application rejected");
    } catch (error) {
      console.error("Error rejecting application:", error);
      toast.error("Failed to reject application");
    }
  };

  const handleDirectRegister = async () => {
    if (!directRegisterAddress.trim()) {
      setDirectRegisterError("Please enter an address");
      return;
    }

    // Basic address validation
    if (!/^0x[a-fA-F0-9]{40}$/.test(directRegisterAddress.trim())) {
      setDirectRegisterError("Invalid address format");
      return;
    }

    setDirectRegisterError("");
    try {
      await registerNGO(directRegisterAddress.trim() as Address);
      setDirectRegisterAddress("");
      toast.success("NGO registration initiated");
    } catch (error) {
      console.error("Error registering NGO:", error);
      toast.error("Failed to register NGO");
    }
  };

  const handleRevoke = async (ngoAddress: Address) => {
    if (!confirm(`Are you sure you want to revoke NGO status for ${formatAddress(ngoAddress)}?`)) {
      return;
    }

    try {
      await revokeNGO(ngoAddress);
    } catch (error) {
      console.error("Error revoking NGO:", error);
      toast.error("Failed to revoke NGO");
    }
  };

  // Loading state
  if (isLoadingOwner) {
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
                <p className="text-slate-grey mb-4">
                  Please connect your wallet to access the admin panel
                </p>
                <WalletConnect />
              </div>
            </CardBody>
          </Card>
        </main>
      </div>
    );
  }

  // Not owner
  if (!isOwner) {
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
                  Access Denied
                </p>
                <p className="text-slate-grey opacity-70 mb-4">
                  Only the contract owner can access this panel.
                </p>
                <p className="text-sm text-slate-grey opacity-70">
                  Contract Owner: {owner ? formatAddress(owner) : "Loading..."}
                </p>
                <p className="text-sm text-slate-grey opacity-70 mt-2">
                  Your Address: {formatAddress(address)}
                </p>
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
              <h1 className="text-2xl font-bold">Admin Panel - NGO Management</h1>
              <p className="text-sm opacity-90 mt-1">
                Manage NGO registrations and applications
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
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Direct Registration */}
        <Card variant="outlined" className="mb-6">
          <CardBody>
            <h2 className="text-xl font-bold text-slate-grey mb-4">
              Direct NGO Registration
            </h2>
            <p className="text-sm text-slate-grey opacity-70 mb-4">
              Register an NGO directly by entering their wallet address
            </p>
            <div className="flex gap-3">
              <input
                type="text"
                value={directRegisterAddress}
                onChange={(e) => {
                  setDirectRegisterAddress(e.target.value);
                  setDirectRegisterError("");
                }}
                placeholder="0x..."
                className={`flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-green focus:border-transparent ${
                  directRegisterError
                    ? "border-charity-red"
                    : "border-slate-grey border-opacity-30"
                }`}
              />
              <Button
                variant="primary"
                onClick={handleDirectRegister}
                disabled={isRegistering || isConfirmingRegister}
                isLoading={isRegistering || isConfirmingRegister}
              >
                Register NGO
              </Button>
            </div>
            {directRegisterError && (
              <p className="mt-2 text-sm text-charity-red">{directRegisterError}</p>
            )}
          </CardBody>
        </Card>

        {/* Pending Applications */}
        <Card variant="outlined" className="mb-6">
          <CardBody>
            <h2 className="text-xl font-bold text-slate-grey mb-4">
              Pending Applications ({pendingApplications.length})
            </h2>
            {pendingApplications.length === 0 ? (
              <p className="text-slate-grey opacity-70 py-4">
                No pending applications
              </p>
            ) : (
              <div className="space-y-4">
                {pendingApplications.map((app) => (
                  <ApplicationCard
                    key={app.walletAddress}
                    application={app}
                    onApprove={() => handleApprove(app)}
                    onReject={() => handleReject(app)}
                    isProcessing={isRegistering || isConfirmingRegister}
                  />
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Approved Applications */}
        {approvedApplications.length > 0 && (
          <Card variant="outlined" className="mb-6">
            <CardBody>
              <h2 className="text-xl font-bold text-slate-grey mb-4">
                Approved Applications ({approvedApplications.length})
              </h2>
              <div className="space-y-4">
                {approvedApplications.map((app) => (
                  <ApplicationCard
                    key={app.walletAddress}
                    application={app}
                    isApproved
                  />
                ))}
              </div>
            </CardBody>
          </Card>
        )}

        {/* Rejected Applications */}
        {rejectedApplications.length > 0 && (
          <Card variant="outlined">
            <CardBody>
              <h2 className="text-xl font-bold text-slate-grey mb-4">
                Rejected Applications ({rejectedApplications.length})
              </h2>
              <div className="space-y-4">
                {rejectedApplications.map((app) => (
                  <ApplicationCard
                    key={app.walletAddress}
                    application={app}
                    isRejected
                  />
                ))}
              </div>
            </CardBody>
          </Card>
        )}
      </main>
    </div>
  );
}

/**
 * Application Card Component
 */
function ApplicationCard({
  application,
  onApprove,
  onReject,
  isProcessing = false,
  isApproved = false,
  isRejected = false,
}: {
  application: NGOApplication;
  onApprove?: () => void;
  onReject?: () => void;
  isProcessing?: boolean;
  isApproved?: boolean;
  isRejected?: boolean;
}) {
  const { isVerified } = useIsVerifiedNGO(application.walletAddress as Address);
  const { revokeNGO, isPending: isRevoking, isConfirming: isConfirmingRevoke } = useRevokeNGO();

  const handleRevoke = async () => {
    if (!confirm(`Are you sure you want to revoke NGO status for ${application.organizationName}?`)) {
      return;
    }
    try {
      await revokeNGO(application.walletAddress as Address);
    } catch (error) {
      console.error("Error revoking NGO:", error);
    }
  };

  return (
    <div className="border border-slate-grey border-opacity-30 rounded-lg p-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-slate-grey">
              {application.organizationName}
            </h3>
            {isApproved && (
              <span className="px-2 py-1 bg-emerald-green text-white rounded-full text-xs font-medium">
                Approved
              </span>
            )}
            {isRejected && (
              <span className="px-2 py-1 bg-charity-red text-white rounded-full text-xs font-medium">
                Rejected
              </span>
            )}
            {!isApproved && !isRejected && (
              <span className="px-2 py-1 bg-bitcoin-orange text-white rounded-full text-xs font-medium">
                Pending
              </span>
            )}
            {isVerified && (
              <span className="px-2 py-1 bg-emerald-green bg-opacity-20 text-emerald-green rounded-full text-xs font-medium">
                Verified on Contract
              </span>
            )}
          </div>
          <p className="text-sm text-slate-grey opacity-70 mb-3 line-clamp-2">
            {application.description}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-grey">
            <div>
              <strong>Address:</strong> {formatAddress(application.walletAddress)}
            </div>
            <div>
              <strong>Email:</strong> {application.contactEmail}
            </div>
            {application.website && (
              <div>
                <strong>Website:</strong>{" "}
                <a
                  href={application.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-green hover:underline"
                >
                  {application.website}
                </a>
              </div>
            )}
            {application.registrationNumber && (
              <div>
                <strong>Registration #:</strong> {application.registrationNumber}
              </div>
            )}
            <div>
              <strong>Submitted:</strong>{" "}
              {new Date(application.submittedAt).toLocaleDateString()}
            </div>
          </div>
        </div>
        {!isApproved && !isRejected && onApprove && onReject && (
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={onApprove}
              disabled={isProcessing}
              isLoading={isProcessing}
            >
              Approve & Register
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={onReject}
              disabled={isProcessing}
            >
              Reject
            </Button>
          </div>
        )}
        {isApproved && isVerified && (
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRevoke}
              disabled={isRevoking || isConfirmingRevoke}
              isLoading={isRevoking || isConfirmingRevoke}
            >
              Revoke
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

