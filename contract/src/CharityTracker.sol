// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

/// @title CharityTracker
/// @notice Milestone-based charity donation escrow with weighted donor voting (ETH + ERC20).
/// @dev Phase 2: Data models and storage structures defined.
contract CharityTracker is Ownable, ReentrancyGuard, Pausable {
    // =============================================================
    //                           EVENTS
    // =============================================================

    event NGORegistered(address ngo);
    event NGORevoked(address ngo);
    event ProjectCreated(uint256 projectId, address ngo);
    event DonationReceived(uint256 projectId, address donor, uint256 amount);
    event MilestoneVoted(uint256 projectId, uint256 milestoneId, address voter, uint256 weight);
    event FundsReleased(uint256 projectId, uint256 milestoneId, uint256 amount);
    event ProjectCompleted(uint256 projectId);

    // =============================================================
    //                           ERRORS
    // =============================================================

    error DirectETHSendRejected();

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


