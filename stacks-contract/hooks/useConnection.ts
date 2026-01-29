"use client";

import { useEffect, useState } from "react";
import { isWalletConnected, getStxAddress } from "@/lib/stacks-connect";

/**
 * Hook to get wallet connection status (replaces wagmi's useConnection)
 * Returns connection status and address similar to wagmi's API
 */
export function useConnection() {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | undefined>(undefined);

  useEffect(() => {
    const checkConnection = () => {
      const connected = isWalletConnected();
      const currentAddress = getStxAddress() || undefined;
      setIsConnected(connected);
      setAddress(currentAddress);
    };

    // Check immediately
    checkConnection();

    // Check periodically for changes
    const interval = setInterval(checkConnection, 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    isConnected,
    address: address as `0x${string}` | undefined,
    chain: undefined, // Stacks doesn't have chains like Ethereum
  };
}

