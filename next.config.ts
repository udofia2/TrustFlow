import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Redirects for Farcaster Mini App manifest
  // NOTE: If using local manifest file, remove this redirect
  // If using hosted manifest, uncomment and update the destination URL
  // async redirects() {
  //   return [
  //     {
  //       source: '/.well-known/farcaster.json',
  //       destination: 'https://api.farcaster.xyz/miniapps/hosted-manifest/019bfed2-59ed-504b-3d87-b0835eeba621',
  //       permanent: false,
  //     },
  //   ];
  // },
  // Enable bundle analyzer when ANALYZE=true
  ...(process.env.ANALYZE === "true" && {
    webpack: (config: any) => {
      if (config.optimization) {
        config.optimization.splitChunks = {
          chunks: "all",
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk for large libraries
            vendor: {
              name: "vendor",
              chunks: "all",
              test: /node_modules/,
              priority: 20,
            },
            // Wagmi chunk
            wagmi: {
              name: "wagmi",
              chunks: "all",
              test: /[\\/]node_modules[\\/](wagmi|@wagmi|viem)[\\/]/,
              priority: 30,
            },
            // React Query chunk
            reactQuery: {
              name: "react-query",
              chunks: "all",
              test: /[\\/]node_modules[\\/]@tanstack[\\/]react-query[\\/]/,
              priority: 30,
            },
          },
        };
      }
      return config;
    },
  }),
};

export default nextConfig;
