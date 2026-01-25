"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useConnection } from "wagmi";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useIsVerifiedNGO } from "@/hooks/useNGO";
import { type Address, parseEther, parseUnits, isAddress } from "viem";
import { CHARITY_TRACKER_ADDRESS, CHARITY_TRACKER_ABI, USDC_ADDRESS } from "@/lib/contract";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { parseContractError } from "@/lib/errors";
import {
  validateGoal,
  validateAddress,
  validateMilestoneArrays,
  validateMilestoneSum,
} from "@/lib/validation";
import { useUIStore } from "@/stores/uiStore";

interface MilestoneInput {
  description: string;
  amount: string;
}

/**
 * CreateProjectModal component for creating projects in a modal
 * Uses Zustand store for state management
 */
export function CreateProjectModal() {
  const router = useRouter();
  const { address, isConnected } = useConnection();
  const queryClient = useQueryClient();
  const { isVerified, isLoading: isLoadingNGO } = useIsVerifiedNGO(address);
  const { isCreateProjectModalOpen, closeCreateProjectModal } = useUIStore();

  // Form state
  const [donationToken, setDonationToken] = useState<string>("0x0000000000000000000000000000000000000000");
  const [goal, setGoal] = useState<string>("");
  const [milestones, setMilestones] = useState<MilestoneInput[]>([
    { description: "", amount: "" },
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Contract write
  const writeContract = useWriteContract();
  const hash = writeContract.data;
  const isPending = writeContract.isPending;
  const writeError = writeContract.error;
  const {
    isLoading: isConfirming,
    isSuccess,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash,
  });

  const prevSuccessRef = useRef(false);

  // Handle success - close modal and redirect
  useEffect(() => {
    if (isSuccess && !prevSuccessRef.current && hash) {
      prevSuccessRef.current = true;
      toast.success("Project created successfully!");
      
      // Invalidate projects query
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      
      // Close modal
      closeCreateProjectModal();
      
      // Reset form
      setDonationToken("0x0000000000000000000000000000000000000000");
      setGoal("");
      setMilestones([{ description: "", amount: "" }]);
      setErrors({});
      
      // Redirect to home after a short delay
      setTimeout(() => {
        router.push("/");
      }, 1000);
    }
  }, [isSuccess, hash, queryClient, router, closeCreateProjectModal]);

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
      await writeContract.mutate({
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
    <Modal
      isOpen={isCreateProjectModalOpen}
      onClose={closeCreateProjectModal}
      title="Create New Project"
      size="xl"
    >
      <div className="max-h-[80vh] overflow-y-auto">
        {/* NGO Verification Check */}
        {isLoadingNGO ? (
          <div className="flex items-center justify-center py-8">
            <Spinner size="lg" />
          </div>
        ) : !isConnected ? (
          <div className="text-center py-8">
            <p className="text-slate-grey mb-4">Please connect your wallet to create a project</p>
          </div>
        ) : !isVerified ? (
          <div className="text-center py-8">
            <p className="text-charity-red mb-2">You are not a verified NGO</p>
            <p className="text-sm text-slate-grey opacity-70">
              Only verified NGOs can create projects
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Donation Token */}
            <div>
              <label
                htmlFor="donationToken"
                className="block text-sm font-medium text-slate-grey mb-2"
              >
                Donation Token Address
              </label>
              <input
                id="donationToken"
                type="text"
                value={donationToken}
                onChange={(e) => setDonationToken(e.target.value)}
                placeholder="0x0000000000000000000000000000000000000000 (ETH)"
                disabled={isPending || isConfirming}
                className="w-full px-4 py-2 border border-slate-grey border-opacity-30 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-green focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              {errors.donationToken && (
                <p className="mt-1 text-sm text-charity-red">{errors.donationToken}</p>
              )}
              <p className="mt-1 text-xs text-slate-grey opacity-70">
                Use 0x0000000000000000000000000000000000000000 for ETH
              </p>
            </div>

            {/* Goal */}
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
                  Add Milestone
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
                    className="p-4 border border-slate-grey border-opacity-20 rounded-lg space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-slate-grey">
                        Milestone {index + 1}
                      </h4>
                      {milestones.length > 1 && (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => removeMilestone(index)}
                          disabled={isPending || isConfirming}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor={`milestone-${index}-description`}
                        className="block text-xs font-medium text-slate-grey mb-1"
                      >
                        Description
                      </label>
                      <input
                        id={`milestone-${index}-description`}
                        type="text"
                        value={milestone.description}
                        onChange={(e) =>
                          updateMilestone(index, "description", e.target.value)
                        }
                        placeholder="Milestone description"
                        disabled={isPending || isConfirming}
                        className="w-full px-3 py-2 text-sm border border-slate-grey border-opacity-30 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-green focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                      {errors[`milestone-${index}`] && (
                        <p className="mt-1 text-xs text-charity-red">
                          {errors[`milestone-${index}`]}
                        </p>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor={`milestone-${index}-amount`}
                        className="block text-xs font-medium text-slate-grey mb-1"
                      >
                        Amount ({tokenName})
                      </label>
                      <input
                        id={`milestone-${index}-amount`}
                        type="number"
                        step="any"
                        min="0"
                        value={milestone.amount}
                        onChange={(e) =>
                          updateMilestone(index, "amount", e.target.value)
                        }
                        placeholder="0.00"
                        disabled={isPending || isConfirming}
                        className="w-full px-3 py-2 text-sm border border-slate-grey border-opacity-30 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-green focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={closeCreateProjectModal}
                disabled={isPending || isConfirming}
                fullWidth
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isPending || isConfirming}
                disabled={isPending || isConfirming}
                fullWidth
              >
                {isPending ? "Confirming..." : isConfirming ? "Processing..." : "Create Project"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}

