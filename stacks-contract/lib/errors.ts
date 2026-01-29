/**
 * Error parsing utility for contract errors
 * Maps contract revert reasons to user-friendly messages
 */

/**
 * Type guard to check if error has a message property
 */
function hasMessage(error: unknown): error is { message: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  );
}

/**
 * Type guard to check if error is an Error instance
 */
function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Parse contract error and return user-friendly message
 * @param error - The error to parse (unknown type)
 * @returns User-friendly error message string
 */
export function parseContractError(error: unknown): string {
  // Handle Error instances
  if (isError(error)) {
    const message = error.message.toLowerCase();

    // Map common contract errors
    if (message.includes("notverifiedngo") || message.includes("not verified ngo")) {
      return "Address is not a verified NGO";
    }
    if (message.includes("projectnotfound") || message.includes("project not found")) {
      return "Project not found";
    }
    if (message.includes("quorumnotmet") || message.includes("quorum not met")) {
      return "Quorum not met. More votes needed.";
    }
    if (message.includes("alreadyvoted") || message.includes("already voted")) {
      return "You have already voted on this milestone";
    }
    if (
      message.includes("insufficientbalance") ||
      message.includes("insufficient balance")
    ) {
      return "Insufficient balance";
    }
    if (message.includes("projectnotactive") || message.includes("project is not active")) {
      return "Project is not active";
    }
    if (
      message.includes("projectalreadycompleted") ||
      message.includes("project already completed")
    ) {
      return "Project is already completed";
    }
    if (
      message.includes("invaliddonationamount") ||
      message.includes("invalid donation amount")
    ) {
      return "Donation amount must be greater than 0";
    }
    if (
      message.includes("invaliddonationtoken") ||
      message.includes("invalid donation token")
    ) {
      return "Invalid donation token type";
    }
    if (
      message.includes("milestonealreadyapproved") ||
      message.includes("milestone already approved")
    ) {
      return "Milestone already approved";
    }
    if (
      message.includes("milestonealreadyreleased") ||
      message.includes("milestone already released")
    ) {
      return "Funds already released for this milestone";
    }
    if (message.includes("user rejected") || message.includes("user rejected the request")) {
      return "Transaction was rejected";
    }
    if (message.includes("network") || message.includes("connection")) {
      return "Network error. Please check your connection.";
    }

    // Return original message if no mapping found
    return error.message;
  }

  // Handle errors with message property
  if (hasMessage(error)) {
    return parseContractError(new Error(error.message));
  }

  // Handle user rejection (common in wallet interactions)
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === 4001
  ) {
    return "Transaction was rejected";
  }

  // Handle network errors
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    ((error as { code: unknown }).code === "NETWORK_ERROR" ||
      (error as { code: unknown }).code === "ECONNREFUSED")
  ) {
    return "Network error. Please check your connection.";
  }

  // Generic fallback
  return "An error occurred. Please try again.";
}

