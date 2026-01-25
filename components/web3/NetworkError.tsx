"use client";

import { useState, useEffect } from "react";
import { useConnection, useChainId, useSwitchChain } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";

const BASE_SEPOLIA_CHAIN_ID = 84532;

/**
 * NetworkError component for handling network disconnection and wrong network
 */
export function NetworkError() {
  const { isConnected } = useConnection();
  const chainId = useChainId();
  const switchChain = useSwitchChain();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only checking after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render until mounted to prevent false positives
  if (!mounted) {
    return null;
  }

  // Check if wrong network
  const isWrongNetwork = isConnected && chainId !== BASE_SEPOLIA_CHAIN_ID;

  // Check if disconnected
  const isDisconnected = !isConnected;

  // Don't show if everything is fine
  if (!isDisconnected && !isWrongNetwork) {
    return null;
  }

  const handleSwitchNetwork = () => {
    try {
      switchChain.mutate({ chainId: BASE_SEPOLIA_CHAIN_ID });
    } catch (error) {
      console.error("Failed to switch network:", error);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50">
      <Card variant="outlined" className="border-charity-red border-2 bg-white shadow-lg">
        <CardBody>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-3 h-3 bg-charity-red rounded-full mt-1"></div>
            </div>
            <div className="flex-1">
              {isDisconnected ? (
                <>
                  <h3 className="text-sm font-semibold text-charity-red mb-1">
                    Wallet Disconnected
                  </h3>
                  <p className="text-xs text-slate-grey opacity-70 mb-2">
                    Please connect your wallet to use this application.
                  </p>
                </>
              ) : isWrongNetwork ? (
                <>
                  <h3 className="text-sm font-semibold text-charity-red mb-1">
                    Wrong Network
                  </h3>
                  <p className="text-xs text-slate-grey opacity-70 mb-2">
                    Please switch to Base Sepolia to continue.
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleSwitchNetwork}
                    isLoading={switchChain.isPending}
                    disabled={switchChain.isPending}
                    className="mt-2"
                  >
                    Switch to Base Sepolia
                  </Button>
                </>
              ) : null}
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

