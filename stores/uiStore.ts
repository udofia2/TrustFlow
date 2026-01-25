import { create } from "zustand";

/**
 * UI Store interface
 */
interface UIStore {
  // Modal states
  isDonateModalOpen: boolean;
  selectedProjectId: number | bigint | null;
  isCreateProjectModalOpen: boolean;

  // Actions
  openDonateModal: (projectId: number | bigint) => void;
  closeDonateModal: () => void;
  openCreateProjectModal: () => void;
  closeCreateProjectModal: () => void;
}

/**
 * Zustand store for UI state management
 * Manages modal states and selected project IDs
 */
export const useUIStore = create<UIStore>()((set) => ({
  // Initial state
  isDonateModalOpen: false,
  selectedProjectId: null,
  isCreateProjectModalOpen: false,

  // Actions
  openDonateModal: (projectId: number | bigint) =>
    set({
      isDonateModalOpen: true,
      selectedProjectId: projectId,
    }),

  closeDonateModal: () =>
    set({
      isDonateModalOpen: false,
      selectedProjectId: null,
    }),

  openCreateProjectModal: () =>
    set({
      isCreateProjectModalOpen: true,
    }),

  closeCreateProjectModal: () =>
    set({
      isCreateProjectModalOpen: false,
    }),
}));

