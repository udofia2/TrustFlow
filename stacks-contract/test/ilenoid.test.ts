import { describe, it, expect, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";
import {
  getAccounts,
  registerNGO,
  revokeNGO,
  createProject,
  donateSTX,
  voteOnMilestone,
  releaseFunds,
  pauseContract,
  unpauseContract,
  emergencyWithdraw,
  getProject,
  getMilestone,
  getDonorContribution,
  getMilestoneVoteStatus,
  isVerifiedNGO,
  getProjectCounter,
  getContractPaused,
  getProjectBalance,
} from "./helpers";

const CONTRACT_NAME = "ilenoid";

describe("Ilenoid Contract Tests", () => {
  let accounts: ReturnType<typeof getAccounts>;

  beforeEach(() => {
    accounts = getAccounts();
  });

  describe("NGO Management", () => {
    it("should allow owner to register an NGO", () => {
      const result = registerNGO(accounts.wallet1, "deployer");
      expect(result.result).toBeOk(Cl.bool(true));

      const verified = isVerifiedNGO(accounts.wallet1);
      expect(verified.result).toBeBool(true);
    });

    it("should not allow non-owner to register an NGO", () => {
      const result = registerNGO(accounts.wallet2, "wallet1");
      expect(result.result).toBeErr(Cl.uint(61)); // ERR_UNAUTHORIZED
    });

    it("should allow owner to revoke NGO status", () => {
      // First register
      registerNGO(accounts.wallet1, "deployer");
      
      // Then revoke
      const result = revokeNGO(accounts.wallet1, "deployer");
      expect(result.result).toBeOk(Cl.bool(true));

      const verified = isVerifiedNGO(accounts.wallet1);
      expect(verified.result).toBeBool(false);
    });

    it("should not allow non-owner to revoke NGO", () => {
      registerNGO(accounts.wallet1, "deployer");
      
      const result = revokeNGO(accounts.wallet1, "wallet2");
      expect(result.result).toBeErr(Cl.uint(61)); // ERR_UNAUTHORIZED
    });
  });

  describe("Project Creation", () => {
    beforeEach(() => {
      registerNGO(accounts.wallet1, "deployer");
    });

    it("should allow verified NGO to create a project", () => {
      const result = createProject(
        accounts.wallet1,
        1000000, // 1 STX goal
        ["Milestone 1", "Milestone 2"],
        [500000, 500000], // 0.5 STX each
        null // STX project
      );

      expect(result.result).toBeOk(Cl.uint(1));

      const project = getProject(1);
      expect(project.result.type).toBe("some"); // some
      if (project.result.type === "some") {
        const val = project.result.value as any;
        const projectData = val.data || val;
        expect((projectData.id ?? projectData["id"])).toBeUint(1);
        expect((projectData.ngo ?? projectData["ngo"])).toBePrincipal(accounts.wallet1);
        expect((projectData.goal ?? projectData["goal"])).toBeUint(1000000);
        expect((projectData["is-active"] ?? projectData.isActive)).toBeBool(true);
        expect((projectData["is-completed"] ?? projectData.isCompleted)).toBeBool(false);
      }
    });

    it("should not allow non-verified NGO to create project", () => {
      const result = createProject(
        accounts.wallet2, // Not verified
        1000000,
        ["Milestone 1"],
        [1000000],
        null
      );

      expect(result.result).toBeErr(Cl.uint(13)); // ERR_NOT_VERIFIED_NGO
    });

    it("should reject project with invalid goal (0)", () => {
      const result = createProject(
        accounts.wallet1,
        0, // Invalid goal
        ["Milestone 1"],
        [1000000],
        null
      );

      expect(result.result).toBeErr(Cl.uint(20)); // ERR_INVALID_GOAL
    });

    it("should reject project when milestone sum exceeds goal", () => {
      const result = createProject(
        accounts.wallet1,
        1000000, // Goal: 1 STX
        ["Milestone 1", "Milestone 2"],
        [600000, 500000], // Sum: 1.1 STX (exceeds goal)
        null
      );

      expect(result.result).toBeErr(Cl.uint(23)); // ERR_MILESTONE_SUM_EXCEEDS_GOAL
    });

    it("should increment project counter", () => {
      const counterBefore = getProjectCounter();
      expect(counterBefore).toBeUint(0);

      createProject(accounts.wallet1, 1000000, ["Milestone 1"], [1000000], null);

      const counterAfter = getProjectCounter();
      expect(counterAfter).toBeUint(1);
    });
  });

  describe("STX Donations", () => {
    let projectId: number;

    beforeEach(() => {
      registerNGO(accounts.wallet1, "deployer");
      const result = createProject(
        accounts.wallet1,
        1000000,
        ["Milestone 1", "Milestone 2"],
        [500000, 500000],
        null
      );
      projectId = 1;
    });

    it("should allow STX donation to active project", () => {
      const result = donateSTX(projectId, 100000, accounts.wallet2);
      expect(result.result).toBeOk(Cl.uint(100000));

      const contribution = getDonorContribution(projectId, accounts.wallet2);
      expect(contribution.result).toBeUint(100000);

      const project = getProject(projectId);
      if (project.result.type === "some") {
        const projectData = project.result.value.data || project.result.value;
        expect(projectData["total-donated"]).toBeUint(100000);
        expect(projectData.balance).toBeUint(100000);
      }
    });

    it("should reject donation with amount 0", () => {
      const result = donateSTX(projectId, 0, accounts.wallet2);
      expect(result.result).toBeErr(Cl.uint(33)); // ERR_INVALID_DONATION_AMOUNT
    });

    it("should reject donation to non-existent project", () => {
      const result = donateSTX(999, 100000, accounts.wallet2);
      expect(result.result).toBeErr(Cl.uint(30)); // ERR_PROJECT_NOT_FOUND
    });

    it("should accumulate multiple donations from same donor", () => {
      donateSTX(projectId, 100000, accounts.wallet2);
      donateSTX(projectId, 50000, accounts.wallet2);

      const contribution = getDonorContribution(projectId, accounts.wallet2);
      expect(contribution.result).toBeUint(150000);
    });

    it("should reject donation when contract is paused", () => {
      pauseContract("deployer");
      
      const result = donateSTX(projectId, 100000, accounts.wallet2);
      expect(result.result).toBeErr(Cl.uint(60)); // ERR_CONTRACT_PAUSED

      unpauseContract("deployer");
    });
  });

  describe("Milestone Voting", () => {
    let projectId: number;

    beforeEach(() => {
      registerNGO(accounts.wallet1, "deployer");
      const result = createProject(
        accounts.wallet1,
        1000000,
        ["Milestone 1", "Milestone 2"],
        [500000, 500000],
        null
      );
      projectId = 1;

      // Donate to enable voting
      donateSTX(projectId, 100000, accounts.wallet2);
      donateSTX(projectId, 200000, accounts.wallet3);
    });

    it("should allow donor to vote on milestone", () => {
      const result = voteOnMilestone(projectId, accounts.wallet2);
      expect(result.result).toBeOk(Cl.uint(100000)); // Vote weight = contribution

      const milestone = getMilestone(projectId, 0);
      if (milestone.result.type === "some") {
        const milestoneData = milestone.result.value.data || milestone.result.value;
        expect(milestoneData["vote-weight"]).toBeUint(100000);
      }
    });

    it("should reject vote from non-donor", () => {
      const result = voteOnMilestone(projectId, accounts.wallet4);
      expect(result.result).toBeErr(Cl.uint(40)); // ERR_NO_CONTRIBUTION
    });

    it("should reject duplicate vote from same donor", () => {
      voteOnMilestone(projectId, accounts.wallet2);
      
      const result = voteOnMilestone(projectId, accounts.wallet2);
      expect(result.result).toBeErr(Cl.uint(41)); // ERR_ALREADY_VOTED
    });

    it("should capture snapshot on first vote", () => {
      const statusBefore = getMilestoneVoteStatus(projectId, 0);
      
      voteOnMilestone(projectId, accounts.wallet2);
      
      const statusAfter = getMilestoneVoteStatus(projectId, 0);
      if (statusAfter.result.type === "some" && statusAfter.result.value.type === "ok") {
        const voteStatus = statusAfter.result.value.value;
        expect(voteStatus.snapshot).toBeUint(300000); // Total donations at vote start
      }
    });

    it("should accumulate vote weights from multiple voters", () => {
      voteOnMilestone(projectId, accounts.wallet2); // 100000
      voteOnMilestone(projectId, accounts.wallet3); // 200000

      const milestone = getMilestone(projectId, 0);
      if (milestone.result.type === "some") {
        const milestoneData = milestone.result.value.data || milestone.result.value;
        expect(milestoneData["vote-weight"]).toBeUint(300000);
      }
    });
  });

  describe("Fund Release", () => {
    let projectId: number;

    beforeEach(() => {
      registerNGO(accounts.wallet1, "deployer");
      const result = createProject(
        accounts.wallet1,
        1000000,
        ["Milestone 1", "Milestone 2"],
        [500000, 500000],
        null
      );
      projectId = 1;

      // Donate and vote to meet quorum
      donateSTX(projectId, 400000, accounts.wallet2);
      donateSTX(projectId, 200000, accounts.wallet3);
      voteOnMilestone(projectId, accounts.wallet2);
      voteOnMilestone(projectId, accounts.wallet3);
    });

    it("should allow NGO to release funds when quorum is met", () => {
      const result = releaseFunds(projectId, accounts.wallet1);
      expect(result.result).toBeOk(Cl.uint(500000));

      const milestone = getMilestone(projectId, 0);
      if (milestone.result.type === "some") {
        const milestoneData = milestone.result.value.data || milestone.result.value;
        expect(milestoneData.approved).toBeBool(true);
        expect(milestoneData["funds-released"]).toBeBool(true);
      }

      const project = getProject(projectId);
      if (project.result.type === "some") {
        const projectData = project.result.value.data || project.result.value;
        expect(projectData.balance).toBeUint(100000); // 600000 - 500000
        expect(projectData["current-milestone"]).toBeUint(1);
      }
    });

    it("should not allow non-NGO to release funds", () => {
      const result = releaseFunds(projectId, accounts.wallet2);
      expect(result.result).toBeErr(Cl.uint(50)); // ERR_NOT_PROJECT_NGO
    });

    it("should reject release when quorum not met", () => {
      // Create new project with insufficient votes
      registerNGO(accounts.wallet2, "deployer");
      const newProject = createProject(
        accounts.wallet2,
        1000000,
        ["Milestone 1"],
        [1000000],
        null
      );
      const newProjectId = 2;

      donateSTX(newProjectId, 100000, accounts.wallet3);
      voteOnMilestone(newProjectId, accounts.wallet3);

      const result = releaseFunds(newProjectId, accounts.wallet2);
      expect(result.result).toBeErr(Cl.uint(54)); // ERR_QUORUM_NOT_MET
    });

    it("should mark project as completed on final milestone", () => {
      // Release first milestone
      releaseFunds(projectId, accounts.wallet1);

      // Donate and vote for second milestone
      donateSTX(projectId, 100000, accounts.wallet2);
      voteOnMilestone(projectId, accounts.wallet2);

      // Release second milestone (final)
      const result = releaseFunds(projectId, accounts.wallet1);
      expect(result.result).toBeOk(Cl.uint(500000));

      const project = getProject(projectId);
      if (project.result.type === "some") {
        const projectData = project.result.value.data || project.result.value;
        expect(projectData["is-completed"] || projectData.isCompleted).toBeBool(true);
        expect(projectData["is-active"] || projectData.isActive).toBeBool(false);
      }
    });
  });

  describe("Pause Mechanism", () => {
    it("should allow owner to pause contract", () => {
      const result = pauseContract("deployer");
      expect(result.result).toBeOk(Cl.bool(true));

      const paused = getContractPaused();
      expect(paused).toBeBool(true);
    });

    it("should not allow non-owner to pause", () => {
      const result = pauseContract("wallet1");
      expect(result.result).toBeErr(Cl.uint(61)); // ERR_UNAUTHORIZED
    });

    it("should allow owner to unpause contract", () => {
      pauseContract("deployer");
      
      const result = unpauseContract("deployer");
      expect(result.result).toBeOk(Cl.bool(true));

      const paused = getContractPaused();
      expect(paused).toBeBool(false);
    });
  });

  describe("Emergency Withdrawal", () => {
    let projectId: number;

    beforeEach(() => {
      registerNGO(accounts.wallet1, "deployer");
      const result = createProject(
        accounts.wallet1,
        1000000,
        ["Milestone 1"],
        [1000000],
        null
      );
      projectId = 1;

      donateSTX(projectId, 500000, accounts.wallet2);
      pauseContract("deployer");
    });

    it("should allow owner to withdraw when paused", () => {
      const balanceBefore = getProjectBalance(projectId);
      expect(balanceBefore).toBeUint(500000);

      const result = emergencyWithdraw(projectId, "deployer");
      expect(result.result).toBeOk(Cl.uint(500000));

      const balanceAfter = getProjectBalance(projectId);
      expect(balanceAfter).toBeUint(0);
    });

    it("should not allow non-owner to withdraw", () => {
      const result = emergencyWithdraw(projectId, "wallet1");
      expect(result.result).toBeErr(Cl.uint(61)); // ERR_UNAUTHORIZED
    });

    it("should reject withdrawal when not paused", () => {
      unpauseContract("deployer");
      
      const result = emergencyWithdraw(projectId, "deployer");
      expect(result.result).toBeErr(Cl.uint(60)); // ERR_CONTRACT_PAUSED
    });
  });

  describe("Read-Only Functions", () => {
    let projectId: number;

    beforeEach(() => {
      registerNGO(accounts.wallet1, "deployer");
      const result = createProject(
        accounts.wallet1,
        1000000,
        ["Milestone 1", "Milestone 2"],
        [500000, 500000],
        null
      );
      projectId = 1;
    });

    it("should return project information", () => {
      const project = getProject(projectId);
      expect(project.result.type).toBe(1); // some
      if (project.result.type === "some") {
        const projectData = project.result.value.data || project.result.value;
        expect(projectData.id).toBeUint(1);
        expect(projectData.ngo).toBePrincipal(accounts.wallet1);
      }
    });

    it("should return milestone information", () => {
      const milestone = getMilestone(projectId, 0);
      expect(milestone.result.type).toBe("some"); // some
      if (milestone.result.type === "some") {
        const milestoneData = (milestone.result.value as any).data || milestone.result.value;
        expect(milestoneData["amount-requested"] || (milestoneData as any)["amount-requested"]).toBeUint(500000);
      }
    });

    it("should return donor contribution", () => {
      donateSTX(projectId, 100000, accounts.wallet2);
      
      const contribution = getDonorContribution(projectId, accounts.wallet2);
      expect(contribution.result).toBeUint(100000);
    });

    it("should return milestone vote status", () => {
      donateSTX(projectId, 400000, accounts.wallet2);
      voteOnMilestone(projectId, accounts.wallet2);

      const status = getMilestoneVoteStatus(projectId, 0);
      expect(status.result.type).toBe("some"); // some
      if (status.result.type === "some" && status.result.value.type === "ok") {
        const voteStatus = status.result.value.value;
        expect(voteStatus["vote-weight"]).toBeUint(400000);
        expect(voteStatus["can-release"]).toBeBool(true);
      }
    });
  });

  describe("Integration: Full Project Lifecycle", () => {
    it("should complete full project lifecycle", () => {
      // 1. Register NGO
      registerNGO(accounts.wallet1, "deployer");
      expect(isVerifiedNGO(accounts.wallet1).result).toBeBool(true);

      // 2. Create project
      const createResult = createProject(
        accounts.wallet1,
        1000000,
        ["Milestone 1", "Milestone 2"],
        [500000, 500000],
        null
      );
      expect(createResult.result).toBeOk(Cl.uint(1));
      const projectId = 1;

      // 3. Multiple donations
      donateSTX(projectId, 200000, accounts.wallet2);
      donateSTX(projectId, 300000, accounts.wallet3);
      donateSTX(projectId, 100000, accounts.wallet4);

      const project = getProject(projectId);
      if (project.result.type === "some") {
        const projectData = project.result.value.data || project.result.value;
        expect(projectData["total-donated"]).toBeUint(600000);
        expect(projectData.balance).toBeUint(600000);
      }

      // 4. Voting
      voteOnMilestone(projectId, accounts.wallet2);
      voteOnMilestone(projectId, accounts.wallet3);
      voteOnMilestone(projectId, accounts.wallet4);

      const milestone = getMilestone(projectId, 0);
      if (milestone.result.type === "some") {
        const milestoneData = milestone.result.value.data || milestone.result.value;
        expect(milestoneData["vote-weight"]).toBeUint(600000);
      }

      // 5. Release funds
      const releaseResult = releaseFunds(projectId, accounts.wallet1);
      expect(releaseResult.result).toBeOk(Cl.uint(500000));

      // 6. Verify milestone advanced
      const projectAfter = getProject(projectId);
      if (projectAfter.result.type === "some") {
        const projectData = projectAfter.result.value.data || projectAfter.result.value;
        expect(projectData["current-milestone"]).toBeUint(1);
        expect(projectData.balance).toBeUint(100000);
      }
    });
  });
});

