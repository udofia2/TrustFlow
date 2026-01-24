"use client";

import { useState, useEffect } from "react";
import { useAccount, useBalance } from "wagmi";
import { type Address, isAddress, parseEther, parseUnits, formatEther, formatUnits } from "viem";
import { useDonateETH, useDonateERC20 } from "@/hooks/useDonation";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { USDC_ADDRESS } from "@/lib/contract";
import { parseContractError } from "@/lib/errors";
import { validateAmount as validateAmountUtil } from "@/lib/validation";
import toast from "react-hot-toast";

export interface DonateFormProps {
  projectId: number | bigint;
  donationToken: Address;
}

/**
 * DonateForm component for making donations
 */
export function DonateForm({ projectId, donationToken }: DonateFormProps) {
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState<string>("");
  const [error, setError] = useState<string>("");

  // Detect token type
  const isETH = donationToken === "0x0000000000000000000000000000000000000000" || !isAddress(donationToken);
  const isUSDC = donationToken.toLowerCase() === USDC_ADDRESS.toLowerCase();
  const tokenName = isETH ? "ETH" : isUSDC ? "USDC" : "Token";
  const tokenDecimals = isETH ? 18 : isUSDC ? 6 : 18;

  // Get wallet balance
  const { data: ethBalance } = useBalance({
    address,
    query: {
      enabled: isConnected && isETH,
    },
  });

  const { data: tokenBalance } = useBalance({
    address,
    token: !isETH ? donationToken : undefined,
    query: {
      enabled: isConnected && !isETH,
    },
  });

  const balance = isETH ? ethBalance : tokenBalance;
  const formattedBalance = balance
    ? isETH
      ? formatEther(balance.value)
      : formatUnits(balance.value, tokenDecimals)
    : "0";

  // Donation hooks
  const {
    donate: donateETH,
    isPending: isPendingETH,
    isConfirming: isConfirmingETH,
    error: errorETH,
  } = useDonateETH(projectId);

  const {
    donate: donateERC20,
    isPending: isPendingERC20,
    isConfirming: isConfirmingERC20,
    allowance,
    error: errorERC20,
  } = useDonateERC20(projectId, donationToken);

  const isPending = isPendingETH || isPendingERC20 || isConfirmingETH || isConfirmingERC20;
  const donationError = errorETH || errorERC20;

  // Display error from hook if present
  useEffect(() => {
    if (donationError) {
      const errorMessage = parseContractError(donationError);
      setError(errorMessage);
    }
  }, [donationError]);

  // Validate amount
  const validateAmount = (value: string): string => {
    if (!value || value.trim() === "") {
      return "";
    }

    // Use validation utility
    if (!validateAmountUtil(value)) {
      return "Amount must be greater than 0";
    }

    // Check if amount exceeds balance
    if (balance) {
      const numValue = parseFloat(value);
      const balanceNum = parseFloat(formattedBalance);
      if (numValue > balanceNum) {
        return `Insufficient balance. You have ${formattedBalance} ${tokenName}`;
      }
    }

    return "";
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmount(value);
    setError(validateAmount(value));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    // Validate amount
    const validationError = validateAmount(amount);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!isConnected || !address) {
      toast.error("Please connect your wallet");
      return;
    }

    try {
      if (isETH) {
        await donateETH(amount);
      } else {
        await donateERC20(amount, tokenDecimals);
      }
      // Clear form on success (handled by hook's success effect)
      setAmount("");
    } catch (err) {
      // Parse and display error
      const errorMessage = parseContractError(err);
      setError(errorMessage);
      toast.error(errorMessage);
      console.error("Donation error:", err);
    }
  };

  if (!isConnected) {
    return (
      <Card variant="outlined">
        <CardBody>
          <p className="text-center text-slate-grey opacity-70">
            Please connect your wallet to make a donation
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card variant="outlined">
      <CardBody>
        <h3 className="text-lg font-semibold text-slate-grey mb-4">
          Make a Donation
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Balance display */}
          <div className="text-sm">
            <span className="text-slate-grey opacity-70">Your balance: </span>
            <span className="font-medium text-slate-grey">
              {formattedBalance} {tokenName}
            </span>
          </div>

          {/* Amount input */}
          <div>
            <label
              htmlFor="amount"
              className="block text-sm font-medium text-slate-grey mb-2"
            >
              Amount ({tokenName})
            </label>
            <input
              id="amount"
              type="number"
              step="any"
              min="0"
              value={amount}
              onChange={handleAmountChange}
              placeholder="0.00"
              disabled={isPending}
              className="w-full px-4 py-2 border border-slate-grey border-opacity-30 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-green focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            {error && (
              <p className="mt-1 text-sm text-charity-red">{error}</p>
            )}
          </div>

          {/* Submit button */}
          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={isPending}
            disabled={isPending || !!error || !amount || parseFloat(amount) <= 0}
          >
            {isPending
              ? isConfirmingETH || isConfirmingERC20
                ? "Confirming..."
                : "Processing..."
              : `Donate ${tokenName}`}
          </Button>

          {/* Approval info for ERC20 */}
          {!isETH && allowance > BigInt(0) && (
            <p className="text-xs text-slate-grey opacity-70 text-center">
              Token approved. You can donate up to {formatUnits(allowance, tokenDecimals)} {tokenName}
            </p>
          )}
        </form>
      </CardBody>
    </Card>
  );
}

