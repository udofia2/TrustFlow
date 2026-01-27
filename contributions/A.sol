// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Errors} from "./libraries/Errors.sol";
import {DataStructures} from "./types/DataStructures.sol";

/// @title CharityTrackerV2
/// @notice Enhanced milestone-based charity with tier-based rewards, batch operations, and governance
/// @dev V2 Features:
///      - Donor tier system with reward multipliers
///      - Batch voting and fund releases
///      - Time-based milestone deadlines
///      - Reward pool for top donors
///      - Protocol fee mechanism
///      - Milestone funding flexibility
contract CharityTrackerV2 is Ownable, ReentrancyGuard, Pausable {
    using DataStructures for DataStructures.Project;
    using DataStructures for DataStructures.Milestone;

    // =============================================================
    //                           EVENTS
    // =============================================================

    event NGORegistered(address indexed ngo, string name);
    event NGORevoked(address indexed ngo);
    event ProjectCreated(uint256 indexed projectId, address indexed ngo, uint256 goal);
    event DonationReceived(uint256 indexed projectId, address indexed donor, uint256 amount, uint8 tier);
    event MilestoneVoted(uint256 indexed projectId, uint256 indexed milestoneId, address indexed voter, uint256 weight);
    event FundsReleased(uint256 indexed projectId, uint256 indexed milestoneId, uint256 amount);
    event ProjectCompleted(uint256 indexed projectId, uint256 totalRaised);
    event RewardClaimed(address indexed donor, uint256 amount, uint8 tier);
    event MilestoneExtended(uint256 indexed projectId, uint256 indexed milestoneId, uint256 newDeadline);
    event ProtocolFeeUpdated(uint256 newFee);

    // =============================================================
    //                      DATA STRUCTURES
    // =============================================================

    enum DonorTier { Bronze, Silver, Gold, Platinum }

    struct TierConfig {
        uint256 minContribution;
        uint256 rewardMultiplier; // in basis points (100 = 1%)
        uint256 votingBoost;      // additional voting power %
    }

    struct DonorProfile {
        uint256 totalContributed;
        uint256 totalRewarded;
        DonorTier tier;
        uint256 lastUpdateBlock;
    }

    // =============================================================
    //                         STORAGE
    // =============================================================

    mapping(address => bool) public verifiedNGOs;
    mapping(address => string) public ngoNames;

    uint256 public projectCounter;
    mapping(uint256 => DataStructures.Project) public projects;
    mapping(uint256 => mapping(uint256 => DataStructures.Milestone)) public milestones;
    mapping(uint256 => uint256) public projectMilestoneCount;
    mapping(uint256 => mapping(address => uint256)) public donorContributions;
    mapping(uint256 => uint256) public totalProjectDonations;
    mapping(uint256 => mapping(uint256 => mapping(address => bool))) public hasVoted;
    mapping(uint256 => mapping(uint256 => uint256)) public milestoneSnapshotDonations;

    // V2 Storage
    mapping(address => DonorProfile) public donorProfiles;
    mapping(DonorTier => TierConfig) public tierConfigs;
    uint256 public rewardPool;
    uint256 public protocolFeePercentage = 250; // 2.5% in basis points
    mapping(uint256 => uint256) public milestoneFundingRaised;
    mapping(uint256 => mapping(uint256 => uint256)) public milestoneDeadlines;
    mapping(uint256 => mapping(uint256 => uint256)) public milestoneMinFunding;

    // =============================================================
    //                        CONSTRUCTOR
    // =============================================================

    constructor() Ownable(msg.sender) {
        _initializeTierConfigs();
    }

    function _initializeTierConfigs() internal {
        tierConfigs[DonorTier.Bronze] = TierConfig({
            minContribution: 0,
            rewardMultiplier: 50,     // 0.5%
            votingBoost: 0
        });
        tierConfigs[DonorTier.Silver] = TierConfig({
            minContribution: 100e18,
            rewardMultiplier: 100,    // 1%
            votingBoost: 10            // 10% boost
        });
        tierConfigs[DonorTier.Gold] = TierConfig({
            minContribution: 1000e18,
            rewardMultiplier: 150,    // 1.5%
            votingBoost: 25            // 25% boost
        });
        tierConfigs[DonorTier.Platinum] = TierConfig({
            minContribution: 10000e18,
            rewardMultiplier: 200,    // 2%
            votingBoost: 50            // 50% boost
        });
    }

    // =============================================================
    //                      PAUSE CONTROLS
    // =============================================================

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // =============================================================
    //                      NGO MANAGEMENT
    // =============================================================

    function registerNGO(address ngo, string memory name) external onlyOwner {
        if (ngo == address(0)) revert Errors.InvalidNGOAddress();
        if (verifiedNGOs[ngo]) revert Errors.NGOAlreadyVerified(ngo);
        if (bytes(name).length == 0) revert Errors.InvalidNGOAddress();

        verifiedNGOs[ngo] = true;
        ngoNames[ngo] = name;
        emit NGORegistered(ngo, name);
    }

    function revokeNGO(address ngo) external onlyOwner {
        if (!verifiedNGOs[ngo]) revert Errors.NGONotVerified(ngo);
        verifiedNGOs[ngo] = false;
        emit NGORevoked(ngo);
    }

    // =============================================================
    //                      PROJECT CREATION V2
    // =============================================================

    function createProject(
        address donationToken,
        uint256 goal,
        string[] memory descriptions,
        uint256[] memory amounts,
        uint256[] memory deadlines,
        uint256[] memory minFundings
    ) external whenNotPaused returns (uint256) {
        if (!verifiedNGOs[msg.sender]) revert Errors.NotVerifiedNGO();
        if (goal == 0) revert Errors.InvalidGoal();
        if (descriptions.length == 0) revert Errors.InvalidMilestoneArrays();
        if (descriptions.length != amounts.length || amounts.length != deadlines.length) 
            revert Errors.InvalidMilestoneArrays();
        if (minFundings.length != amounts.length) revert Errors.InvalidMilestoneArrays();

        uint256 totalAmounts = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            if (amounts[i] == 0) revert Errors.InvalidMilestoneAmount();
            if (deadlines[i] <= block.timestamp) revert Errors.InvalidMilestoneAmount();
            if (minFundings[i] > amounts[i]) revert Errors.InvalidMilestoneAmount();
            totalAmounts += amounts[i];
        }

        if (totalAmounts > goal) revert Errors.MilestoneSumExceedsGoal();

        uint256 projectId = ++projectCounter;
        projects[projectId] = DataStructures.Project({
            id: projectId,
            ngo: msg.sender,
            donationToken: donationToken,
            goal: goal,
            totalDonated: 0,
            balance: 0,
            currentMilestone: 0,
            isActive: true,
            isCompleted: false
        });

        projectMilestoneCount[projectId] = descriptions.length;

        for (uint256 i = 0; i < descriptions.length; i++) {
            milestones[projectId][i] = DataStructures.Milestone({
                description: descriptions[i],
                amountRequested: amounts[i],
                approved: false,
                fundsReleased: false,
                voteWeight: 0
            });
            milestoneDeadlines[projectId][i] = deadlines[i];
            milestoneMinFunding[projectId][i] = minFundings[i];
        }

        emit ProjectCreated(projectId, msg.sender, goal);
        return projectId;
    }

    // =============================================================
    //                      DONATION WITH TIERS
    // =============================================================

    function donate(uint256 projectId) external payable whenNotPaused nonReentrant {
        if (projects[projectId].id == 0) revert Errors.ProjectNotFound();
        if (!projects[projectId].isActive) revert Errors.ProjectNotActive();
        if (projects[projectId].isCompleted) revert Errors.ProjectAlreadyCompleted();
        if (msg.value == 0) revert Errors.InvalidDonationAmount();
        if (projects[projectId].donationToken != address(0)) revert Errors.InvalidDonationToken();

        uint256 fee = (msg.value * protocolFeePercentage) / 10000;
        uint256 netAmount = msg.value - fee;
        rewardPool += fee;

        donorContributions[projectId][msg.sender] += netAmount;
        totalProjectDonations[projectId] += netAmount;
        projects[projectId].totalDonated += netAmount;
        projects[projectId].balance += netAmount;

        _updateDonorTier(msg.sender);
        DonorTier tier = donorProfiles[msg.sender].tier;

        emit DonationReceived(projectId, msg.sender, netAmount, uint8(tier));
    }

    function donateERC20(uint256 projectId, uint256 amount) external whenNotPaused nonReentrant {
        if (projects[projectId].id == 0) revert Errors.ProjectNotFound();
        if (!projects[projectId].isActive) revert Errors.ProjectNotActive();
        if (projects[projectId].isCompleted) revert Errors.ProjectAlreadyCompleted();
        if (amount == 0) revert Errors.InvalidDonationAmount();
        if (projects[projectId].donationToken == address(0)) revert Errors.InvalidDonationToken();

        IERC20 token = IERC20(projects[projectId].donationToken);
        if (token.allowance(msg.sender, address(this)) < amount) revert Errors.InsufficientAllowance();
        if (token.balanceOf(msg.sender) < amount) revert Errors.InsufficientBalance();

        uint256 fee = (amount * protocolFeePercentage) / 10000;
        uint256 netAmount = amount - fee;

        donorContributions[projectId][msg.sender] += netAmount;
        totalProjectDonations[projectId] += netAmount;
        projects[projectId].totalDonated += netAmount;
        projects[projectId].balance += netAmount;
        rewardPool += fee;

        token.transferFrom(msg.sender, address(this), amount);
        _updateDonorTier(msg.sender);
        DonorTier tier = donorProfiles[msg.sender].tier;

        emit DonationReceived(projectId, msg.sender, netAmount, uint8(tier));
    }

    // =============================================================
    //                      TIER SYSTEM
    // =============================================================

    function _updateDonorTier(address donor) internal {
        uint256 total = donorProfiles[donor].totalContributed;
        DonorTier newTier = DonorTier.Bronze;

        if (total >= tierConfigs[DonorTier.Platinum].minContribution) {
            newTier = DonorTier.Platinum;
        } else if (total >= tierConfigs[DonorTier.Gold].minContribution) {
            newTier = DonorTier.Gold;
        } else if (total >= tierConfigs[DonorTier.Silver].minContribution) {
            newTier = DonorTier.Silver;
        }

        donorProfiles[donor].tier = newTier;
        donorProfiles[donor].lastUpdateBlock = block.number;
    }

    function getDonorTier(address donor) external view returns (DonorTier) {
        return donorProfiles[donor].tier;
    }

    // =============================================================
    //                  BATCH VOTING & RELEASE
    // =============================================================

    function batchVoteMilestones(uint256[] calldata projectIds) external whenNotPaused {
        for (uint256 i = 0; i < projectIds.length; i++) {
            _voteMilestoneInternal(projectIds[i], msg.sender);
        }
    }

    function voteMilestone(uint256 projectId) external whenNotPaused {
        _voteMilestoneInternal(projectId, msg.sender);
    }

    function _voteMilestoneInternal(uint256 projectId, address voter) internal {
        if (projects[projectId].id == 0) revert Errors.ProjectNotFound();

        uint256 currentMilestoneId = projects[projectId].currentMilestone;
        if (currentMilestoneId >= projectMilestoneCount[projectId]) revert Errors.NoCurrentMilestone();

        DataStructures.Milestone storage milestone = milestones[projectId][currentMilestoneId];
        if (milestone.approved) revert Errors.MilestoneAlreadyApproved();
        if (donorContributions[projectId][voter] == 0) revert Errors.NoContribution();
        if (hasVoted[projectId][currentMilestoneId][voter]) revert Errors.AlreadyVoted();

        if (milestoneSnapshotDonations[projectId][currentMilestoneId] == 0) {
            milestoneSnapshotDonations[projectId][currentMilestoneId] = totalProjectDonations[projectId];
        }

        uint256 baseWeight = donorContributions[projectId][voter];
        uint256 boost = (baseWeight * tierConfigs[donorProfiles[voter].tier].votingBoost) / 100;
        uint256 voteWeight = baseWeight + boost;

        milestone.voteWeight += voteWeight;
        hasVoted[projectId][currentMilestoneId][voter] = true;

        emit MilestoneVoted(projectId, currentMilestoneId, voter, voteWeight);
    }

    function batchReleaseFunds(uint256[] calldata projectIds) external whenNotPaused nonReentrant {
        for (uint256 i = 0; i < projectIds.length; i++) {
            _releaseFundsInternal(projectIds[i]);
        }
    }

    function releaseFunds(uint256 projectId) external whenNotPaused nonReentrant {
        _releaseFundsInternal(projectId);
    }

    function _releaseFundsInternal(uint256 projectId) internal {
        if (projects[projectId].id == 0) revert Errors.ProjectNotFound();
        if (msg.sender != projects[projectId].ngo) revert Errors.NotProjectNGO();

        uint256 currentMilestoneId = projects[projectId].currentMilestone;
        if (currentMilestoneId >= projectMilestoneCount[projectId]) revert Errors.NoCurrentMilestone();

        DataStructures.Milestone storage milestone = milestones[projectId][currentMilestoneId];
        if (milestone.approved) revert Errors.MilestoneAlreadyApproved();
        if (milestone.fundsReleased) revert Errors.MilestoneAlreadyReleased();

        uint256 snapshot = milestoneSnapshotDonations[projectId][currentMilestoneId];
        if (snapshot == 0) revert Errors.QuorumNotMet();
        if (milestone.voteWeight <= (snapshot * 50) / 100) revert Errors.QuorumNotMet();

        uint256 minRequired = milestoneMinFunding[projectId][currentMilestoneId];
        if (milestoneFundingRaised[currentMilestoneId] < minRequired) revert Errors.InsufficientProjectBalance();
        if (projects[projectId].balance < milestone.amountRequested) revert Errors.InsufficientProjectBalance();

        milestone.approved = true;
        milestone.fundsReleased = true;
        projects[projectId].balance -= milestone.amountRequested;
        projects[projectId].currentMilestone++;

        bool isFinalMilestone = (currentMilestoneId + 1) == projectMilestoneCount[projectId];
        if (isFinalMilestone) {
            projects[projectId].isCompleted = true;
            projects[projectId].isActive = false;
        }

        uint256 amount = milestone.amountRequested;
        if (projects[projectId].donationToken == address(0)) {
            payable(projects[projectId].ngo).transfer(amount);
        } else {
            IERC20(projects[projectId].donationToken).transfer(projects[projectId].ngo, amount);
        }

        emit FundsReleased(projectId, currentMilestoneId, amount);
        if (isFinalMilestone) {
            emit ProjectCompleted(projectId, projects[projectId].totalDonated);
        }
    }

    // =============================================================
    //                  MILESTONE MANAGEMENT V2
    // =============================================================

    function extendMilestoneDeadline(uint256 projectId, uint256 milestoneId, uint256 newDeadline) 
        external 
        onlyOwner 
    {
        if (projects[projectId].id == 0) revert Errors.ProjectNotFound();
        if (newDeadline <= block.timestamp) revert Errors.InvalidMilestoneAmount();
        
        milestoneDeadlines[projectId][milestoneId] = newDeadline;
        emit MilestoneExtended(projectId, milestoneId, newDeadline);
    }

    function updateMilestoneMinFunding(uint256 projectId, uint256 milestoneId, uint256 minFunding) 
        external 
        onlyOwner 
    {
        if (projects[projectId].id == 0) revert Errors.ProjectNotFound();
        if (minFunding > milestones[projectId][milestoneId].amountRequested) revert Errors.InvalidMilestoneAmount();
        
        milestoneMinFunding[projectId][milestoneId] = minFunding;
    }

    // =============================================================
    //                      REWARD SYSTEM
    // =============================================================

    function claimTierRewards(uint256 projectId) external nonReentrant {
        if (projects[projectId].id == 0) revert Errors.ProjectNotFound();
        
        uint256 contribution = donorContributions[projectId][msg.sender];
        if (contribution == 0) revert Errors.NoContribution();

        DonorTier tier = donorProfiles[msg.sender].tier;
        uint256 rewardMultiplier = tierConfigs[tier].rewardMultiplier;
        uint256 reward = (contribution * rewardMultiplier) / 10000;

        if (rewardPool < reward) revert Errors.InsufficientBalance();

        rewardPool -= reward;
        donorProfiles[msg.sender].totalRewarded += reward;

        if (projects[projectId].donationToken == address(0)) {
            payable(msg.sender).transfer(reward);
        } else {
            IERC20(projects[projectId].donationToken).transfer(msg.sender, reward);
        }

        emit RewardClaimed(msg.sender, reward, uint8(tier));
    }

    // =============================================================
    //                   GOVERNANCE & CONFIG
    // =============================================================

    function setProtocolFee(uint256 newFee) external onlyOwner {
        if (newFee > 1000) revert Errors.InvalidGoal(); // Max 10%
        protocolFeePercentage = newFee;
        emit ProtocolFeeUpdated(newFee);
    }

    function updateTierConfig(
        DonorTier tier,
        uint256 minContribution,
        uint256 rewardMultiplier,
        uint256 votingBoost
    ) external onlyOwner {
        tierConfigs[tier] = TierConfig({
            minContribution: minContribution,
            rewardMultiplier: rewardMultiplier,
            votingBoost: votingBoost
        });
    }

    function withdrawRewardPool() external onlyOwner {
        uint256 amount = rewardPool;
        rewardPool = 0;
        payable(owner()).transfer(amount);
    }

    // =============================================================
    //                      VIEW FUNCTIONS
    // =============================================================

    function getProject(uint256 projectId) external view returns (DataStructures.Project memory) {
        return projects[projectId];
    }

    function getMilestone(uint256 projectId, uint256 milestoneId) 
        external 
        view 
        returns (DataStructures.Milestone memory) 
    {
        return milestones[projectId][milestoneId];
    }

    function getDonorProfile(address donor) external view returns (DonorProfile memory) {
        return donorProfiles[donor];
    }

    function getMilestoneVoteStatus(uint256 projectId, uint256 milestoneId) 
        external 
        view 
        returns (uint256 voteWeight, uint256 snapshot, bool canRelease) 
    {
        DataStructures.Milestone memory milestone = milestones[projectId][milestoneId];
        voteWeight = milestone.voteWeight;
        snapshot = milestoneSnapshotDonations[projectId][milestoneId];

        bool quorumMet = snapshot > 0 && voteWeight > (snapshot * 50) / 100;
        bool sufficientBalance = projects[projectId].balance >= milestone.amountRequested;
        bool minFundingMet = milestoneFundingRaised[milestoneId] >= milestoneMinFunding[projectId][milestoneId];
        canRelease = quorumMet && sufficientBalance && minFundingMet;
    }

    // =============================================================
    //                       ETH HANDLING
    // =============================================================

    receive() external payable {
        revert Errors.DirectETHSendRejected();
    }

    fallback() external payable {
        revert Errors.DirectETHSendRejected();
    }
}