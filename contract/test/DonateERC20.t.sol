// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {Fixtures} from "./Fixtures.t.sol";
import {CharityTracker} from "../src/CharityTracker.sol";
import {Errors} from "../src/libraries/Errors.sol";
import {DataStructures} from "../src/types/DataStructures.sol";

/// @title DonateERC20 Tests
/// @notice Tests for ERC20 donation functionality
contract DonateERC20Test is Fixtures {
    uint256 public projectId;

    function setUp() public override {
        super.setUp();
        registerNGO(ngo);
        projectId = createTestProject(true); // ERC20 project
    }

    // =============================================================
    // Phase 13.2: ERC20 Donation Tests
    // =============================================================

    function test_SuccessfulERC20Donation() public {
        uint256 donationAmount = 100 * 10 ** 6; // 100 USDC (6 decimals)
        uint256 initialBalance = mockUSDC.balanceOf(address(tracker));

        // Approve first
        vm.prank(donor1);
        mockUSDC.approve(address(tracker), donationAmount);

        vm.expectEmit(true, true, false, false);
        emit CharityTracker.DonationReceived(projectId, donor1, donationAmount);

        // Donate
        vm.prank(donor1);
        tracker.donateERC20(projectId, donationAmount);

        // Check accounting
        assertEq(tracker.donorContributions(projectId, donor1), donationAmount);
        assertEq(tracker.totalProjectDonations(projectId), donationAmount);
        
        // Check project state using public mapping (returns tuple)
        (,,,, uint256 totalDonated, uint256 balance,,,) = tracker.projects(projectId);
        assertEq(totalDonated, donationAmount);
        assertEq(balance, donationAmount);
        assertEq(mockUSDC.balanceOf(address(tracker)), initialBalance + donationAmount);
    }

    function test_InsufficientAllowanceReverts() public {
        uint256 donationAmount = 100 * 10 ** 6;
        
        // Don't approve or approve less than needed
        vm.prank(donor1);
        mockUSDC.approve(address(tracker), donationAmount - 1);

        vm.expectRevert(Errors.InsufficientAllowance.selector);
        vm.prank(donor1);
        tracker.donateERC20(projectId, donationAmount);
    }

    function test_InsufficientBalanceReverts() public {
        uint256 donationAmount = 2000 * 10 ** 6; // More than donor has (1000 USDC)
        
        vm.prank(donor1);
        mockUSDC.approve(address(tracker), donationAmount);

        vm.expectRevert(Errors.InsufficientBalance.selector);
        vm.prank(donor1);
        tracker.donateERC20(projectId, donationAmount);
    }

    function test_DonationAccountingUpdatesCorrectly() public {
        uint256 donation1 = 50 * 10 ** 6;
        uint256 donation2 = 75 * 10 ** 6;
        uint256 totalDonation = donation1 + donation2;

        // First donation
        vm.prank(donor1);
        mockUSDC.approve(address(tracker), donation1);
        donateERC20(donor1, projectId, donation1);

        // Second donation
        vm.prank(donor2);
        mockUSDC.approve(address(tracker), donation2);
        donateERC20(donor2, projectId, donation2);

        // Check individual contributions
        assertEq(tracker.donorContributions(projectId, donor1), donation1);
        assertEq(tracker.donorContributions(projectId, donor2), donation2);

        // Check total donations
        assertEq(tracker.totalProjectDonations(projectId), totalDonation);

        // Check project state using public mapping
        (,,,, uint256 totalDonated, uint256 balance,,,) = tracker.projects(projectId);
        assertEq(totalDonated, totalDonation);
        assertEq(balance, totalDonation);
    }

    function test_DonationEventEmission() public {
        uint256 donationAmount = 50 * 10 ** 6;

        vm.startPrank(donor1);
        mockUSDC.approve(address(tracker), donationAmount);

        vm.expectEmit(true, true, false, false);
        emit CharityTracker.DonationReceived(projectId, donor1, donationAmount);

        tracker.donateERC20(projectId, donationAmount);
        vm.stopPrank();
    }

    function test_MultipleDonationsAccumulate() public {
        uint256 donation1 = 30 * 10 ** 6;
        uint256 donation2 = 40 * 10 ** 6;
        uint256 donation3 = 50 * 10 ** 6;
        uint256 total = donation1 + donation2 + donation3;

        // Approve all at once
        vm.prank(donor1);
        mockUSDC.approve(address(tracker), total);

        donateERC20(donor1, projectId, donation1);
        donateERC20(donor1, projectId, donation2);
        donateERC20(donor1, projectId, donation3);

        // Check donor's total contribution
        assertEq(tracker.donorContributions(projectId, donor1), total);
        
        // Check project totals
        assertEq(tracker.totalProjectDonations(projectId), total);
        (,,,, uint256 totalDonated, uint256 balance,,,) = tracker.projects(projectId);
        assertEq(totalDonated, total);
        assertEq(balance, total);
    }

    function test_DonationToETHProjectReverts() public {
        // Create ETH project
        uint256 ethProjectId = createTestProject(false);

        uint256 donationAmount = 100 * 10 ** 6;
        vm.prank(donor1);
        mockUSDC.approve(address(tracker), donationAmount);

        vm.expectRevert(Errors.InvalidDonationToken.selector);
        vm.prank(donor1);
        tracker.donateERC20(ethProjectId, donationAmount);
    }

    function test_DonationToNonExistentProjectReverts() public {
        uint256 donationAmount = 100 * 10 ** 6;
        vm.prank(donor1);
        mockUSDC.approve(address(tracker), donationAmount);

        vm.expectRevert(Errors.ProjectNotFound.selector);
        vm.prank(donor1);
        tracker.donateERC20(999, donationAmount);
    }

    function test_ZeroAmountDonationReverts() public {
        vm.expectRevert(Errors.InvalidDonationAmount.selector);
        vm.prank(donor1);
        tracker.donateERC20(projectId, 0);
    }

    function test_DonationWhenPausedReverts() public {
        tracker.pause();
        
        uint256 donationAmount = 100 * 10 ** 6;
        vm.prank(donor1);
        mockUSDC.approve(address(tracker), donationAmount);

        vm.expectRevert();
        vm.prank(donor1);
        tracker.donateERC20(projectId, donationAmount);
    }
}

