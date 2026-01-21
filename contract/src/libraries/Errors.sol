// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library Errors {
    // ETH Handling
    error DirectETHSendRejected();

    // NGO Management
    error InvalidNGOAddress();
    error NGOAlreadyVerified(address ngo);
    error NGONotVerified(address ngo);
    error NotVerifiedNGO();

    // Project Creation
    error InvalidGoal();
    error InvalidMilestoneArrays();
    error InvalidMilestoneAmount();
    error MilestoneSumExceedsGoal();

    // Donations
    error ProjectNotFound();
    error ProjectNotActive();
    error ProjectAlreadyCompleted();
    error InvalidDonationAmount();
    error InvalidDonationToken();
    error InsufficientAllowance();
    error InsufficientBalance();

    // Voting
    error NoContribution();
    error AlreadyVoted();
    error MilestoneAlreadyApproved();
    error NoCurrentMilestone();

    // Fund Release
    error NotProjectNGO();
    error MilestoneNotApproved();
    error MilestoneAlreadyReleased();
    error InsufficientProjectBalance();
    error QuorumNotMet();
}

