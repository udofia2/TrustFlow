// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ICharityTracker {
    // Events
    event NGORegistered(address indexed ngo);
    event NGORevoked(address indexed ngo);
    event ProjectCreated(uint256 indexed projectId, address indexed ngo);
    event DonationReceived(uint256 indexed projectId, address indexed donor, uint256 amount);
    event MilestoneVoted(
        uint256 indexed projectId,
        uint256 indexed milestoneId,
        address indexed voter,
        uint256 weight
    );
    event FundsReleased(uint256 indexed projectId, uint256 indexed milestoneId, uint256 amount);
    event ProjectCompleted(uint256 indexed projectId);

    // NGO Management
    function registerNGO(address ngo) external;
    function revokeNGO(address ngo) external;
    function isVerifiedNGO(address ngo) external view returns (bool);

    // Project Creation
    function createProject(
        address donationToken,
        uint256 goal,
        string[] memory descriptions,
        uint256[] memory amounts
    ) external returns (uint256 projectId);

    // Donations
    function donate(uint256 projectId) external payable;
    function donateERC20(uint256 projectId, uint256 amount) external;

    // Voting
    function voteMilestone(uint256 projectId) external;

    // Fund Release
    function releaseFunds(uint256 projectId) external;

    // Emergency Controls
    function pause() external;
    function unpause() external;
    function emergencyWithdraw(uint256 projectId) external;

    // View Functions
    function getProject(uint256 projectId) external view returns (uint256 id, address ngo, address donationToken, uint256 goal, uint256 totalDonated, uint256 balance, uint256 currentMilestone, bool isActive, bool isCompleted);
    function getProjectMilestoneCount(uint256 projectId) external view returns (uint256);
    function getMilestone(uint256 projectId, uint256 milestoneId) external view returns (string memory description, uint256 amountRequested, bool approved, bool fundsReleased, uint256 voteWeight);
    function getCurrentMilestone(uint256 projectId) external view returns (string memory description, uint256 amountRequested, bool approved, bool fundsReleased, uint256 voteWeight);
    function getDonorContribution(uint256 projectId, address donor) external view returns (uint256);
    function hasDonorVoted(uint256 projectId, uint256 milestoneId, address donor) external view returns (bool);
    function getMilestoneVoteStatus(uint256 projectId, uint256 milestoneId) external view returns (uint256 voteWeight, uint256 snapshot, bool canRelease);
}

