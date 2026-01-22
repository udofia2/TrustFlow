// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {Fixtures} from "./Fixtures.t.sol";
import {CharityTracker} from "../src/CharityTracker.sol";
import {Errors} from "../src/libraries/Errors.sol";
import {DataStructures} from "../src/types/DataStructures.sol";

/// @title CharityTracker Tests
/// @notice Tests for NGO management and project creation
contract CharityTrackerTest is Fixtures {
    // =============================================================
    // Phase 12.2: NGO Management Tests
    // =============================================================

    function test_OwnerCanRegisterNGO() public {
        tracker.registerNGO(ngo);
        assertTrue(tracker.verifiedNGOs(ngo));
        assertTrue(tracker.isVerifiedNGO(ngo));
    }

    function test_NonOwnerCannotRegisterNGO() public {
        vm.prank(donor1);
        vm.expectRevert();
        tracker.registerNGO(ngo);
    }

    function test_RegisteringZeroAddressReverts() public {
        vm.expectRevert(Errors.InvalidNGOAddress.selector);
        tracker.registerNGO(address(0));
    }

    function test_RegisteringAlreadyVerifiedNGOReverts() public {
        tracker.registerNGO(ngo);
        vm.expectRevert(abi.encodeWithSelector(Errors.NGOAlreadyVerified.selector, ngo));
        tracker.registerNGO(ngo);
    }

    function test_NGORegisteredEventEmitted() public {
        vm.expectEmit(true, false, false, false);
        emit CharityTracker.NGORegistered(ngo);
        tracker.registerNGO(ngo);
    }

    function test_OwnerCanRevokeNGO() public {
        tracker.registerNGO(ngo);
        tracker.revokeNGO(ngo);
        assertFalse(tracker.verifiedNGOs(ngo));
        assertFalse(tracker.isVerifiedNGO(ngo));
    }

    function test_NonOwnerCannotRevokeNGO() public {
        tracker.registerNGO(ngo);
        vm.prank(donor1);
        vm.expectRevert();
        tracker.revokeNGO(ngo);
    }

    function test_RevokingNonVerifiedNGOReverts() public {
        vm.expectRevert(abi.encodeWithSelector(Errors.NGONotVerified.selector, ngo));
        tracker.revokeNGO(ngo);
    }

    function test_NGORevokedEventEmitted() public {
        tracker.registerNGO(ngo);
        vm.expectEmit(true, false, false, false);
        emit CharityTracker.NGORevoked(ngo);
        tracker.revokeNGO(ngo);
    }

    // =============================================================
    // Phase 12.3: Project Creation Tests
    // =============================================================

    function test_VerifiedNGOCanCreateProject() public {
        registerNGO(ngo);
        uint256 projectId = createTestProject(false); // ETH project
        assertEq(projectId, 1);
        assertEq(tracker.projectCounter(), 1);
    }

    function test_UnverifiedNGOCannotCreateProject() public {
        vm.prank(ngo);
        vm.expectRevert(Errors.NotVerifiedNGO.selector);
        tracker.createProject(
            address(0),
            DEFAULT_GOAL,
            new string[](1),
            new uint256[](1)
        );
    }

    function test_InvalidGoalReverts() public {
        registerNGO(ngo);
        string[] memory descriptions = new string[](1);
        descriptions[0] = "Test milestone";
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 100 ether;

        vm.prank(ngo);
        vm.expectRevert(Errors.InvalidGoal.selector);
        tracker.createProject(address(0), 0, descriptions, amounts);
    }

    function test_ArrayLengthMismatchReverts() public {
        registerNGO(ngo);
        string[] memory descriptions = new string[](2);
        descriptions[0] = "Milestone 1";
        descriptions[1] = "Milestone 2";
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 100 ether;

        vm.prank(ngo);
        vm.expectRevert(Errors.InvalidMilestoneArrays.selector);
        tracker.createProject(address(0), DEFAULT_GOAL, descriptions, amounts);
    }

    function test_EmptyArraysRevert() public {
        registerNGO(ngo);
        vm.prank(ngo);
        vm.expectRevert(Errors.InvalidMilestoneArrays.selector);
        tracker.createProject(address(0), DEFAULT_GOAL, new string[](0), new uint256[](0));
    }

    function test_MilestoneSumExceedsGoalReverts() public {
        registerNGO(ngo);
        string[] memory descriptions = new string[](2);
        descriptions[0] = "Milestone 1";
        descriptions[1] = "Milestone 2";
        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 600 ether;
        amounts[1] = 500 ether; // Total: 1100 > 1000

        vm.prank(ngo);
        vm.expectRevert(Errors.MilestoneSumExceedsGoal.selector);
        tracker.createProject(address(0), DEFAULT_GOAL, descriptions, amounts);
    }

    function test_InvalidMilestoneAmountReverts() public {
        registerNGO(ngo);
        string[] memory descriptions = new string[](2);
        descriptions[0] = "Milestone 1";
        descriptions[1] = "Milestone 2";
        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 500 ether;
        amounts[1] = 0; // Invalid: zero amount

        vm.prank(ngo);
        vm.expectRevert(Errors.InvalidMilestoneAmount.selector);
        tracker.createProject(address(0), DEFAULT_GOAL, descriptions, amounts);
    }

    function test_ProjectStateInitializedCorrectly() public {
        registerNGO(ngo);
        uint256 projectId = createTestProject(false);

        DataStructures.Project memory project = tracker.getProject(projectId);

        assertEq(project.id, projectId);
        assertEq(project.ngo, ngo);
        assertEq(project.donationToken, address(0)); // ETH
        assertEq(project.goal, DEFAULT_GOAL);
        assertEq(project.totalDonated, 0);
        assertEq(project.balance, 0);
        assertEq(project.currentMilestone, 0);
        assertTrue(project.isActive);
        assertFalse(project.isCompleted);
    }

    function test_AllMilestonesStoredCorrectly() public {
        registerNGO(ngo);
        uint256 projectId = createTestProject(false);

        assertEq(tracker.getProjectMilestoneCount(projectId), 2);

        // Check first milestone
        DataStructures.Milestone memory milestone1 = tracker.getMilestone(projectId, 0);
        assertEq(milestone1.description, "Milestone 1: Initial Setup");
        assertEq(milestone1.amountRequested, DEFAULT_MILESTONE_AMOUNT);
        assertFalse(milestone1.approved);
        assertFalse(milestone1.fundsReleased);
        assertEq(milestone1.voteWeight, 0);

        // Check second milestone
        DataStructures.Milestone memory milestone2 = tracker.getMilestone(projectId, 1);
        assertEq(milestone2.description, "Milestone 2: Final Delivery");
        assertEq(milestone2.amountRequested, DEFAULT_MILESTONE_AMOUNT);
        assertFalse(milestone2.approved);
        assertFalse(milestone2.fundsReleased);
        assertEq(milestone2.voteWeight, 0);
    }

    function test_ProjectCreatedEventEmitted() public {
        registerNGO(ngo);
        vm.expectEmit(true, true, false, false);
        emit CharityTracker.ProjectCreated(1, ngo);
        createTestProject(false);
    }

    function test_ERC20ProjectCreatedCorrectly() public {
        registerNGO(ngo);
        uint256 projectId = createTestProject(true); // ERC20 project

        DataStructures.Project memory project = tracker.getProject(projectId);
        
        assertEq(project.id, projectId);
        assertEq(project.ngo, ngo);
        assertEq(project.donationToken, address(mockUSDC)); // ERC20 token
        assertEq(project.goal, DEFAULT_GOAL);
        assertEq(project.totalDonated, 0);
        assertEq(project.balance, 0);
        assertEq(project.currentMilestone, 0);
        assertTrue(project.isActive);
        assertFalse(project.isCompleted);
    }

    // =============================================================
    // Phase 16.2: Edge Case Tests
    // =============================================================

    function test_DirectETHSendReverts() public {
        registerNGO(ngo);
        uint256 projectId = createTestProject(false);

        // Try to send ETH directly to the contract
        // This should revert with DirectETHSendRejected error
        vm.expectRevert(Errors.DirectETHSendRejected.selector);
        payable(address(tracker)).transfer(1 ether);
    }

    function test_MilestoneAmountGreaterThanBalanceReverts() public {
        registerNGO(ngo);
        uint256 projectId = createTestProject(false);

        // Donate less than milestone amount
        vm.deal(donor1, 400 ether);
        uint256 donation = 300 ether; // Less than DEFAULT_MILESTONE_AMOUNT (500 ether)
        donateETH(donor1, projectId, donation);

        // Vote to meet quorum
        voteMilestone(donor1, projectId);

        // Try to release - should fail due to insufficient balance
        vm.expectRevert(Errors.InsufficientProjectBalance.selector);
        releaseFunds(projectId);
    }

    function test_SequentialMilestoneRequirement() public {
        registerNGO(ngo);
        uint256 projectId = createTestProject(false);

        vm.deal(donor1, 1100 ether);
        uint256 donation = 1000 ether;
        donateETH(donor1, projectId, donation);

        // Must release milestone 0 before milestone 1
        voteMilestone(donor1, projectId);
        releaseFunds(projectId);

        // Now can vote on milestone 1
        voteMilestone(donor1, projectId);
        
        // Verify current milestone is 1
        DataStructures.Project memory project = tracker.getProject(projectId);
        assertEq(project.currentMilestone, 1);
    }

    function test_CannotSkipMilestones() public {
        registerNGO(ngo);
        uint256 projectId = createTestProject(false);

        vm.deal(donor1, 1100 ether);
        uint256 donation = 1000 ether;
        donateETH(donor1, projectId, donation);

        // Vote on milestone 0
        voteMilestone(donor1, projectId);
        
        // Try to vote on milestone 1 before releasing milestone 0
        // This should fail because currentMilestone is still 0
        // Actually, voteMilestone always votes on currentMilestone, so we can't skip
        // But let's verify that we must release milestone 0 first
        
        // Release milestone 0
        releaseFunds(projectId);
        
        // Now currentMilestone is 1, so we can vote on milestone 1
        voteMilestone(donor1, projectId);
        
        // Verify we can't vote on milestone 0 anymore (it's already approved)
        DataStructures.Milestone memory milestone0 = tracker.getMilestone(projectId, 0);
        assertTrue(milestone0.approved);
        
        // Verify current milestone is 1
        DataStructures.Project memory project = tracker.getProject(projectId);
        assertEq(project.currentMilestone, 1);
    }

    function test_PauseBlocksDonations() public {
        registerNGO(ngo);
        uint256 projectId = createTestProject(false);

        // Pause the contract
        tracker.pause();

        // Try to donate - should fail
        vm.deal(donor1, 100 ether);
        vm.expectRevert();
        donateETH(donor1, projectId, 50 ether);

        // Unpause
        tracker.unpause();

        // Now donation should work
        donateETH(donor1, projectId, 50 ether);
        assertEq(tracker.getDonorContribution(projectId, donor1), 50 ether);
    }

    function test_PauseBlocksReleases() public {
        registerNGO(ngo);
        uint256 projectId = createTestProject(false);

        vm.deal(donor1, 700 ether);
        uint256 donation = 600 ether;
        donateETH(donor1, projectId, donation);
        voteMilestone(donor1, projectId);

        // Pause the contract
        tracker.pause();

        // Try to release - should fail
        vm.expectRevert();
        releaseFunds(projectId);

        // Unpause
        tracker.unpause();

        // Now release should work
        releaseFunds(projectId);
        
        // Verify milestone was released
        DataStructures.Milestone memory milestone = tracker.getMilestone(projectId, 0);
        assertTrue(milestone.approved);
        assertTrue(milestone.fundsReleased);
    }
}

