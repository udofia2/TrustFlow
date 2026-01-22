// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {CharityTracker} from "../src/CharityTracker.sol";
import {MockUSDC} from "../src/mocks/MockUSDC.sol";
import {DataStructures} from "../src/types/DataStructures.sol";

/// @title Fixtures
/// @notice Shared test setup and helper functions
/// @dev Base contract for all test files to inherit from
abstract contract Fixtures is Test {
    // Contracts
    CharityTracker public tracker;
    MockUSDC public mockUSDC;

    // Test Accounts
    address public owner;
    address public ngo;
    address public donor1;
    address public donor2;
    address public donor3;

    // Helper constants
    uint256 public constant DEFAULT_GOAL = 1000 ether;
    uint256 public constant DEFAULT_MILESTONE_AMOUNT = 500 ether;

    /// @notice Set up test environment
    /// @dev Called before each test
    function setUp() public virtual {
        // Create test accounts
        owner = address(this); // Test contract is owner
        ngo = makeAddr("ngo");
        donor1 = makeAddr("donor1");
        donor2 = makeAddr("donor2");
        donor3 = makeAddr("donor3");

        // Deploy contracts
        tracker = new CharityTracker();
        mockUSDC = new MockUSDC(address(this));

        // Fund test accounts with ETH
        vm.deal(donor1, 100 ether);
        vm.deal(donor2, 100 ether);
        vm.deal(donor3, 100 ether);
        vm.deal(ngo, 10 ether);

        // Mint MockUSDC to test accounts
        mockUSDC.mint(donor1, 1000 * 10 ** 6); // 1000 USDC (6 decimals)
        mockUSDC.mint(donor2, 1000 * 10 ** 6);
        mockUSDC.mint(donor3, 1000 * 10 ** 6);
    }

    /// @notice Register an NGO
    /// @param ngoAddress Address to register as NGO
    function registerNGO(address ngoAddress) internal {
        tracker.registerNGO(ngoAddress);
    }

    /// @notice Create a test project with default parameters
    /// @param useERC20 If true, use MockUSDC; if false, use ETH
    /// @return projectId The ID of the created project
    function createTestProject(bool useERC20) internal returns (uint256 projectId) {
        address donationToken = useERC20 ? address(mockUSDC) : address(0);
        string[] memory descriptions = new string[](2);
        descriptions[0] = "Milestone 1: Initial Setup";
        descriptions[1] = "Milestone 2: Final Delivery";

        uint256[] memory amounts = new uint256[](2);
        amounts[0] = DEFAULT_MILESTONE_AMOUNT;
        amounts[1] = DEFAULT_MILESTONE_AMOUNT;

        vm.prank(ngo);
        projectId = tracker.createProject(donationToken, DEFAULT_GOAL, descriptions, amounts);
    }

    /// @notice Create a test project with custom parameters
    /// @param donationToken Token address (address(0) for ETH)
    /// @param goal Project goal
    /// @param descriptions Array of milestone descriptions
    /// @param amounts Array of milestone amounts
    /// @return projectId The ID of the created project
    function createCustomProject(
        address donationToken,
        uint256 goal,
        string[] memory descriptions,
        uint256[] memory amounts
    ) internal returns (uint256 projectId) {
        vm.prank(ngo);
        projectId = tracker.createProject(donationToken, goal, descriptions, amounts);
    }

    /// @notice Make an ETH donation
    /// @param donor Address making the donation
    /// @param projectId Project ID to donate to
    /// @param amount Amount to donate
    function donateETH(address donor, uint256 projectId, uint256 amount) internal {
        vm.prank(donor);
        tracker.donate{value: amount}(projectId);
    }

    /// @notice Make an ERC20 donation
    /// @param donor Address making the donation
    /// @param projectId Project ID to donate to
    /// @param amount Amount to donate (in token units, not wei)
    function donateERC20(address donor, uint256 projectId, uint256 amount) internal {
        // Approve first
        vm.prank(donor);
        mockUSDC.approve(address(tracker), amount);
        // Then donate
        vm.prank(donor);
        tracker.donateERC20(projectId, amount);
    }

    /// @notice Vote on current milestone
    /// @param voter Address voting
    /// @param projectId Project ID
    function voteMilestone(address voter, uint256 projectId) internal {
        vm.prank(voter);
        tracker.voteMilestone(projectId);
    }

    /// @notice Release funds for current milestone
    /// @param projectId Project ID
    function releaseFunds(uint256 projectId) internal {
        vm.prank(ngo);
        tracker.releaseFunds(projectId);
    }
}

