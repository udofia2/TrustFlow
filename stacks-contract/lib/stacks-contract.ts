import { fetchCallReadOnlyFunction, makeContractCall, Cl, cvToJSON, cvToValue } from "@stacks/transactions";
import { stacksNetwork, ILENOID_CONTRACT_ADDRESS, isMainnet } from "./stacks";
import { ILENOID_CONTRACT_NAME, ILENOID_CONTRACT_INTERFACE } from "./contract";
import { requestStacksMethod } from "./stacks-connect";
import { serializeBigInt } from "./utils";

/**
 * Utility functions for interacting with Ilenoid Clarity contract
 */

/**
 * Make a read-only contract call
 */
export async function callReadOnlyFunction(
  functionName: string,
  functionArgs: any[] = [],
  senderAddress?: string
): Promise<any> {
  try {
    const response = await fetchCallReadOnlyFunction({
      contractAddress: ILENOID_CONTRACT_ADDRESS,
      contractName: ILENOID_CONTRACT_NAME,
      functionName,
      functionArgs,
      senderAddress: senderAddress || ILENOID_CONTRACT_ADDRESS,
      network: stacksNetwork,
    });

    // Handle response types (ok/err)
    if (response.type === "ok") {
      return cvToJSON(response.value);
    } else {
      const errorValue = (response as any).value;
      throw new Error(`Contract error: ${JSON.stringify(errorValue)}`);
    }
  } catch (error) {
    console.error(`Error calling ${functionName}:`, error);
    throw error;
  }
}

/**
 * Make a contract call transaction (requires wallet)
 */
export async function callContractFunction(
  functionName: string,
  functionArgs: any[] = [],
  postConditions?: any[],
  postConditionMode: "deny" | "allow" = "deny"
): Promise<string> {
  try {
    const response = await requestStacksMethod("stx_callContract", {
      contract: `${ILENOID_CONTRACT_ADDRESS}.${ILENOID_CONTRACT_NAME}`,
      functionName,
      functionArgs,
      network: isMainnet ? "mainnet" : "testnet",
      postConditions: postConditions || [],
      postConditionMode,
    });

    return response.txid;
  } catch (error) {
    console.error(`Error calling ${functionName}:`, error);
    throw error;
  }
}

/**
 * Make a contract call with STX transfer (for donations)
 */
export async function callContractFunctionWithSTX(
  functionName: string,
  functionArgs: any[] = [],
  stxAmount: bigint,
  senderAddress: string
): Promise<string> {
  try {
    // Import Pc for post-conditions
    const { Pc } = await import("@stacks/transactions");
    
    // Create post-condition to ensure exact STX amount is sent
    const postCondition = Pc.principal(senderAddress)
      .willSendEq(stxAmount)
      .ustx();

    const response = await requestStacksMethod("stx_callContract", {
      contract: `${ILENOID_CONTRACT_ADDRESS}.${ILENOID_CONTRACT_NAME}`,
      functionName,
      functionArgs,
      network: isMainnet ? "mainnet" : "testnet",
      postConditions: [postCondition],
      postConditionMode: "deny",
      // Note: The STX transfer happens via the transaction itself
      // The contract will receive the STX and can verify via stx-transfer?
    });

    return response.txid;
  } catch (error) {
    console.error(`Error calling ${functionName} with STX:`, error);
    throw error;
  }
}

/**
 * Transform Clarity project data to Project type
 * BigInt values are serialized to strings for React Query compatibility
 */
export function transformProjectData(data: any, projectId?: number): any {
  if (!data || typeof data !== "object") {
    return null;
  }

  const project = {
    id: BigInt(projectId || 0),
    ngo: data.ngo?.value || data.ngo,
    goal: BigInt(data.goal?.value || data.goal || 0),
    totalDonated: BigInt(data["total-donated"]?.value || data.totalDonated || 0),
    balance: BigInt(data.balance?.value || data.balance || 0),
    currentMilestone: BigInt(data["current-milestone"]?.value || data.currentMilestone || 0),
    milestoneCount: Number(data["milestone-count"]?.value || data.milestoneCount || 0),
    isActive: data["is-active"]?.value ?? data.isActive ?? true,
    isCompleted: data["is-completed"]?.value || data.isCompleted || false,
  };

  // Serialize BigInt values to strings for React Query
  return serializeBigInt(project);
}

/**
 * Transform Clarity milestone data to Milestone type
 * BigInt values are serialized to strings for React Query compatibility
 */
export function transformMilestoneData(data: any): any {
  if (!data || typeof data !== "object") {
    return null;
  }

  const milestone = {
    description: data.description?.value || data.description || "",
    amountRequested: BigInt(data["amount-requested"]?.value || data.amountRequested || data.amount?.value || data.amount || 0),
    approved: data.approved?.value ?? data.approved ?? false,
    fundsReleased: data["funds-released"]?.value ?? data.fundsReleased ?? data["is-released"]?.value ?? data.isReleased ?? false,
    voteWeight: BigInt(data["vote-weight"]?.value || data.voteWeight || 0),
  };

  // Serialize BigInt values to strings for React Query
  return serializeBigInt(milestone);
}

/**
 * Clarity value helpers for common types
 */
export const ClarityValues = {
  uint: (value: number | bigint) => Cl.uint(value),
  principal: (address: string) => Cl.standardPrincipal(address),
  list: (items: any[]) => Cl.list(items),
  bool: (value: boolean) => Cl.bool(value),
  string: (value: string) => Cl.stringUtf8(value),
  some: (value: any) => Cl.some(value),
  none: () => Cl.none(),
};

