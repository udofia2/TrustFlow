"use client";

import { ProjectList } from "@/components/project/ProjectList";
import { WalletConnect } from "@/components/web3/WalletConnect";
import { NetworkSwitcher } from "@/components/web3/NetworkSwitcher";
import Link from "next/link";

/**
 * Home page with project listing
 */
export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-deep-blue text-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold">Transparent Charity Tracker</h1>
              <p className="text-sm opacity-90 mt-1">
                Blockchain-powered transparent charity donations
              </p>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <Link href="/ngo/dashboard" className="text-white hover:underline text-sm">
                NGO Dashboard
              </Link>
              <NetworkSwitcher />
              <WalletConnect />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-grey mb-2">
              Active Projects
            </h2>
            <p className="text-slate-grey opacity-70">
              Discover and support transparent charity projects on Base
            </p>
          </div>
          <Link href="/project/create">
            <button className="px-6 py-2 bg-emerald-green text-white rounded-lg hover:bg-emerald-green-hover transition-colors font-medium">
              Create Project
            </button>
          </Link>
        </div>

        {/* Project List */}
        <ProjectList />
      </main>

      {/* Footer */}
      <footer className="bg-slate-grey text-white mt-12 py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm opacity-80">
            Built on Base Sepolia • Transparent • Trustless • Decentralized
          </p>
        </div>
      </footer>
    </div>
  );
}
