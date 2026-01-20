// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

/// @title CharityTracker
/// @notice Milestone-based charity donation escrow with weighted donor voting (ETH + ERC20).
/// @dev Phase 1: Contract foundation only (events + base security controls).
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


