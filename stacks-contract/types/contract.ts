import { type Address } from "viem";

/**
 * Project data structure matching the contract
 */
export interface Project {
  id: bigint;
  ngo: Address;
  donationToken: Address; // address(0) = ETH
  goal: bigint;
  totalDonated: bigint;
  balance: bigint;
  currentMilestone: bigint;
  isActive: boolean;
  isCompleted: boolean;
}

/**
 * Milestone data structure matching the contract
 */
export interface Milestone {
  description: string;
  amountRequested: bigint;
  approved: boolean;
  fundsReleased: boolean;
  voteWeight: bigint;
}

/**
 * Voting status for a milestone
 */
export interface VoteStatus {
  voteWeight: bigint;
  snapshot: bigint;
  canRelease: boolean;
}

