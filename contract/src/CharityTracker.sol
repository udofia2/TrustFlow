// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

/// @title CharityTracker
/// @notice Milestone-based charity donation escrow with weighted donor voting (ETH + ERC20).
/// @dev Phase 4: Project creation with milestone validation implemented.
contract CharityTracker is Ownable, ReentrancyGuard, Pausable {
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

    // =============================================================
    //                           ERRORS
    // =============================================================

    error DirectETHSendRejected();
    error NGOAlreadyVerified(address ngo);
    error NGONotVerified(address ngo);
    error InvalidNGOAddress();
    error NotVerifiedNGO();
    error InvalidGoal();
    error InvalidMilestoneArrays();
    error InvalidMilestoneAmount();
    error MilestoneSumExceedsGoal();

    // =============================================================
    //                      DATA STRUCTURES
    // =============================================================

    /// @notice Project information structure
    struct Project {
        uint256 id;
        address ngo;
        address donationToken; // address(0) = ETH
        uint256 goal;
        uint256 totalDonated;
        uint256 balance;
        uint256 currentMilestone;
        bool isActive;
        bool isCompleted;
    }

    /// @notice Milestone information structure
    struct Milestone {
        string description;
        uint256 amountRequested;
        bool approved;
        bool fundsReleased;
        uint256 voteWeight;
    }

    // =============================================================
    //                         STORAGE
    // =============================================================

    /// @notice Mapping of verified NGO addresses
    mapping(address => bool) public verifiedNGOs;

    /// @notice Counter for project IDs (starts at 1)
    uint256 public projectCounter;

    /// @notice Mapping of project ID to Project struct
    mapping(uint256 => Project) public projects;

    /// @notice Mapping of project ID to milestone ID to Milestone struct
    /// @dev projectId => milestoneId => Milestone
    mapping(uint256 => mapping(uint256 => Milestone)) public milestones;

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
            revert InvalidNGOAddress();
        }
        if (verifiedNGOs[ngo]) {
            revert NGOAlreadyVerified(ngo);
        }

        verifiedNGOs[ngo] = true;
        emit NGORegistered(ngo);
    }

    /// @notice Revoke verification status of an NGO
    /// @param ngo The address of the NGO to revoke
    /// @dev Only owner can revoke NGOs. Reverts if NGO is not currently verified.
    function revokeNGO(address ngo) external onlyOwner {
        if (!verifiedNGOs[ngo]) {
            revert NGONotVerified(ngo);
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
            revert NotVerifiedNGO();
        }

        // Check: Goal > 0
        if (goal == 0) {
            revert InvalidGoal();
        }

        // Check: Descriptions and amounts arrays have same length
        if (descriptions.length != amounts.length) {
            revert InvalidMilestoneArrays();
        }

        // Check: At least one milestone
        if (descriptions.length == 0) {
            revert InvalidMilestoneArrays();
        }

        // Check: All amounts > 0 and sum <= goal
        uint256 totalAmounts = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            if (amounts[i] == 0) {
                revert InvalidMilestoneAmount();
            }
            totalAmounts += amounts[i];
        }

        // Check: Sum of amounts <= goal
        if (totalAmounts > goal) {
            revert MilestoneSumExceedsGoal();
        }

        // Increment project counter (starts at 1)
        projectCounter++;
        projectId = projectCounter;

        // Create and store project
        projects[projectId] = Project({
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
            milestones[projectId][i] = Milestone({
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
    //                       ETH HANDLING
    // =============================================================

    /// @dev Reject direct ETH transfers. ETH must be sent via `donate` once implemented.
    receive() external payable {
        revert DirectETHSendRejected();
    }

    /// @dev Reject unexpected calls with calldata (including accidental ETH sends).
    fallback() external payable {
        revert DirectETHSendRejected();
    }
}


