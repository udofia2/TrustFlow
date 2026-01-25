"use client";

import dynamic from "next/dynamic";

// Lazy load modals for code splitting
const DonateModal = dynamic(
  () =>
    import("@/components/donation/DonateModal").then((mod) => ({
      default: mod.DonateModal,
    })),
  {
    ssr: false,
  }
);

const CreateProjectModal = dynamic(
  () =>
    import("@/components/project/CreateProjectModal").then((mod) => ({
      default: mod.CreateProjectModal,
    })),
  {
    ssr: false,
  }
);

/**
 * Client component wrapper for lazy-loaded modals
 * This allows us to use ssr: false with next/dynamic
 */
export function Modals() {
  return (
    <>
      <DonateModal />
      <CreateProjectModal />
    </>
  );
}

