"use client";

import { useState, useMemo } from "react";
import { useAllProjects } from "@/hooks/useProject";
import { ProjectCard } from "./ProjectCard";
import { ProjectListSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { type Project } from "@/types/contract";
import { DEMO_PROJECTS, type DemoProject } from "@/lib/demoProjects";

type FilterStatus = "all" | "active" | "completed";

export interface ProjectListProps {
  searchQuery?: string;
}

/**
 * ProjectList component.
 *
 * When the chain returns 0 projects (no wallet connected / empty contract)
 * we fall back to DEMO_PROJECTS so judges, visitors, and testers always
 * see a fully-populated, realistic listing that demonstrates every
 * use-case of the platform.
 */
export function ProjectList({ searchQuery = "" }: ProjectListProps) {
  const { projects: chainProjects, isLoading, isError, error } = useAllProjects();
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");

  // Use demo data only when the chain returned nothing (not while loading)
  const isDemo = !isLoading && !isError && chainProjects.length === 0;
  const projects: Project[] = isDemo ? DEMO_PROJECTS : chainProjects;

  // Build a lookup so ProjectCard can get DemoMeta for demo projects
  const demoMetaMap = useMemo<Map<string, DemoProject>>(() => {
    const map = new Map<string, DemoProject>();
    DEMO_PROJECTS.forEach((p) => map.set(p.id.toString(), p));
    return map;
  }, []);

  // Filter and search projects
  const filteredProjects = useMemo(() => {
    let filtered: Project[] = projects;

    if (filterStatus === "active") {
      filtered = filtered.filter((p) => p.isActive && !p.isCompleted);
    } else if (filterStatus === "completed") {
      filtered = filtered.filter((p) => p.isCompleted);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((p) => {
        const id = p.id.toString();
        const ngo = p.ngo.toLowerCase();
        // Also search demo name / description / category
        const demo = demoMetaMap.get(id);
        const name = demo?.name?.toLowerCase() ?? "";
        const desc = demo?.description?.toLowerCase() ?? "";
        const cat  = demo?.category?.toLowerCase() ?? "";
        return id.includes(query) || ngo.includes(query) || name.includes(query) || desc.includes(query) || cat.includes(query);
      });
    }

    return filtered;
  }, [projects, filterStatus, searchQuery, demoMetaMap]);

  const activeCount    = useMemo(() => projects.filter((p) =>  p.isActive && !p.isCompleted).length, [projects]);
  const completedCount = useMemo(() => projects.filter((p) =>  p.isCompleted).length, [projects]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) return <ProjectListSkeleton count={6} />;

  // ── Error ────────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="text-center py-12">
        <p className="text-charity-red mb-2">Failed to load projects</p>
        <p className="text-sm text-slate-grey opacity-70">
          {error?.message || "An error occurred"}
        </p>
      </div>
    );
  }

  // ── Empty after filter ───────────────────────────────────────────────────
  if (filteredProjects.length === 0) {
    return (
      <EmptyState
        variant="default"
        title="No projects match your filters"
        description="Try adjusting your search or filters"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Demo mode notice banner */}
      {isDemo && (
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
          <svg className="w-5 h-5 mt-0.5 shrink-0 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            <strong>Demo mode</strong> — No on-chain projects found for the current network.
            Showing 6 placeholder projects that demonstrate every use-case:{" "}
            <em>early stage, voting in progress, quorum met, fully funded, completed, and USDC-based.</em>{" "}
            Connect your wallet and switch to Base to see live data.
          </span>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(
          [
            { key: "all",       label: `All (${projects.length})` },
            { key: "active",    label: `Active (${activeCount})` },
            { key: "completed", label: `Completed (${completedCount})` },
          ] as const
        ).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilterStatus(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === key
                ? key === "completed"
                  ? "bg-slate-grey text-white"
                  : key === "active"
                  ? "bg-emerald-green text-white"
                  : "bg-deep-blue text-white"
                : "bg-gray-100 text-slate-grey hover:bg-gray-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Project grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => {
          const demo = demoMetaMap.get(project.id.toString());
          return (
            <ProjectCard
              key={project.id.toString()}
              project={project}
              meta={demo}
            />
          );
        })}
      </div>
    </div>
  );
}
