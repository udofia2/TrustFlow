import { type Project } from "@/types/contract";

/**
 * Extra display metadata attached to demo projects.
 * These fields are optional on real on-chain projects.
 */
export interface DemoMeta {
  name: string;
  description: string;
  category: string;
  /** Human-readable symbol to bypass env-based token detection */
  tokenSymbol: "ETH" | "USDC";
  totalMilestones: number;
  /** Label for the milestone currently being worked on / voted on */
  currentMilestoneLabel: string;
  /** Approximate vote quorum percentage (0-100) for the current milestone */
  voteQuorumPct: number;
}

export type DemoProject = Project & DemoMeta;

// ── Shared fake NGO addresses ────────────────────────────────────────────────
const NGO = {
  waterAid:   "0x1A2b3C4d5E6f7A8b9C0d1E2f3A4b5C6d7E8f9A0b" as const,
  eduGirls:   "0x2B3c4D5e6F7a8B9c0D1e2F3a4B5c6D7e8F9a0B1" as const,
  foodRelief: "0x3C4d5E6f7A8b9C0d1E2f3A4b5C6d7E8f9A0b1C2" as const,
  reforest:   "0x4D5e6F7a8B9c0D1e2F3a4B5c6D7e8F9a0B1c2D3" as const,
  solarEdu:   "0x5E6f7A8b9C0d1E2f3A4b5C6d7E8f9A0b1C2d3E4" as const,
  medSupply:  "0x6F7a8B9c0D1e2F3a4B5c6D7e8F9a0B1c2D3e4F5" as const,
} as const;

// address(0) = ETH; placeholder USDC = real Base mainnet USDC address
const ETH_TOKEN  = "0x0000000000000000000000000000000000000000" as const;
const USDC_TOKEN = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const;

// Convenience: bigint ETH helpers
const eth  = (n: number) => BigInt(Math.round(n * 1e9)) * BigInt(1e9); // avoids float precision issues
const usdc = (n: number) => BigInt(Math.round(n * 1e6));

/**
 * Six demo projects covering every use-case of the Transparent Charity Tracker:
 *
 *  1. Active · Early stage         — fresh project, low donations, milestone 0 in progress
 *  2. Active · Voting in progress  — current milestone pending donor approval (>50% funded)
 *  3. Active · Quorum met          — vote weight passed 50%, NGO can release funds
 *  4. Active · Fully funded        — goal exceeded, deep into milestone cycle
 *  5. Completed                    — all milestones done, every fund released
 *  6. Active · USDC / zero donors  — brand-new USDC project with no donations yet
 */
export const DEMO_PROJECTS: DemoProject[] = [
  // ── 1. EARLY STAGE ──────────────────────────────────────────────────────
  {
    id: BigInt(1),
    ngo: NGO.waterAid,
    donationToken: ETH_TOKEN,
    goal:          eth(5),
    totalDonated:  eth(1.4),
    balance:       eth(1.4),
    currentMilestone: BigInt(0),
    isActive:    true,
    isCompleted: false,

    name:        "Clean Water Initiative",
    description: "Drilling 10 boreholes across three rural villages in northern Nigeria to provide safe drinking water for 4,000+ residents.",
    category:    "Water & Sanitation",
    tokenSymbol: "ETH",
    totalMilestones: 3,
    currentMilestoneLabel: "Site survey & geological assessment",
    voteQuorumPct: 0,
  },

  // ── 2. VOTING IN PROGRESS ────────────────────────────────────────────────
  {
    id: BigInt(2),
    ngo: NGO.eduGirls,
    donationToken: ETH_TOKEN,
    goal:          eth(8),
    totalDonated:  eth(5.2),
    balance:       eth(3.7),   // 1.5 ETH already released for milestone 0
    currentMilestone: BigInt(1),
    isActive:    true,
    isCompleted: false,

    name:        "Girls Education Fund",
    description: "Funding school fees, uniforms, and learning materials for 200 girls in rural Ghana who dropped out due to financial barriers.",
    category:    "Education",
    tokenSymbol: "ETH",
    totalMilestones: 4,
    currentMilestoneLabel: "Enrol 200 girls & distribute supplies",
    voteQuorumPct: 38,   // 38% of weighted votes cast — voting ongoing
  },

  // ── 3. QUORUM MET — READY TO RELEASE ────────────────────────────────────
  {
    id: BigInt(3),
    ngo: NGO.foodRelief,
    donationToken: USDC_TOKEN,
    goal:          usdc(10_000),
    totalDonated:  usdc(8_500),
    balance:       usdc(4_000),  // 4,500 USDC released for milestone 0
    currentMilestone: BigInt(1),
    isActive:    true,
    isCompleted: false,

    name:        "Emergency Food Relief — Sahel",
    description: "Procuring and distributing 50-tonne food parcels to 1,200 internally displaced families in the Sahel region.",
    category:    "Humanitarian Aid",
    tokenSymbol: "USDC",
    totalMilestones: 3,
    currentMilestoneLabel: "Distribute second food parcel batch",
    voteQuorumPct: 67,   // >50% quorum reached — NGO can now call releaseFunds()
  },

  // ── 4. FULLY FUNDED — MID MILESTONE CYCLE ───────────────────────────────
  {
    id: BigInt(4),
    ngo: NGO.reforest,
    donationToken: ETH_TOKEN,
    goal:          eth(3),
    totalDonated:  eth(3.2),   // 7% overfunded
    balance:       eth(1.1),   // 2.1 ETH released over two milestones
    currentMilestone: BigInt(2),
    isActive:    true,
    isCompleted: false,

    name:        "Amazon Reforestation Project",
    description: "Planting 50,000 native tree seedlings across 120 hectares of degraded Amazon land in partnership with local indigenous communities.",
    category:    "Environment",
    tokenSymbol: "ETH",
    totalMilestones: 4,
    currentMilestoneLabel: "Plant seedlings in zones C & D",
    voteQuorumPct: 55,
  },

  // ── 5. COMPLETED ─────────────────────────────────────────────────────────
  {
    id: BigInt(5),
    ngo: NGO.solarEdu,
    donationToken: ETH_TOKEN,
    goal:          eth(6),
    totalDonated:  eth(6.3),
    balance:       eth(0),     // all funds released
    currentMilestone: BigInt(3),
    isActive:    false,
    isCompleted: true,

    name:        "Solar Panels for Rural Schools",
    description: "Successfully installed 480 solar panels across 12 off-grid schools in Kenya, powering classrooms and computer labs for 3,600 students.",
    category:    "Energy & Education",
    tokenSymbol: "ETH",
    totalMilestones: 3,
    currentMilestoneLabel: "All milestones completed",
    voteQuorumPct: 100,
  },

  // ── 6. USDC — BRAND NEW, ZERO DONATIONS ──────────────────────────────────
  {
    id: BigInt(6),
    ngo: NGO.medSupply,
    donationToken: USDC_TOKEN,
    goal:          usdc(25_000),
    totalDonated:  usdc(0),
    balance:       usdc(0),
    currentMilestone: BigInt(0),
    isActive:    true,
    isCompleted: false,

    name:        "Medical Supplies Drive — East Africa",
    description: "Sourcing and delivering essential medicines, surgical kits, and diagnostic equipment to three under-resourced clinics in Uganda.",
    category:    "Healthcare",
    tokenSymbol: "USDC",
    totalMilestones: 3,
    currentMilestoneLabel: "Procurement & customs clearance",
    voteQuorumPct: 0,
  },
];
