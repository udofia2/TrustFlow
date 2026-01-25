"use client";

import { useState, useEffect } from "react";
import { useConnection } from "wagmi";
import { useRouter } from "next/navigation";
import { useIsVerifiedNGO } from "@/hooks/useNGO";
import { WalletConnect } from "@/components/web3/WalletConnect";
import { NetworkSwitcher } from "@/components/web3/NetworkSwitcher";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import Link from "next/link";
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
 * NGO Registration/Application Page
 * Allows NGOs to submit an application for verification
 */
export default function NGORegisterPage() {
  const router = useRouter();
  const { address, isConnected } = useConnection();
  const { isVerified, isLoading: isLoadingNGO } = useIsVerifiedNGO(address);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    organizationName: "",
    description: "",
    contactEmail: "",
    website: "",
    registrationNumber: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Check if user already has a pending application
  const [existingApplication, setExistingApplication] = useState<NGOApplication | null>(null);

  // Load existing application on mount
  useEffect(() => {
    if (address) {
      const stored = localStorage.getItem(`ngo_application_${address.toLowerCase()}`);
      if (stored) {
        try {
          setExistingApplication(JSON.parse(stored));
        } catch (error) {
          console.error("Error parsing stored application:", error);
        }
      }
    }
  }, [address]);

  // If already verified, redirect to dashboard
  if (isLoadingNGO) {
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

  if (isVerified) {
    router.push("/ngo/dashboard");
    return null;
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
                  Please connect your wallet to submit an NGO application
                </p>
                <WalletConnect />
              </div>
            </CardBody>
          </Card>
        </main>
      </div>
    );
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.organizationName.trim()) {
      newErrors.organizationName = "Organization name is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.trim().length < 50) {
      newErrors.description = "Description must be at least 50 characters";
    }

    if (!formData.contactEmail.trim()) {
      newErrors.contactEmail = "Contact email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      newErrors.contactEmail = "Please enter a valid email address";
    }

    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      newErrors.website = "Please enter a valid URL (starting with http:// or https://)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create application object
      const application: NGOApplication = {
        walletAddress: address!,
        organizationName: formData.organizationName.trim(),
        description: formData.description.trim(),
        contactEmail: formData.contactEmail.trim(),
        website: formData.website?.trim() || undefined,
        registrationNumber: formData.registrationNumber?.trim() || undefined,
        submittedAt: new Date().toISOString(),
        status: "pending",
      };

      // Store in localStorage (temporary solution until backend is implemented)
      localStorage.setItem(
        `ngo_application_${address.toLowerCase()}`,
        JSON.stringify(application)
      );

      // Also store in a list of all applications (for admin panel later)
      const allApplications = JSON.parse(
        localStorage.getItem("ngo_applications") || "[]"
      );
      const existingIndex = allApplications.findIndex(
        (app: NGOApplication) =>
          app.walletAddress.toLowerCase() === address.toLowerCase()
      );
      if (existingIndex >= 0) {
        allApplications[existingIndex] = application;
      } else {
        allApplications.push(application);
      }
      localStorage.setItem("ngo_applications", JSON.stringify(allApplications));

      setExistingApplication(application);
      toast.success("Application submitted successfully!");
      
      // Reset form
      setFormData({
        organizationName: "",
        description: "",
        contactEmail: "",
        website: "",
        registrationNumber: "",
      });
    } catch (error) {
      console.error("Error submitting application:", error);
      toast.error("Failed to submit application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-deep-blue text-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold">NGO Registration</h1>
              <p className="text-sm opacity-90 mt-1">
                Apply to become a verified NGO on the platform
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
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Existing Application Notice */}
        {existingApplication && existingApplication.status === "pending" && (
          <Card variant="outlined" className="mb-6 border-emerald-green">
            <CardBody>
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-grey mb-2">
                    Application Submitted
                  </h3>
                  <p className="text-sm text-slate-grey opacity-70 mb-3">
                    Your application is currently under review. We'll notify you once
                    it's been processed.
                  </p>
                  <div className="text-sm text-slate-grey">
                    <p>
                      <strong>Organization:</strong> {existingApplication.organizationName}
                    </p>
                    <p>
                      <strong>Submitted:</strong>{" "}
                      {new Date(existingApplication.submittedAt).toLocaleDateString()}
                    </p>
                    <p>
                      <strong>Status:</strong>{" "}
                      <span className="text-bitcoin-orange">Pending Review</span>
                    </p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {existingApplication && existingApplication.status === "approved" && (
          <Card variant="outlined" className="mb-6 border-emerald-green">
            <CardBody>
              <div className="text-center py-4">
                <h3 className="text-lg font-semibold text-emerald-green mb-2">
                  Application Approved!
                </h3>
                <p className="text-sm text-slate-grey opacity-70 mb-4">
                  Your NGO has been verified. You can now access the dashboard.
                </p>
                <Link href="/ngo/dashboard">
                  <Button variant="primary">Go to Dashboard</Button>
                </Link>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Application Form */}
        <Card variant="outlined">
          <CardBody>
            <h2 className="text-xl font-bold text-slate-grey mb-6">
              NGO Application Form
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Wallet Address (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-slate-grey mb-2">
                  Wallet Address
                </label>
                <input
                  type="text"
                  value={address}
                  disabled
                  className="w-full px-4 py-2 border border-slate-grey border-opacity-30 rounded-lg bg-gray-100 text-slate-grey cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-slate-grey opacity-70">
                  This is the address that will be registered as the NGO
                </p>
              </div>

              {/* Organization Name */}
              <div>
                <label
                  htmlFor="organizationName"
                  className="block text-sm font-medium text-slate-grey mb-2"
                >
                  Organization Name <span className="text-charity-red">*</span>
                </label>
                <input
                  type="text"
                  id="organizationName"
                  name="organizationName"
                  value={formData.organizationName}
                  onChange={handleInputChange}
                  disabled={isSubmitting || existingApplication?.status === "pending"}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-green focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
                    errors.organizationName
                      ? "border-charity-red"
                      : "border-slate-grey border-opacity-30"
                  }`}
                  placeholder="Enter your organization's legal name"
                />
                {errors.organizationName && (
                  <p className="mt-1 text-sm text-charity-red">
                    {errors.organizationName}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-slate-grey mb-2"
                >
                  Organization Description <span className="text-charity-red">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  disabled={isSubmitting || existingApplication?.status === "pending"}
                  rows={5}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-green focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
                    errors.description
                      ? "border-charity-red"
                      : "border-slate-grey border-opacity-30"
                  }`}
                  placeholder="Describe your organization's mission, activities, and impact (minimum 50 characters)"
                />
                <p className="mt-1 text-xs text-slate-grey opacity-70">
                  {formData.description.length}/50 characters (minimum)
                </p>
                {errors.description && (
                  <p className="mt-1 text-sm text-charity-red">
                    {errors.description}
                  </p>
                )}
              </div>

              {/* Contact Email */}
              <div>
                <label
                  htmlFor="contactEmail"
                  className="block text-sm font-medium text-slate-grey mb-2"
                >
                  Contact Email <span className="text-charity-red">*</span>
                </label>
                <input
                  type="email"
                  id="contactEmail"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleInputChange}
                  disabled={isSubmitting || existingApplication?.status === "pending"}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-green focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
                    errors.contactEmail
                      ? "border-charity-red"
                      : "border-slate-grey border-opacity-30"
                  }`}
                  placeholder="contact@yourorganization.org"
                />
                {errors.contactEmail && (
                  <p className="mt-1 text-sm text-charity-red">
                    {errors.contactEmail}
                  </p>
                )}
              </div>

              {/* Website */}
              <div>
                <label
                  htmlFor="website"
                  className="block text-sm font-medium text-slate-grey mb-2"
                >
                  Website (Optional)
                </label>
                <input
                  type="url"
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  disabled={isSubmitting || existingApplication?.status === "pending"}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-green focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
                    errors.website
                      ? "border-charity-red"
                      : "border-slate-grey border-opacity-30"
                  }`}
                  placeholder="https://www.yourorganization.org"
                />
                {errors.website && (
                  <p className="mt-1 text-sm text-charity-red">{errors.website}</p>
                )}
              </div>

              {/* Registration Number */}
              <div>
                <label
                  htmlFor="registrationNumber"
                  className="block text-sm font-medium text-slate-grey mb-2"
                >
                  Registration Number (Optional)
                </label>
                <input
                  type="text"
                  id="registrationNumber"
                  name="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={handleInputChange}
                  disabled={isSubmitting || existingApplication?.status === "pending"}
                  className="w-full px-4 py-2 border border-slate-grey border-opacity-30 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-green focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Legal registration number (if applicable)"
                />
                <p className="mt-1 text-xs text-slate-grey opacity-70">
                  Government or legal registration number
                </p>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                {existingApplication?.status === "pending" ? (
                  <div className="text-center py-4">
                    <p className="text-slate-grey mb-4">
                      You have a pending application. Please wait for review.
                    </p>
                    <Link href="/ngo/dashboard">
                      <Button variant="secondary">Check Status</Button>
                    </Link>
                  </div>
                ) : (
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={isSubmitting}
                    isLoading={isSubmitting}
                    className="w-full"
                  >
                    Submit Application
                  </Button>
                )}
              </div>
            </form>

            {/* Information Notice */}
            <div className="mt-6 p-4 bg-emerald-green bg-opacity-10 rounded-lg">
              <p className="text-sm text-slate-grey">
                <strong>Note:</strong> After submitting your application, the platform
                administrator will review it. You'll be notified once your application
                has been processed. This process may take a few business days.
              </p>
            </div>
          </CardBody>
        </Card>
      </main>
    </div>
  );
}

