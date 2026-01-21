// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library DataStructures {
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

    struct Milestone {
        string description;
        uint256 amountRequested;
        bool approved;
        bool fundsReleased;
        uint256 voteWeight;
    }
}

