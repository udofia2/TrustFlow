import { Cl } from "@stacks/transactions";

/**
 * Test utilities and helper functions for Ilenoid contract tests
 */

export const CONTRACT_NAME = "ilenoid";

/**
 * Get test accounts from simnet
 */
export function getAccounts() {
  const accounts = simnet.getAccounts();
  return {
    deployer: accounts.get("deployer")!,
    wallet1: accounts.get("wallet_1")!,
    wallet2: accounts.get("wallet_2")!,
    wallet3: accounts.get("wallet_3")!,
    wallet4: accounts.get("wallet_4")!,
    wallet5: accounts.get("wallet_5")!,
  };
}

/**
 * Register an NGO (must be called by deployer/owner)
 */
export function registerNGO(ngo: string, caller: string = "deployer") {
  const accounts = getAccounts();
  const callerAccount = caller === "deployer" ? accounts.deployer : accounts[caller as keyof typeof accounts];
  
  return simnet.callPublicFn(
    CONTRACT_NAME,
    "register-ngo",
    [Cl.principal(ngo)],
    callerAccount
  );
}

/**
 * Revoke NGO status (must be called by deployer/owner)
 */
export function revokeNGO(ngo: string, caller: string = "deployer") {
  const accounts = getAccounts();
  const callerAccount = caller === "deployer" ? accounts.deployer : accounts[caller as keyof typeof accounts];
  
  return simnet.callPublicFn(
    CONTRACT_NAME,
    "revoke-ngo",
    [Cl.principal(ngo)],
    callerAccount
  );
}

/**
 * Create a test project
 * @param ngo - The NGO address (used as tx-sender, must be verified)
 * @param goal - The fundraising goal
 * @param descriptions - List of milestone descriptions
 * @param amounts - List of milestone amounts
 * @param donationToken - Optional token contract address (null for STX projects)
 */
export function createProject(
  ngo: string,
  goal: number,
  descriptions: string[],
  amounts: number[],
  donationToken: string | null = null
) {
  const accounts = getAccounts();
  const ngoAccount = accounts[ngo as keyof typeof accounts] || ngo;
  
  return simnet.callPublicFn(
    CONTRACT_NAME,
    "create-project",
    [
      donationToken ? Cl.some(Cl.principal(donationToken)) : Cl.none(), // donation-token (first param)
      Cl.uint(goal), // goal
      Cl.list(descriptions.map(d => Cl.stringUtf8(d))), // descriptions
      Cl.list(amounts.map(a => Cl.uint(a))), // amounts
    ],
    typeof ngoAccount === "string" ? ngoAccount : ngo // NGO is tx-sender, not a parameter
  );
}

/**
 * Make an STX donation to a project
 */
export function donateSTX(projectId: number, amount: number, donor: string) {
  const accounts = getAccounts();
  const donorAccount = accounts[donor as keyof typeof accounts] || donor;
  
  return simnet.callPublicFn(
    CONTRACT_NAME,
    "donate",
    [Cl.uint(projectId), Cl.uint(amount)],
    typeof donorAccount === "string" ? donorAccount : donor
  );
}

/**
 * Make a token donation to a project
 */
export function donateToken(
  projectId: number,
  tokenContract: string,
  amount: number,
  donor: string
) {
  const accounts = getAccounts();
  const donorAccount = accounts[donor as keyof typeof accounts] || donor;
  
  return simnet.callPublicFn(
    CONTRACT_NAME,
    "donate-token",
    [Cl.uint(projectId), Cl.principal(tokenContract), Cl.uint(amount)],
    typeof donorAccount === "string" ? donorAccount : donor
  );
}

/**
 * Vote on a milestone
 */
export function voteOnMilestone(projectId: number, voter: string) {
  const accounts = getAccounts();
  const voterAccount = accounts[voter as keyof typeof accounts] || voter;
  
  return simnet.callPublicFn(
    CONTRACT_NAME,
    "vote-on-milestone",
    [Cl.uint(projectId)],
    typeof voterAccount === "string" ? voterAccount : voter
  );
}

/**
 * Release funds for a milestone
 * @param projectId - The project ID
 * @param ngo - The NGO address
 * @param tokenTrait - SIP-010 trait reference (optional, uses contract's own trait for STX projects)
 */
export function releaseFunds(projectId: number, ngo: string, tokenTrait?: { address: string; contract: string }) {
  const accounts = getAccounts();
  const ngoAccount = accounts[ngo as keyof typeof accounts] || ngo;
  
  // Use contract's own trait as default (works for STX projects since they use the 'none' branch)
  // For token projects, pass the actual token contract trait
  const trait = tokenTrait || { address: accounts.deployer, contract: CONTRACT_NAME };
  
  return simnet.callPublicFn(
    CONTRACT_NAME,
    "release-funds",
    [Cl.uint(projectId), Cl.contractPrincipal(trait.address, trait.contract)],
    typeof ngoAccount === "string" ? ngoAccount : ngo
  );
}

/**
 * Pause the contract
 */
export function pauseContract(caller: string = "deployer") {
  const accounts = getAccounts();
  const callerAccount = caller === "deployer" ? accounts.deployer : accounts[caller as keyof typeof accounts];
  
  return simnet.callPublicFn(
    CONTRACT_NAME,
    "pause",
    [],
    callerAccount
  );
}

/**
 * Unpause the contract
 */
export function unpauseContract(caller: string = "deployer") {
  const accounts = getAccounts();
  const callerAccount = caller === "deployer" ? accounts.deployer : accounts[caller as keyof typeof accounts];
  
  return simnet.callPublicFn(
    CONTRACT_NAME,
    "unpause",
    [],
    callerAccount
  );
}

/**
 * Emergency withdraw from a project
 * @param projectId - The project ID
 * @param caller - The caller address (default: deployer)
 * @param tokenTrait - SIP-010 trait reference (optional, uses contract's own trait for STX projects)
 */
export function emergencyWithdraw(projectId: number, caller: string = "deployer", tokenTrait?: { address: string; contract: string }) {
  const accounts = getAccounts();
  const callerAccount = caller === "deployer" ? accounts.deployer : accounts[caller as keyof typeof accounts];
  
  // Use contract's own trait as default (works for STX projects since they use the 'none' branch)
  // For token projects, pass the actual token contract trait
  const trait = tokenTrait || { address: accounts.deployer, contract: CONTRACT_NAME };
  
  return simnet.callPublicFn(
    CONTRACT_NAME,
    "emergency-withdraw",
    [Cl.uint(projectId), Cl.contractPrincipal(trait.address, trait.contract)],
    callerAccount
  );
}

/**
 * Read-only helper: Get project
 */
export function getProject(projectId: number) {
  return simnet.callReadOnlyFn(
    CONTRACT_NAME,
    "get-project",
    [Cl.uint(projectId)],
    getAccounts().deployer
  );
}

/**
 * Read-only helper: Get milestone
 */
export function getMilestone(projectId: number, milestoneId: number) {
  return simnet.callReadOnlyFn(
    CONTRACT_NAME,
    "get-milestone",
    [Cl.uint(projectId), Cl.uint(milestoneId)],
    getAccounts().deployer
  );
}

/**
 * Read-only helper: Get donor contribution
 */
export function getDonorContribution(projectId: number, donor: string) {
  const accounts = getAccounts();
  const donorAccount = accounts[donor as keyof typeof accounts] || donor;
  
  return simnet.callReadOnlyFn(
    CONTRACT_NAME,
    "get-donor-contribution",
    [Cl.uint(projectId), Cl.principal(typeof donorAccount === "string" ? donorAccount : donor)],
    typeof donorAccount === "string" ? donorAccount : donor
  );
}

/**
 * Read-only helper: Get milestone vote status
 */
export function getMilestoneVoteStatus(projectId: number, milestoneId: number) {
  return simnet.callReadOnlyFn(
    CONTRACT_NAME,
    "get-milestone-vote-status",
    [Cl.uint(projectId), Cl.uint(milestoneId)],
    getAccounts().deployer
  );
}

/**
 * Read-only helper: Check if NGO is verified
 */
export function isVerifiedNGO(ngo: string) {
  return simnet.callReadOnlyFn(
    CONTRACT_NAME,
    "is-verified-ngo",
    [Cl.principal(ngo)],
    getAccounts().deployer
  );
}

/**
 * Get project counter from data variable
 */
export function getProjectCounter() {
  return simnet.getDataVar(CONTRACT_NAME, "project-counter");
}

/**
 * Get contract paused state
 */
export function getContractPaused() {
  return simnet.getDataVar(CONTRACT_NAME, "contract-paused");
}

/**
 * Get project balance from project struct
 */
export function getProjectBalance(projectId: number) {
  const project = getProject(projectId);
  if (project.result.type === 1) { // some
    return project.result.value.balance;
  }
  return null;
}

