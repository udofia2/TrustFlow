import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";

describe("Basic Contract Tests", () => {
  it("should have simnet available", () => {
    expect(simnet).toBeDefined();
  });

  it("should be able to get accounts", () => {
    const accounts = simnet.getAccounts();
    expect(accounts).toBeDefined();
    expect(accounts.size).toBeGreaterThan(0);
  });

  it("should be able to read project counter", () => {
    const counter = simnet.getDataVar("ilenoid", "project-counter");
    expect(counter).toBeDefined();
  });
});

