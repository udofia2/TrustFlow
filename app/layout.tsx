import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { NetworkError } from "@/components/web3/NetworkError";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Modals } from "@/components/Modals";
import { MiniAppInitializer } from "./MiniAppInitializer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Transparent Charity Tracker",
    template: "%s | Transparent Charity Tracker",
  },
  description: "A transparent blockchain-based charity tracking platform built on Base. Track donations, milestones, and fund releases with full transparency on-chain.",
  keywords: ["charity", "blockchain", "transparency", "donations", "Base", "Web3", "decentralized"],
  authors: [{ name: "TCT Team" }],
  creator: "TCT Team",
  publisher: "TCT Team",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Transparent Charity Tracker",
    title: "Transparent Charity Tracker",
    description: "A transparent blockchain-based charity tracking platform built on Base",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Transparent Charity Tracker",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Transparent Charity Tracker",
    description: "A transparent blockchain-based charity tracking platform built on Base",
    images: ["/og-image.png"],
    creator: "@tct",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <MiniAppInitializer />
        <ErrorBoundary>
          <Providers>
            {children}
            <NetworkError />
            <Modals />
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
