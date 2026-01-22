// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {CharityTracker} from "../src/CharityTracker.sol";

/// @title DeployTracker Script
/// @notice Main deployment script for CharityTracker contract
/// @dev Deploys the contract, verifies deployment, and saves addresses to JSON
contract DeployTrackerScript is Script {
    CharityTracker public tracker;
    address public owner;

    function setUp() public {
        // Get deployer address (will be set via --sender or use default)
        owner = msg.sender;
    }

    function run() public {
        console.log("========================================");
        console.log("Deploying CharityTracker Contract");
        console.log("========================================");
        console.log("Deployer:", owner);
        console.log("Chain ID:", block.chainid);
        console.log("Block Number:", block.number);

        vm.startBroadcast();

        // Deploy CharityTracker contract
        // The owner is automatically set to the deployer (msg.sender)
        tracker = new CharityTracker();

        vm.stopBroadcast();

        // Verify deployment
        console.log("\n========================================");
        console.log("Deployment Verification");
        console.log("========================================");
        console.log("CharityTracker deployed at:", address(tracker));
        console.log("Owner:", tracker.owner());
        console.log("Paused:", tracker.paused());
        console.log("Project Counter:", tracker.projectCounter());

        // Verify owner is set correctly
        require(tracker.owner() == owner, "Owner not set correctly");
        require(!tracker.paused(), "Contract should not be paused initially");

        // Save addresses to JSON
        string memory json = "deployment";
        vm.serializeAddress(json, "charityTracker", address(tracker));
        vm.serializeAddress(json, "owner", owner);
        string memory finalJson = vm.serializeUint(json, "chainId", block.chainid);
        string memory fileName = string.concat("deployment-", vm.toString(block.chainid), ".json");
        vm.writeJson(finalJson, fileName);

        console.log("\n========================================");
        console.log("Deployment Complete!");
        console.log("========================================");
        console.log("Addresses saved to:", fileName);
        console.log("\nNext steps:");
        console.log("1. Register NGOs using RegisterNGO.s.sol");
        console.log("2. Verify contract on block explorer");
        console.log("3. Update frontend with contract address");
    }
}

