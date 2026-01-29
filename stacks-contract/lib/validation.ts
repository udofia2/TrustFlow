import { isAddress } from "viem";

/**
 * Validation result type
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate donation amount
 * @param amount - Amount string to validate
 * @returns true if valid, false otherwise
 */
export function validateAmount(amount: string): boolean {
  if (!amount || amount.trim() === "") {
    return false;
  }

  const numValue = parseFloat(amount);
  return !isNaN(numValue) && numValue > 0;
}

/**
 * Validate fundraising goal
 * @param goal - Goal string to validate
 * @returns true if valid, false otherwise
 */
export function validateGoal(goal: string): boolean {
  if (!goal || goal.trim() === "") {
    return false;
  }

  const numValue = parseFloat(goal);
  return !isNaN(numValue) && numValue > 0;
}

/**
 * Validate milestone arrays
 * @param descriptions - Array of milestone descriptions
 * @param amounts - Array of milestone amounts
 * @returns Validation result with error message if invalid
 */
export function validateMilestoneArrays(
  descriptions: string[],
  amounts: string[]
): ValidationResult {
  // Check if arrays have same length
  if (descriptions.length !== amounts.length) {
    return {
      valid: false,
      error: "Milestone descriptions and amounts must have the same length",
    };
  }

  // Check if at least one milestone
  if (descriptions.length === 0) {
    return {
      valid: false,
      error: "At least one milestone is required",
    };
  }

  // Check if all descriptions are non-empty
  for (let i = 0; i < descriptions.length; i++) {
    if (!descriptions[i] || descriptions[i].trim() === "") {
      return {
        valid: false,
        error: `Milestone ${i + 1} description is required`,
      };
    }
  }

  // Check if all amounts are valid
  for (let i = 0; i < amounts.length; i++) {
    if (!validateAmount(amounts[i])) {
      return {
        valid: false,
        error: `Milestone ${i + 1} amount must be greater than 0`,
      };
    }
  }

  return { valid: true };
}

/**
 * Validate that sum of milestone amounts doesn't exceed goal
 * @param amounts - Array of milestone amount strings
 * @param goal - Goal amount string
 * @returns Validation result with error message if invalid
 */
export function validateMilestoneSum(
  amounts: string[],
  goal: string
): ValidationResult {
  if (!validateGoal(goal)) {
    return {
      valid: false,
      error: "Invalid goal amount",
    };
  }

  const goalNum = parseFloat(goal);
  let totalAmount = 0;

  for (const amount of amounts) {
    if (!validateAmount(amount)) {
      return {
        valid: false,
        error: "All milestone amounts must be valid",
      };
    }
    totalAmount += parseFloat(amount);
  }

  if (totalAmount > goalNum) {
    return {
      valid: false,
      error: `Total milestone amounts (${totalAmount.toFixed(2)}) exceed goal (${goal})`,
    };
  }

  return { valid: true };
}

/**
 * Validate Ethereum address
 * @param address - Address string to validate
 * @returns true if valid address, false otherwise
 */
export function validateAddress(address: string): boolean {
  if (!address || address.trim() === "") {
    return false;
  }

  try {
    return isAddress(address);
  } catch {
    return false;
  }
}

