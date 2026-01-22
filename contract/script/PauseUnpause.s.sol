// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {CharityTracker} from "../src/CharityTracker.sol";

/// @title PauseUnpause Script
/// @notice Script for emergency control (pause/unpause) of the CharityTracker contract
/// @dev Only owner can pause/unpause the contract
contract PauseUnpauseScript is Script {
    CharityTracker public tracker;

    function setUp() public {
        // Load deployment info (optional - can also pass address directly)
    }

    /// @notice Pause the contract
    /// @param _trackerAddress The address of the deployed CharityTracker contract
    function pause(address payable _trackerAddress) public {
        tracker = CharityTracker(_trackerAddress);

        console.log("========================================");
        console.log("Pausing CharityTracker Contract");
        console.log("========================================");
        console.log("CharityTracker:", _trackerAddress);
        console.log("Caller:", msg.sender);
        console.log("Current Pause Status:", tracker.paused());

        // Verify caller is owner
        require(tracker.owner() == msg.sender, "Only owner can pause contract");

        // Check if already paused
        if (tracker.paused()) {
            console.log("WARNING: Contract is already paused!");
            return;
        }

        vm.startBroadcast();

        // Pause the contract
        tracker.pause();

        vm.stopBroadcast();

        // Verify pause
        require(tracker.paused(), "Contract pause failed");

        console.log("\n========================================");
        console.log("Contract Paused Successfully!");
        console.log("========================================");
        console.log("Paused Status:", tracker.paused());
        console.log("\nNOTE: All critical functions are now blocked.");
        console.log("Use unpause() to resume normal operations.");
    }

    /// @notice Unpause the contract
    /// @param _trackerAddress The address of the deployed CharityTracker contract
    function unpause(address payable _trackerAddress) public {
        tracker = CharityTracker(_trackerAddress);

        console.log("========================================");
        console.log("Unpausing CharityTracker Contract");
        console.log("========================================");
        console.log("CharityTracker:", _trackerAddress);
        console.log("Caller:", msg.sender);
        console.log("Current Pause Status:", tracker.paused());

        // Verify caller is owner
        require(tracker.owner() == msg.sender, "Only owner can unpause contract");

        // Check if already unpaused
        if (!tracker.paused()) {
            console.log("WARNING: Contract is already unpaused!");
            return;
        }

        vm.startBroadcast();

        // Unpause the contract
        tracker.unpause();

        vm.stopBroadcast();

        // Verify unpause
        require(!tracker.paused(), "Contract unpause failed");

        console.log("\n========================================");
        console.log("Contract Unpaused Successfully!");
        console.log("========================================");
        console.log("Paused Status:", tracker.paused());
        console.log("\nNOTE: All functions are now operational.");
    }

    /// @notice Toggle pause status
    /// @param _trackerAddress The address of the deployed CharityTracker contract
    function togglePause(address payable _trackerAddress) public {
        tracker = CharityTracker(_trackerAddress);

        console.log("========================================");
        console.log("Toggling Pause Status");
        console.log("========================================");
        console.log("CharityTracker:", _trackerAddress);
        console.log("Current Pause Status:", tracker.paused());

        // Verify caller is owner
        require(tracker.owner() == msg.sender, "Only owner can toggle pause");

        vm.startBroadcast();

        if (tracker.paused()) {
            console.log("Unpausing contract...");
            tracker.unpause();
        } else {
            console.log("Pausing contract...");
            tracker.pause();
        }

        vm.stopBroadcast();

        console.log("\n========================================");
        console.log("Pause Status Toggled!");
        console.log("========================================");
        console.log("New Pause Status:", tracker.paused());
    }
}

