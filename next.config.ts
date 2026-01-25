import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Redirects for Facaster Mini App manifest
  // Uncomment and add your hosted manifest ID when ready
  // You can get your hosted manifest ID from: https://farcaster.xyz/~/developers/mini-apps/manifest
  async redirects() {
    return [
      // Example redirect for hosted manifests (uncomment when ready):
      // {
      //   source: '/.well-known/farcaster.json',
      //   destination: 'https://api.farcaster.xyz/miniapps/hosted-manifest/YOUR_MANIFEST_ID',
      //   permanent: false,
      // },
    ];
  },
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
