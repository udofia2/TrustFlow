import { useQuery } from "@tanstack/react-query";
import { Cl } from "@stacks/transactions";
import { ILENOID_CONTRACT_INTERFACE } from "@/lib/contract";
import { callReadOnlyFunction, transformProjectData, transformMilestoneData } from "@/lib/stacks-contract";
import { getStxAddress } from "@/lib/stacks-connect";
import { type Project, type Milestone } from "@/types/contract";
import { toBigInt } from "@/lib/utils";

/**
 * Hook to fetch a single project by ID
 */
export function useProject(projectId: number | bigint): {
  project: Project | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
} {
  const senderAddress = getStxAddress();

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["project", Number(projectId)],
    queryFn: async () => {
      if (!projectId || projectId <= 0) return null;
      
      const result = await callReadOnlyFunction(
        ILENOID_CONTRACT_INTERFACE.readOnly.getProject,
        [Cl.uint(BigInt(projectId))],
        senderAddress || undefined
      );
      
      return transformProjectData(result, Number(projectId));
    },
    enabled: projectId > 0 && !!senderAddress,
  });

  // Convert serialized BigInt strings back to BigInt
  const project = data
    ? {
        ...data,
        id: toBigInt(data.id),
        goal: toBigInt(data.goal),
        totalDonated: toBigInt(data.totalDonated),
        balance: toBigInt(data.balance),
        currentMilestone: toBigInt(data.currentMilestone),
      }
    : undefined;

  return {
    project,
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
  };
}

/**
 * Hook to fetch all projects
 */
export function useAllProjects(): {
  projects: Project[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
} {
  const senderAddress = getStxAddress();

  // First, get the project counter
  const { data: projectCounter, isLoading: isLoadingCounter } = useQuery({
    queryKey: ["projectCounter"],
    queryFn: async () => {
      const result = await callReadOnlyFunction(
        ILENOID_CONTRACT_INTERFACE.readOnly.getProjectCounter,
        [],
        senderAddress || undefined
      );
      return Number(result.value || result || 0);
    },
    enabled: !!senderAddress,
  });

  // Fetch all projects
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["allProjects", projectCounter],
    queryFn: async () => {
      if (!projectCounter || projectCounter === 0) return [];

      const projectIds = Array.from({ length: projectCounter }, (_, i) => i + 1);
      const projects = await Promise.all(
        projectIds.map(async (id) => {
          try {
            const result = await callReadOnlyFunction(
              ILENOID_CONTRACT_INTERFACE.readOnly.getProject,
              [Cl.uint(id)],
              senderAddress || undefined
            );
            return transformProjectData(result, id);
          } catch (error) {
            console.error(`Error fetching project ${id}:`, error);
            return null;
          }
        })
      );

      return projects.filter((p): p is any => p !== null && toBigInt(p.id) > BigInt(0));
    },
    enabled: !!projectCounter && projectCounter > 0 && !!senderAddress,
  });

  // Convert serialized BigInt strings back to BigInt
  const projects = (data || []).map((p: any) => ({
    ...p,
    id: toBigInt(p.id),
    goal: toBigInt(p.goal),
    totalDonated: toBigInt(p.totalDonated),
    balance: toBigInt(p.balance),
    currentMilestone: toBigInt(p.currentMilestone),
  }));

  return {
    projects,
    isLoading: isLoading || isLoadingCounter,
    isError,
    error: error as Error | null,
  };
}

/**
 * Hook to fetch all milestones for a project
 */
export function useProjectMilestones(projectId: number | bigint): {
  milestones: Milestone[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
} {
  const senderAddress = getStxAddress();

  // Get project to find milestone count
  const { project, isLoading: isLoadingProject } = useProject(projectId);

  // Fetch all milestones
  // For Stacks, we need to get milestone count from the project data
  // Since milestoneCount might not be in the Project type, we'll fetch milestones differently
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["projectMilestones", Number(projectId), project?.id ? Number(project.id) : undefined],
    queryFn: async () => {
      if (!project) return [];
      
      // Try to get milestone count - if not available, we'll fetch milestones one by one
      // For now, we'll try fetching up to 10 milestones
      const maxMilestones = 10;

      const milestoneCount = (project as any)?.milestoneCount || maxMilestones;
      const milestoneIds = Array.from({ length: milestoneCount }, (_, i) => i);
      const milestones = await Promise.all(
        milestoneIds.map(async (milestoneId) => {
          try {
            const result = await callReadOnlyFunction(
              ILENOID_CONTRACT_INTERFACE.readOnly.getMilestone,
              [
                Cl.tuple({
                  "project-id": Cl.uint(Number(projectId)),
                  "milestone-id": Cl.uint(milestoneId),
                }),
              ],
              senderAddress || undefined
            );
            return transformMilestoneData(result);
          } catch (error) {
            console.error(`Error fetching milestone ${milestoneId}:`, error);
            return null;
          }
        })
      );

      return milestones.filter((m): m is any => m !== null);
    },
    enabled: !!project && !!senderAddress,
  });

  // Convert serialized BigInt strings back to BigInt
  const milestones = (data || []).map((m: any) => ({
    ...m,
    amountRequested: toBigInt(m.amountRequested),
    voteWeight: toBigInt(m.voteWeight),
  }));

  return {
    milestones,
    isLoading: isLoading || isLoadingProject,
    isError,
    error: error as Error | null,
  };
}

/**
 * Hook to get the current milestone for a project
 * Returns the first incomplete milestone, or the last milestone if all are complete
 */
export function useCurrentMilestone(projectId: number | bigint): {
  milestone: Milestone | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
} {
  const { milestones, isLoading, isError, error } = useProjectMilestones(projectId);

  // Find the first milestone that hasn't been released, or the last one
  const currentMilestone = milestones.find((m) => !m.fundsReleased) || milestones[milestones.length - 1];

  return {
    milestone: currentMilestone,
    isLoading,
    isError,
    error,
  };
}

