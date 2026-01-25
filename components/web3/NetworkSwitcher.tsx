"use client";

import { useConnection, useSwitchChain } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";

const BASE_SEPOLIA_CHAIN_ID = 84532;

/**
 * NetworkSwitcher component for checking and switching to Base Sepolia
 */
export function NetworkSwitcher() {
  const { chain, isConnected } = useConnection();
  const switchChain = useSwitchChain();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle switch errors
  useEffect(() => {
    if (switchChain.error) {
      toast.error(
        switchChain.error.message || "Failed to switch network. Please switch manually."
      );
    }
  }, [switchChain.error]);

  // Handle successful switch
  useEffect(() => {
    if (chain?.id === BASE_SEPOLIA_CHAIN_ID) {
      toast.success("Switched to Base Sepolia");
    }
  }, [chain?.id]);

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  if (!isConnected) {
    return null;
  }

  const isCorrectNetwork = chain?.id === BASE_SEPOLIA_CHAIN_ID;

  const handleSwitchNetwork = () => {
    try {
      switchChain.mutate({ chainId: BASE_SEPOLIA_CHAIN_ID });
    } catch (err) {
      toast.error("Failed to switch network");
    }
  };

  if (isCorrectNetwork) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-emerald-green bg-opacity-10 rounded-lg">
        <div className="w-2 h-2 bg-emerald-green rounded-full"></div>
        <span className="text-sm font-medium text-slate-grey">
          {chain?.name || "Base Sepolia"}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 px-4 py-2 bg-charity-red bg-opacity-10 rounded-lg">
        <div className="w-2 h-2 bg-charity-red rounded-full"></div>
        <span className="text-sm font-medium text-slate-grey">
          Wrong Network: {chain?.name || "Unknown"}
        </span>
      </div>
      <Button
        variant="secondary"
        size="sm"
        onClick={handleSwitchNetwork}
        isLoading={switchChain.isPending}
        disabled={switchChain.isPending}
      >
        Switch to Base Sepolia
      </Button>
    </div>
  );
}

