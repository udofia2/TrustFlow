"use client";

import { useConnection, useConnect, useDisconnect, useConnectors } from "wagmi";
import { Button } from "@/components/ui/Button";
import { formatAddress } from "@/lib/utils";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";

/**
 * WalletConnect component for connecting and disconnecting wallets
 */
export function WalletConnect() {
  const { address, isConnected } = useConnection();
  const connect = useConnect();
  const disconnect = useDisconnect();
  const connectors = useConnectors();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle connection errors
  useEffect(() => {
    if (connect.error) {
      toast.error(
        connect.error.message || "Failed to connect wallet. Please try again."
      );
    }
  }, [connect.error]);

  // Handle successful connection
  useEffect(() => {
    if (isConnected && address) {
      toast.success("Wallet connected successfully!");
    }
  }, [isConnected, address]);

  const handleConnect = async () => {
    // Try to connect with the first available connector (usually injected/MetaMask)
    if (connectors.length === 0) {
      toast.error("No wallet connector available. Please install MetaMask or another Web3 wallet.");
      return;
    }

    // Prioritize specific connectors over generic 'injected' connector
    // Prefer MetaMask, then other specific wallets, then generic injected
    let connector = connectors.find((c) => c.id === "io.metamask"); // MetaMask
    if (!connector) {
      connector = connectors.find((c) => c.id === "app.phantom"); // Phantom
    }
    if (!connector) {
      connector = connectors.find((c) => c.id === "walletConnect"); // WalletConnect
    }
    if (!connector) {
      // Fall back to first connector (usually generic injected)
      connector = connectors[0];
    }
    
    // Check if connector is ready (has provider)
    try {
      const provider = await connector.getProvider();
      if (!provider) {
        toast.error("Wallet not detected. Please install MetaMask or another Web3 wallet extension.");
        return;
      }
    } catch (error) {
      toast.error("Unable to connect to wallet. Please ensure your wallet extension is unlocked.");
      return;
    }

    // Attempt connection
    try {
      connect.mutate({ connector });
    } catch (error) {
      toast.error("Failed to connect wallet. Please try again.");
    }
  };

  const handleDisconnect = () => {
    disconnect.mutate();
    toast.success("Wallet disconnected");
  };

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <Button
        variant="primary"
        size="md"
        disabled
      >
        Connect Wallet
      </Button>
    );
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
          <div className="w-2 h-2 bg-emerald-green rounded-full"></div>
          <span className="text-sm font-medium text-slate-grey">
            {formatAddress(address)}
          </span>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleDisconnect}
          disabled={connect.isPending || disconnect.isPending}
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="primary"
      size="md"
      onClick={handleConnect}
      isLoading={connect.isPending}
      disabled={connect.isPending}
    >
      Connect Wallet
    </Button>
  );
}

