// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Errors} from "./libraries/Errors.sol";
import {DataStructures} from "./types/DataStructures.sol";

/// @title CharityTracker
/// @notice Milestone-based charity donation escrow with weighted donor voting (ETH + ERC20).
/// @dev Production-ready contract with full feature implementation.
contract CharityTracker is Ownable, ReentrancyGuard, Pausable {
    using DataStructures for DataStructures.Project;
    using DataStructures for DataStructures.Milestone;
    // =============================================================
    //                           EVENTS
    // =============================================================

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
    event EmergencyWithdrawal(uint256 indexed projectId, uint256 amount);

    // =============================================================
    //                      DATA STRUCTURES
    // =============================================================
    // Note: Structs are defined in DataStructures library
    // Use DataStructures.Project and DataStructures.Milestone

    // =============================================================
    //                         STORAGE
    // =============================================================

    /// @notice Mapping of verified NGO addresses
    mapping(address => bool) public verifiedNGOs;

    /// @notice Counter for project IDs (starts at 1)
    uint256 public projectCounter;

    /// @notice Mapping of project ID to Project struct
    mapping(uint256 => DataStructures.Project) public projects;

    /// @notice Mapping of project ID to milestone ID to Milestone struct
    /// @dev projectId => milestoneId => Milestone
    mapping(uint256 => mapping(uint256 => DataStructures.Milestone)) public milestones;

    /// @notice Mapping of project ID to total number of milestones
    /// @dev projectId => milestone count
    mapping(uint256 => uint256) public projectMilestoneCount;

    /// @notice Mapping of project ID to donor address to contribution amount
    /// @dev projectId => donor => amount
    mapping(uint256 => mapping(address => uint256)) public donorContributions;

    /// @notice Mapping of project ID to total donations received
    /// @dev projectId => total donations
    mapping(uint256 => uint256) public totalProjectDonations;

    /// @notice Mapping of project ID to milestone ID to donor address to vote status
    /// @dev projectId => milestoneId => donor => hasVoted
    mapping(uint256 => mapping(uint256 => mapping(address => bool))) public hasVoted;

    /// @notice Mapping of project ID to milestone ID to donation snapshot at vote start
    /// @dev projectId => milestoneId => total donations at vote start
    mapping(uint256 => mapping(uint256 => uint256)) public milestoneSnapshotDonations;

    // =============================================================
    //                        CONSTRUCTOR
    // =============================================================

    constructor() Ownable(msg.sender) {}

    // =============================================================
    //                      PAUSE CONTROLS
    // =============================================================

    /// @notice Pause the contract (blocks donations and fund releases).
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Unpause the contract.
    function unpause() external onlyOwner {
        _unpause();
    }

    // =============================================================
    //                      NGO MANAGEMENT
    // =============================================================

    /// @notice Register a new NGO as verified
    /// @param ngo The address of the NGO to register
    /// @dev Only owner can register NGOs. Reverts if NGO is already verified or address is zero.
    function registerNGO(address ngo) external onlyOwner {
        if (ngo == address(0)) {
            revert Errors.InvalidNGOAddress();
        }
        if (verifiedNGOs[ngo]) {
            revert Errors.NGOAlreadyVerified(ngo);
        }

        verifiedNGOs[ngo] = true;
        emit NGORegistered(ngo);
    }

    /// @notice Revoke verification status of an NGO
    /// @param ngo The address of the NGO to revoke
    /// @dev Only owner can revoke NGOs. Reverts if NGO is not currently verified.
    function revokeNGO(address ngo) external onlyOwner {
        if (!verifiedNGOs[ngo]) {
            revert Errors.NGONotVerified(ngo);
        }

        verifiedNGOs[ngo] = false;
        emit NGORevoked(ngo);
    }

    /// @notice Check if an address is a verified NGO
    /// @param ngo The address to check
    /// @return True if the address is a verified NGO, false otherwise
    function isVerifiedNGO(address ngo) external view returns (bool) {
        return verifiedNGOs[ngo];
    }

    // =============================================================
    //                      PROJECT CREATION
    // =============================================================

    /// @notice Create a new project with milestones
    /// @param donationToken The token address for donations (address(0) for ETH)
    /// @param goal The total fundraising goal for the project
    /// @param descriptions Array of milestone descriptions
    /// @param amounts Array of milestone funding amounts (must match descriptions length)
    /// @return projectId The ID of the newly created project
    /// @dev Only verified NGOs can create projects. All milestones must be defined upfront.
    ///      Sum of milestone amounts must be <= goal. Milestone IDs start at 0.
    function createProject(
        address donationToken,
        uint256 goal,
        string[] memory descriptions,
        uint256[] memory amounts
    ) external whenNotPaused returns (uint256 projectId) {
        // Check: Caller is verified NGO
        if (!verifiedNGOs[msg.sender]) {
            revert Errors.NotVerifiedNGO();
        }

        // Check: Goal > 0
        if (goal == 0) {
            revert Errors.InvalidGoal();
        }

        // Check: Descriptions and amounts arrays have same length
        if (descriptions.length != amounts.length) {
            revert Errors.InvalidMilestoneArrays();
        }

        // Check: At least one milestone
        if (descriptions.length == 0) {
            revert Errors.InvalidMilestoneArrays();
        }

        // Check: All amounts > 0 and sum <= goal
        uint256 totalAmounts = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            if (amounts[i] == 0) {
                revert Errors.InvalidMilestoneAmount();
            }
            totalAmounts += amounts[i];
        }

        // Check: Sum of amounts <= goal
        if (totalAmounts > goal) {
            revert Errors.MilestoneSumExceedsGoal();
        }

        // Increment project counter (starts at 1)
        projectCounter++;
        projectId = projectCounter;

        // Create and store project
        projects[projectId] = DataStructures.Project({
            id: projectId,
            ngo: msg.sender,
            donationToken: donationToken,
            goal: goal,
            totalDonated: 0,
            balance: 0,
            currentMilestone: 0, // Start at milestone 0
            isActive: true,
            isCompleted: false
        });

        // Store milestone count
        projectMilestoneCount[projectId] = descriptions.length;

        // Initialize all milestones
        for (uint256 i = 0; i < descriptions.length; i++) {
            milestones[projectId][i] = DataStructures.Milestone({
                description: descriptions[i],
                amountRequested: amounts[i],
                approved: false,
                fundsReleased: false,
                voteWeight: 0
            });
        }

        emit ProjectCreated(projectId, msg.sender);
    }

    // =============================================================
    //                      ETH DONATION
    // =============================================================

    /// @notice Donate ETH to a project
    /// @param projectId The ID of the project to donate to
    /// @dev Only works for projects that accept ETH donations. Updates all donation accounting.
    ///      Follows CEI pattern for security. Reverts if project doesn't exist, is inactive,
    ///      is completed, or doesn't accept ETH.
    function donate(uint256 projectId) external payable whenNotPaused nonReentrant {
        // Validation Checks (CEI Pattern - Checks)
        if (projects[projectId].id == 0) {
            revert Errors.ProjectNotFound();
        }
        if (!projects[projectId].isActive) {
            revert Errors.ProjectNotActive();
        }
        if (projects[projectId].isCompleted) {
            revert Errors.ProjectAlreadyCompleted();
        }
        if (msg.value == 0) {
            revert Errors.InvalidDonationAmount();
        }
        if (projects[projectId].donationToken != address(0)) {
            revert Errors.InvalidDonationToken();
        }

        // State Changes (CEI Pattern - Effects)
        donorContributions[projectId][msg.sender] += msg.value;
        totalProjectDonations[projectId] += msg.value;
        projects[projectId].totalDonated += msg.value;
        projects[projectId].balance += msg.value;

        // External Calls (CEI Pattern - Interactions)
        // ETH already received via msg.value (no explicit transfer needed)

        // Events
        emit DonationReceived(projectId, msg.sender, msg.value);
    }

    // =============================================================
    //                    ERC20 DONATION
    // =============================================================

    /// @notice Donate ERC20 tokens to a project
    /// @param projectId The ID of the project to donate to
    /// @param amount The amount of tokens to donate
    /// @dev Only works for projects that accept ERC20 donations. Updates all donation accounting.
    ///      Follows CEI pattern for security. Reverts if project doesn't exist, is inactive,
    ///      is completed, doesn't accept ERC20, or if allowance/balance is insufficient.
    function donateERC20(uint256 projectId, uint256 amount) external whenNotPaused nonReentrant {
        // Validation Checks (CEI Pattern - Checks)
        if (projects[projectId].id == 0) {
            revert Errors.ProjectNotFound();
        }
        if (!projects[projectId].isActive) {
            revert Errors.ProjectNotActive();
        }
        if (projects[projectId].isCompleted) {
            revert Errors.ProjectAlreadyCompleted();
        }
        if (amount == 0) {
            revert Errors.InvalidDonationAmount();
        }
        if (projects[projectId].donationToken == address(0)) {
            revert Errors.InvalidDonationToken();
        }

        // Check allowance and balance
        IERC20 token = IERC20(projects[projectId].donationToken);
        if (token.allowance(msg.sender, address(this)) < amount) {
            revert Errors.InsufficientAllowance();
        }
        if (token.balanceOf(msg.sender) < amount) {
            revert Errors.InsufficientBalance();
        }

        // State Changes (CEI Pattern - Effects)
        donorContributions[projectId][msg.sender] += amount;
        totalProjectDonations[projectId] += amount;
        projects[projectId].totalDonated += amount;
        projects[projectId].balance += amount;

        // External Calls (CEI Pattern - Interactions)
        token.transferFrom(msg.sender, address(this), amount);

        // Events
        emit DonationReceived(projectId, msg.sender, amount);
    }

    // =============================================================
    //                      MILESTONE VOTING
    // =============================================================

    /// @notice Vote on the current milestone for a project
    /// @param projectId The ID of the project to vote on
    /// @dev Only donors with contributions can vote. Vote weight equals total contribution.
    ///      One vote per milestone per donor. Snapshot is taken on first vote to prevent
    ///      donations after voting starts from affecting the quorum calculation.
    function voteMilestone(uint256 projectId) external whenNotPaused {
        // Validation Checks (CEI Pattern - Checks)
        if (projects[projectId].id == 0) {
            revert Errors.ProjectNotFound();
        }

        uint256 currentMilestoneId = projects[projectId].currentMilestone;
        if (currentMilestoneId >= projectMilestoneCount[projectId]) {
            revert Errors.NoCurrentMilestone();
        }

        DataStructures.Milestone storage milestone = milestones[projectId][currentMilestoneId];
        if (milestone.approved) {
            revert Errors.MilestoneAlreadyApproved();
        }

        if (donorContributions[projectId][msg.sender] == 0) {
            revert Errors.NoContribution();
        }

        if (hasVoted[projectId][currentMilestoneId][msg.sender]) {
            revert Errors.AlreadyVoted();
        }

        // Snapshot Logic: Capture total donations at vote start (first vote only)
        if (milestoneSnapshotDonations[projectId][currentMilestoneId] == 0) {
            milestoneSnapshotDonations[projectId][currentMilestoneId] = totalProjectDonations[projectId];
        }

        // State Changes (CEI Pattern - Effects)
        uint256 voteWeight = donorContributions[projectId][msg.sender];
        milestone.voteWeight += voteWeight;
        hasVoted[projectId][currentMilestoneId][msg.sender] = true;

        // Events
        emit MilestoneVoted(projectId, currentMilestoneId, msg.sender, voteWeight);
    }

    // =============================================================
    //                      FUND RELEASE
    // =============================================================

    /// @notice Release funds for the current milestone
    /// @param projectId The ID of the project to release funds for
    /// @dev Only the project's NGO can release funds. Requires >50% quorum from donors.
    ///      Follows CEI pattern for security. Transfers funds (ETH or ERC20) to NGO.
    ///      Marks project as completed if this is the final milestone.
    function releaseFunds(uint256 projectId) external whenNotPaused nonReentrant {
        // Validation Checks (CEI Pattern - Checks)
        if (projects[projectId].id == 0) {
            revert Errors.ProjectNotFound();
        }

        if (msg.sender != projects[projectId].ngo) {
            revert Errors.NotProjectNGO();
        }

        uint256 currentMilestoneId = projects[projectId].currentMilestone;
        if (currentMilestoneId >= projectMilestoneCount[projectId]) {
            revert Errors.NoCurrentMilestone();
        }

        DataStructures.Milestone storage milestone = milestones[projectId][currentMilestoneId];
        if (milestone.approved) {
            revert Errors.MilestoneAlreadyApproved();
        }

        if (milestone.fundsReleased) {
            revert Errors.MilestoneAlreadyReleased();
        }

        uint256 snapshot = milestoneSnapshotDonations[projectId][currentMilestoneId];
        if (snapshot == 0) {
            revert Errors.QuorumNotMet();
        }

        // Check quorum: voteWeight must be > 50% of snapshot
        if (milestone.voteWeight <= (snapshot * 50) / 100) {
            revert Errors.QuorumNotMet();
        }

        if (projects[projectId].balance < milestone.amountRequested) {
            revert Errors.InsufficientProjectBalance();
        }

        // State Changes (CEI Pattern - Effects)
        milestone.approved = true;
        milestone.fundsReleased = true;
        projects[projectId].balance -= milestone.amountRequested;
        projects[projectId].currentMilestone++;

        // Check if this is the final milestone
        bool isFinalMilestone = (currentMilestoneId + 1) == projectMilestoneCount[projectId];
        if (isFinalMilestone) {
            projects[projectId].isCompleted = true;
            projects[projectId].isActive = false;
        }

        // External Calls (CEI Pattern - Interactions)
        uint256 amount = milestone.amountRequested;
        if (projects[projectId].donationToken == address(0)) {
            // ETH transfer
            payable(projects[projectId].ngo).transfer(amount);
        } else {
            // ERC20 transfer
            IERC20(projects[projectId].donationToken).transfer(projects[projectId].ngo, amount);
        }

        // Events
        emit FundsReleased(projectId, currentMilestoneId, amount);
        if (isFinalMilestone) {
            emit ProjectCompleted(projectId);
        }
    }

    // =============================================================
    //                  EMERGENCY CONTROLS
    // =============================================================

    /// @notice Emergency withdrawal of funds from a project (only when paused)
    /// @param projectId The ID of the project to withdraw funds from
    /// @dev Only owner can withdraw. Only works when contract is paused.
    ///      Withdraws all remaining balance from the project to the owner.
    ///      This is a last resort for stuck funds.
    function emergencyWithdraw(uint256 projectId) external onlyOwner whenPaused {
        // Validation Checks
        if (projects[projectId].id == 0) {
            revert Errors.ProjectNotFound();
        }

        // State Changes (CEI Pattern - Effects)
        uint256 amount = projects[projectId].balance;
        projects[projectId].balance = 0;

        // External Calls (CEI Pattern - Interactions)
        if (projects[projectId].donationToken == address(0)) {
            // ETH transfer
            payable(owner()).transfer(amount);
        } else {
            // ERC20 transfer
            IERC20(projects[projectId].donationToken).transfer(owner(), amount);
        }

        // Events
        emit EmergencyWithdrawal(projectId, amount);
    }

    // =============================================================
    //                      VIEW FUNCTIONS
    // =============================================================

    // Phase 10.1: Project Query Functions

    /// @notice Get project information
    /// @param projectId The ID of the project
    /// @return The Project struct containing all project data
    function getProject(uint256 projectId) external view returns (DataStructures.Project memory) {
        return projects[projectId];
    }

    /// @notice Get the total number of milestones for a project
    /// @param projectId The ID of the project
    /// @return The number of milestones
    function getProjectMilestoneCount(uint256 projectId) external view returns (uint256) {
        return projectMilestoneCount[projectId];
    }

    // Phase 10.2: Milestone Query Functions

    /// @notice Get milestone information
    /// @param projectId The ID of the project
    /// @param milestoneId The ID of the milestone
    /// @return The Milestone struct containing all milestone data
    function getMilestone(
        uint256 projectId,
        uint256 milestoneId
    ) external view returns (DataStructures.Milestone memory) {
        return milestones[projectId][milestoneId];
    }

    /// @notice Get the current milestone for a project
    /// @param projectId The ID of the project
    /// @return The current Milestone struct
    function getCurrentMilestone(
        uint256 projectId
    ) external view returns (DataStructures.Milestone memory) {
        uint256 currentMilestoneId = projects[projectId].currentMilestone;
        return milestones[projectId][currentMilestoneId];
    }

    // Phase 10.3: Donation Query Functions

    /// @notice Get a donor's total contribution to a project
    /// @param projectId The ID of the project
    /// @param donor The address of the donor
    /// @return The total amount contributed by the donor
    function getDonorContribution(
        uint256 projectId,
        address donor
    ) external view returns (uint256) {
        return donorContributions[projectId][donor];
    }

    /// @notice Check if a donor has voted on a specific milestone
    /// @param projectId The ID of the project
    /// @param milestoneId The ID of the milestone
    /// @param donor The address of the donor
    /// @return True if the donor has voted, false otherwise
    function hasDonorVoted(
        uint256 projectId,
        uint256 milestoneId,
        address donor
    ) external view returns (bool) {
        return hasVoted[projectId][milestoneId][donor];
    }

    // Phase 10.4: Voting Status Function

    /// @notice Get voting status for a milestone
    /// @param projectId The ID of the project
    /// @param milestoneId The ID of the milestone
    /// @return voteWeight The total vote weight for this milestone
    /// @return snapshot The donation snapshot at vote start
    /// @return canRelease True if quorum is met and balance is sufficient for release
    function getMilestoneVoteStatus(
        uint256 projectId,
        uint256 milestoneId
    ) external view returns (uint256 voteWeight, uint256 snapshot, bool canRelease) {
        DataStructures.Milestone memory milestone = milestones[projectId][milestoneId];
        voteWeight = milestone.voteWeight;
        snapshot = milestoneSnapshotDonations[projectId][milestoneId];

        // canRelease = (voteWeight > 50% of snapshot) && (balance >= amountRequested)
        bool quorumMet = snapshot > 0 && voteWeight > (snapshot * 50) / 100;
        bool sufficientBalance = projects[projectId].balance >= milestone.amountRequested;
        canRelease = quorumMet && sufficientBalance;
    }

    // =============================================================
    //                       ETH HANDLING
    // =============================================================

    /// @dev Reject direct ETH transfers. ETH must be sent via `donate` once implemented.
    receive() external payable {
        revert Errors.DirectETHSendRejected();
    }

    /// @dev Reject unexpected calls with calldata (including accidental ETH sends).
    fallback() external payable {
        revert Errors.DirectETHSendRejected();
    }
}


