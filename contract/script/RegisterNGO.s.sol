// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {CharityTracker} from "../src/CharityTracker.sol";

/// @title RegisterNGO Script
/// @notice Script to register NGOs on the CharityTracker contract
/// @dev Takes NGO address as parameter and registers it
contract RegisterNGOScript is Script {
    CharityTracker public tracker;
    address public ngoAddress;

    function setUp() public {
        // Load deployment info (optional - can also pass address directly)
        // For now, we'll require the address to be passed via environment variable or function parameter
    }

    /// @notice Register a single NGO
    /// @param _trackerAddress The address of the deployed CharityTracker contract
    /// @param _ngoAddress The address of the NGO to register
    function run(address payable _trackerAddress, address _ngoAddress) public {
        tracker = CharityTracker(_trackerAddress);
        ngoAddress = _ngoAddress;

        console.log("========================================");
        console.log("Registering NGO");
        console.log("========================================");
        console.log("CharityTracker:", _trackerAddress);
        console.log("NGO Address:", _ngoAddress);
        console.log("Caller:", msg.sender);

        // Verify caller is owner
        require(tracker.owner() == msg.sender, "Only owner can register NGOs");

        // Check if NGO is already registered
        bool isAlreadyVerified = tracker.isVerifiedNGO(_ngoAddress);
        if (isAlreadyVerified) {
            console.log("WARNING: NGO is already verified!");
            return;
        }

        vm.startBroadcast();

        // Register NGO
        tracker.registerNGO(_ngoAddress);

        vm.stopBroadcast();

        // Verify registration
        require(tracker.isVerifiedNGO(_ngoAddress), "NGO registration failed");

        console.log("\n========================================");
        console.log("NGO Registration Complete!");
        console.log("========================================");
        console.log("NGO Address:", _ngoAddress);
        console.log("Verified:", tracker.isVerifiedNGO(_ngoAddress));
    }

    /// @notice Register multiple NGOs at once
    /// @param _trackerAddress The address of the deployed CharityTracker contract
    /// @param _ngoAddresses Array of NGO addresses to register
    function runBatch(address payable _trackerAddress, address[] memory _ngoAddresses) public {
        tracker = CharityTracker(_trackerAddress);

        console.log("========================================");
        console.log("Registering Multiple NGOs");
        console.log("========================================");
        console.log("CharityTracker:", _trackerAddress);
        console.log("Number of NGOs:", _ngoAddresses.length);

        // Verify caller is owner
        require(tracker.owner() == msg.sender, "Only owner can register NGOs");

        vm.startBroadcast();

        for (uint256 i = 0; i < _ngoAddresses.length; i++) {
            address ngo = _ngoAddresses[i];
            
            if (ngo == address(0)) {
                console.log("Skipping zero address at index:", i);
                continue;
            }

            if (tracker.isVerifiedNGO(ngo)) {
                console.log("Skipping already verified NGO at index:", i, "Address:", ngo);
                continue;
            }

            console.log("Registering NGO");
            console.log("Index:", i + 1);
            console.log("Total:", _ngoAddresses.length);
            console.log("Address:", ngo);
            tracker.registerNGO(ngo);
        }

        vm.stopBroadcast();

        console.log("\n========================================");
        console.log("Batch Registration Complete!");
        console.log("========================================");
        
        // Verify all registrations
        for (uint256 i = 0; i < _ngoAddresses.length; i++) {
            if (_ngoAddresses[i] != address(0)) {
                console.log("NGO", i + 1);
                console.log("Address:", _ngoAddresses[i]);
                console.log("Verified:", tracker.isVerifiedNGO(_ngoAddresses[i]));
            }
        }
    }
}

