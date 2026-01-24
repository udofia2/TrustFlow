"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useIsVerifiedNGO } from "@/hooks/useNGO";
import { type Address, parseEther, parseUnits, isAddress } from "viem";
import { CHARITY_TRACKER_ADDRESS, CHARITY_TRACKER_ABI, USDC_ADDRESS } from "@/lib/contract";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { WalletConnect } from "@/components/web3/WalletConnect";
import { NetworkSwitcher } from "@/components/web3/NetworkSwitcher";
import { Spinner } from "@/components/ui/Spinner";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { parseContractError } from "@/lib/errors";
import {
  validateGoal,
  validateAddress,
  validateMilestoneArrays,
  validateMilestoneSum,
} from "@/lib/validation";
import Link from "next/link";

interface MilestoneInput {
  description: string;
  amount: string;
}

/**
 * Project creation page (NGO only)
 */
export default function CreateProjectPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const queryClient = useQueryClient();
  const { isVerified, isLoading: isLoadingNGO } = useIsVerifiedNGO(address);

  // Form state
  const [donationToken, setDonationToken] = useState<string>("0x0000000000000000000000000000000000000000");
  const [goal, setGoal] = useState<string>("");
  const [milestones, setMilestones] = useState<MilestoneInput[]>([
    { description: "", amount: "" },
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Contract write
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  const {
    isLoading: isConfirming,
    isSuccess,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash,
  });

  const prevSuccessRef = useRef(false);

  // Handle success - redirect to new project
  useEffect(() => {
    if (isSuccess && !prevSuccessRef.current && hash) {
      prevSuccessRef.current = true;
      toast.success("Project created successfully!");
      
      // Invalidate projects query
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      
      // Get project ID from transaction receipt (would need to parse event)
      // For now, we'll redirect to home and let user find the new project
      // In a production app, you'd parse the ProjectCreated event to get the projectId
      setTimeout(() => {
        router.push("/");
      }, 2000);
    }
  }, [isSuccess, hash, queryClient, router]);

  // Handle errors
  useEffect(() => {
    const currentError = writeError || receiptError;
    if (currentError) {
      const errorMessage = parseContractError(currentError);
      toast.error(errorMessage);
    }
  }, [writeError, receiptError]);

  // Add milestone
  const addMilestone = () => {
    setMilestones([...milestones, { description: "", amount: "" }]);
  };

  // Remove milestone
  const removeMilestone = (index: number) => {
    if (milestones.length > 1) {
      setMilestones(milestones.filter((_, i) => i !== index));
    }
  };

  // Update milestone
  const updateMilestone = (index: number, field: keyof MilestoneInput, value: string) => {
    const updated = [...milestones];
    updated[index] = { ...updated[index], [field]: value };
    setMilestones(updated);
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate goal using utility
    if (!validateGoal(goal)) {
      newErrors.goal = "Goal must be greater than 0";
    }

    // Validate donation token using utility
    if (donationToken && donationToken !== "0x0000000000000000000000000000000000000000") {
      if (!validateAddress(donationToken)) {
        newErrors.donationToken = "Invalid token address";
      }
    }

    // Validate milestones using utility
    const descriptions = milestones.map((m) => m.description);
    const amounts = milestones.map((m) => m.amount);
    const milestoneValidation = validateMilestoneArrays(descriptions, amounts);

    if (!milestoneValidation.valid) {
      newErrors.milestones = milestoneValidation.error || "Invalid milestone data";
      
      // Add individual milestone errors if available
      milestones.forEach((milestone, index) => {
        if (!milestone.description.trim()) {
          newErrors[`milestone-${index}`] = "Description is required";
        }
        if (!milestone.amount || parseFloat(milestone.amount) <= 0) {
          const existingError = newErrors[`milestone-${index}`];
          newErrors[`milestone-${index}`] = existingError
            ? `${existingError} | Amount must be greater than 0`
            : "Amount must be greater than 0";
        }
      });
    }

    // Validate milestone sum using utility
    if (goal && amounts.length > 0) {
      const sumValidation = validateMilestoneSum(amounts, goal);
      if (!sumValidation.valid && sumValidation.error) {
        newErrors.milestoneSum = sumValidation.error;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    if (!validateForm()) {
      return;
    }

    if (!isConnected || !address) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!isVerified) {
      toast.error("You are not a verified NGO");
      return;
    }

    try {
      // Determine token decimals
      const isETH = donationToken === "0x0000000000000000000000000000000000000000";
      const isUSDC = donationToken.toLowerCase() === USDC_ADDRESS.toLowerCase();
      const decimals = isETH ? 18 : isUSDC ? 6 : 18;

      // Parse goal
      const goalParsed = isETH
        ? parseEther(goal)
        : parseUnits(goal, decimals);

      // Parse milestone amounts
      const amounts = milestones.map((m) =>
        isETH ? parseEther(m.amount) : parseUnits(m.amount, decimals)
      );

      // Prepare descriptions
      const descriptions = milestones.map((m) => m.description);

      // Call contract
      await writeContract({
        address: CHARITY_TRACKER_ADDRESS,
        abi: CHARITY_TRACKER_ABI,
        functionName: "createProject",
        args: [
          donationToken as Address,
          goalParsed,
          descriptions,
          amounts,
        ],
      });
    } catch (error) {
      // Parse and display error
      const errorMessage = parseContractError(error);
      toast.error(errorMessage);
      console.error("Project creation error:", error);
    }
  };

  const isETH = donationToken === "0x0000000000000000000000000000000000000000";
  const tokenName = isETH ? "ETH" : donationToken.toLowerCase() === USDC_ADDRESS.toLowerCase() ? "USDC" : "Token";
  const tokenDecimals = isETH ? 18 : donationToken.toLowerCase() === USDC_ADDRESS.toLowerCase() ? 6 : 18;

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
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold text-slate-grey mb-2">Create New Project</h1>
        <p className="text-slate-grey opacity-70 mb-6">
          Create a transparent charity project with milestones
        </p>

        {/* NGO Verification Check */}
        {isLoadingNGO ? (
          <Card variant="outlined">
            <CardBody>
              <div className="flex items-center justify-center py-8">
                <Spinner size="lg" />
              </div>
            </CardBody>
          </Card>
        ) : !isConnected ? (
          <Card variant="outlined">
            <CardBody>
              <div className="text-center py-8">
                <p className="text-slate-grey mb-4">Please connect your wallet to create a project</p>
                <WalletConnect />
              </div>
            </CardBody>
          </Card>
        ) : !isVerified ? (
          <Card variant="outlined">
            <CardBody>
              <div className="text-center py-8">
                <p className="text-charity-red text-lg font-semibold mb-2">
                  Not a Verified NGO
                </p>
                <p className="text-slate-grey opacity-70">
                  Only verified NGOs can create projects. Please contact the administrator to get verified.
                </p>
              </div>
            </CardBody>
          </Card>
        ) : (
          <Card variant="outlined">
            <CardBody>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Donation Token */}
                <div>
                  <label
                    htmlFor="donationToken"
                    className="block text-sm font-medium text-slate-grey mb-2"
                  >
                    Donation Token
                  </label>
                  <select
                    id="donationToken"
                    value={donationToken}
                    onChange={(e) => setDonationToken(e.target.value)}
                    disabled={isPending || isConfirming}
                    className="w-full px-4 py-2 border border-slate-grey border-opacity-30 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-green focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="0x0000000000000000000000000000000000000000">ETH</option>
                    <option value={USDC_ADDRESS}>USDC</option>
                  </select>
                  {errors.donationToken && (
                    <p className="mt-1 text-sm text-charity-red">{errors.donationToken}</p>
                  )}
                </div>

                {/* Fundraising Goal */}
                <div>
                  <label
                    htmlFor="goal"
                    className="block text-sm font-medium text-slate-grey mb-2"
                  >
                    Fundraising Goal ({tokenName})
                  </label>
                  <input
                    id="goal"
                    type="number"
                    step="any"
                    min="0"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="0.00"
                    disabled={isPending || isConfirming}
                    className="w-full px-4 py-2 border border-slate-grey border-opacity-30 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-green focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  {errors.goal && (
                    <p className="mt-1 text-sm text-charity-red">{errors.goal}</p>
                  )}
                </div>

                {/* Milestones */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-slate-grey">
                      Milestones
                    </label>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={addMilestone}
                      disabled={isPending || isConfirming}
                    >
                      + Add Milestone
                    </Button>
                  </div>
                  {errors.milestones && (
                    <p className="mb-2 text-sm text-charity-red">{errors.milestones}</p>
                  )}
                  {errors.milestoneSum && (
                    <p className="mb-2 text-sm text-charity-red">{errors.milestoneSum}</p>
                  )}

                  <div className="space-y-4">
                    {milestones.map((milestone, index) => (
                      <div
                        key={index}
                        className="p-4 border border-slate-grey border-opacity-30 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-slate-grey">
                            Milestone {index + 1}
                          </span>
                          {milestones.length > 1 && (
                            <Button
                              type="button"
                              variant="danger"
                              size="sm"
                              onClick={() => removeMilestone(index)}
                              disabled={isPending || isConfirming}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label
                              htmlFor={`description-${index}`}
                              className="block text-xs text-slate-grey opacity-70 mb-1"
                            >
                              Description
                            </label>
                            <input
                              id={`description-${index}`}
                              type="text"
                              value={milestone.description}
                              onChange={(e) =>
                                updateMilestone(index, "description", e.target.value)
                              }
                              placeholder="Milestone description..."
                              disabled={isPending || isConfirming}
                              className="w-full px-3 py-2 border border-slate-grey border-opacity-30 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-green focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor={`amount-${index}`}
                              className="block text-xs text-slate-grey opacity-70 mb-1"
                            >
                              Amount ({tokenName})
                            </label>
                            <input
                              id={`amount-${index}`}
                              type="number"
                              step="any"
                              min="0"
                              value={milestone.amount}
                              onChange={(e) =>
                                updateMilestone(index, "amount", e.target.value)
                              }
                              placeholder="0.00"
                              disabled={isPending || isConfirming}
                              className="w-full px-3 py-2 border border-slate-grey border-opacity-30 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-green focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                            />
                          </div>
                          {errors[`milestone-${index}`] && (
                            <p className="text-xs text-charity-red">
                              {errors[`milestone-${index}`]}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4 border-t border-slate-grey border-opacity-20">
                  <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    isLoading={isPending || isConfirming}
                    disabled={isPending || isConfirming}
                  >
                    {isPending
                      ? "Confirming..."
                      : isConfirming
                      ? "Creating Project..."
                      : "Create Project"}
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        )}
      </main>
    </div>
  );
}

