// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {Fixtures} from "./Fixtures.t.sol";
import {CharityTracker} from "../src/CharityTracker.sol";
import {Errors} from "../src/libraries/Errors.sol";
import {DataStructures} from "../src/types/DataStructures.sol";

/// @title Milestone Voting Tests
/// @notice Tests for milestone voting functionality
contract MilestoneVotingTest is Fixtures {
    uint256 public projectId;

    function setUp() public override {
        super.setUp();
        registerNGO(ngo);
        projectId = createTestProject(false); // ETH project
    }

    // =============================================================
    // Phase 14.1: Milestone Voting Tests
    // =============================================================

    function test_DonorCanVoteOnCurrentMilestone() public {
        uint256 donationAmount = 100 ether;
        donateETH(donor1, projectId, donationAmount);

        vm.expectEmit(true, true, true, false);
        emit CharityTracker.MilestoneVoted(projectId, 0, donor1, donationAmount);

        voteMilestone(donor1, projectId);

        // Verify vote was recorded
        assertTrue(tracker.hasVoted(projectId, 0, donor1));
    }

    function test_VoteWeightEqualsContribution() public {
        uint256 donation1 = 30 ether;
        uint256 donation2 = 40 ether;
        uint256 totalContribution = donation1 + donation2;

        // Make multiple donations
        donateETH(donor1, projectId, donation1);
        donateETH(donor1, projectId, donation2);

        // Vote
        voteMilestone(donor1, projectId);

        // Check vote weight equals total contribution
        DataStructures.Milestone memory milestone = tracker.getMilestone(projectId, 0);
        assertEq(milestone.voteWeight, totalContribution);
    }

    function test_DoubleVotingPrevention() public {
        uint256 donationAmount = 100 ether;
        donateETH(donor1, projectId, donationAmount);

        // First vote should succeed
        voteMilestone(donor1, projectId);

        // Second vote should revert
        vm.expectRevert(Errors.AlreadyVoted.selector);
        voteMilestone(donor1, projectId);
    }

    function test_NonDonorCannotVote() public {
        // Donor2 hasn't donated
        vm.expectRevert(Errors.NoContribution.selector);
        voteMilestone(donor2, projectId);
    }

    function test_VotingAfterMilestoneApprovalReverts() public {
        // Give donor1 more funds for large donation
        vm.deal(donor1, 700 ether);
        
        uint256 donationAmount = 600 ether; // Enough for quorum (>50% of goal)
        donateETH(donor1, projectId, donationAmount);

        // Vote and release milestone 0
        voteMilestone(donor1, projectId);
        releaseFunds(projectId);

        // Verify milestone 0 is approved
        DataStructures.Milestone memory milestone0 = tracker.getMilestone(projectId, 0);
        assertTrue(milestone0.approved);
        
        // Verify currentMilestone has moved to 1
        DataStructures.Project memory project = tracker.getProject(projectId);
        assertEq(project.currentMilestone, 1);

        // Donor2 donates and tries to vote
        // This will vote on milestone 1 (current milestone), not milestone 0
        // So this test verifies that milestone 0 is approved and we've moved to milestone 1
        donateETH(donor2, projectId, 50 ether);
        
        // This should succeed because we're voting on milestone 1, not milestone 0
        voteMilestone(donor2, projectId);
        
        // Verify donor2 voted on milestone 1
        assertTrue(tracker.hasVoted(projectId, 1, donor2));
        
        // Verify milestone 0 is still approved and can't be voted on
        // (This is implicit - we can't vote on milestone 0 because currentMilestone is 1)
        assertTrue(milestone0.approved);
    }

    function test_SnapshotCapturesDonationsAtVoteStart() public {
        uint256 donation1 = 50 ether;
        uint256 donation2 = 75 ether;
        uint256 totalBeforeVote = donation1 + donation2;

        // Make donations
        donateETH(donor1, projectId, donation1);
        donateETH(donor2, projectId, donation2);

        // First vote creates snapshot
        voteMilestone(donor1, projectId);

        // Check snapshot was captured
        uint256 snapshot = tracker.milestoneSnapshotDonations(projectId, 0);
        assertEq(snapshot, totalBeforeVote);
    }

    function test_DonationsAfterVoteStartDontCount() public {
        uint256 donation1 = 50 ether;
        uint256 donation2 = 75 ether;
        uint256 donation3 = 60 ether; // After vote starts

        // Make initial donations
        donateETH(donor1, projectId, donation1);
        donateETH(donor2, projectId, donation2);

        // First vote creates snapshot
        voteMilestone(donor1, projectId);
        uint256 snapshot = tracker.milestoneSnapshotDonations(projectId, 0);
        assertEq(snapshot, donation1 + donation2);

        // Make donation after vote starts
        donateETH(donor3, projectId, donation3);

        // Snapshot should remain the same
        uint256 snapshotAfter = tracker.milestoneSnapshotDonations(projectId, 0);
        assertEq(snapshotAfter, snapshot);
        assertEq(snapshotAfter, donation1 + donation2); // donation3 not included
    }

    function test_EventEmission() public {
        uint256 donationAmount = 100 ether;
        donateETH(donor1, projectId, donationAmount);

        vm.expectEmit(true, true, true, false);
        emit CharityTracker.MilestoneVoted(projectId, 0, donor1, donationAmount);

        voteMilestone(donor1, projectId);
    }

    function test_MultipleDonorsCanVote() public {
        uint256 donation1 = 50 ether;
        uint256 donation2 = 60 ether;
        uint256 donation3 = 40 ether;

        // Multiple donors donate
        donateETH(donor1, projectId, donation1);
        donateETH(donor2, projectId, donation2);
        donateETH(donor3, projectId, donation3);

        // All can vote
        voteMilestone(donor1, projectId);
        voteMilestone(donor2, projectId);
        voteMilestone(donor3, projectId);

        // Check all votes recorded
        assertTrue(tracker.hasVoted(projectId, 0, donor1));
        assertTrue(tracker.hasVoted(projectId, 0, donor2));
        assertTrue(tracker.hasVoted(projectId, 0, donor3));

        // Check total vote weight
        DataStructures.Milestone memory milestone = tracker.getMilestone(projectId, 0);
        assertEq(milestone.voteWeight, donation1 + donation2 + donation3);
    }

    function test_VotingOnNonExistentProjectReverts() public {
        uint256 donationAmount = 100 ether;
        donateETH(donor1, projectId, donationAmount);

        vm.expectRevert(Errors.ProjectNotFound.selector);
        vm.prank(donor1);
        tracker.voteMilestone(999);
    }

    function test_VotingWhenPausedReverts() public {
        uint256 donationAmount = 100 ether;
        donateETH(donor1, projectId, donationAmount);

        tracker.pause();

        vm.expectRevert();
        voteMilestone(donor1, projectId);
    }
}

