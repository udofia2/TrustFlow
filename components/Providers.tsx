"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "@/lib/wagmi";
import { Toaster } from "react-hot-toast";
import { useState } from "react";

/**
 * Root providers component
 * Wraps the app with Wagmi, React Query, and Toast providers
 */
export function Providers({ children }: { children: React.ReactNode }) {
  // Create QueryClient instance
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#333333",
              color: "#ffffff",
            },
            success: {
              iconTheme: {
                primary: "#2ECC71", // Emerald Green
                secondary: "#ffffff",
              },
            },
            error: {
              iconTheme: {
                primary: "#E74C3C", // Charity Red
                secondary: "#ffffff",
              },
            },
          }}
        />
      </QueryClientProvider>
    </WagmiProvider>
  );
}

