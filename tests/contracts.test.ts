import { describe, expect, it } from "vitest";
import { capabilitySchema } from "../src/contracts/registry.js";
import { canTransition, evidenceSchema } from "../src/contracts/task.js";

describe("Core contracts", () => {
  it("rejects an undeclared delivery mode at the registry boundary", () => {
    const input = {
      id: "test-skill",
      version: "1.0.0",
      kind: "skill",
      source: "local",
      description: "test",
      provides: ["test-skill"],
      dependencies: [],
      permissions: [],
      risk: 0,
      providerSupport: { grokbot: "supported", muse: "unknown" },
      verification: "reviewed",
      delivery: { mode: "shell", command: "arbitrary" },
    };
    const result = capabilitySchema.safeParse(input);
    expect(result.success).toBe(false);
  });
  it("rejects task completion before verification", () => {
    const state = "running";
    const allowed = canTransition(state, "succeeded");
    expect(allowed).toBe(false);
  });
  it("requires an independent verification time for verified evidence", () => {
    const input = {
      schemaVersion: "0.1",
      taskId: "7da6916d-4ff1-40dc-8518-d53624687451",
      runId: "bde35297-9bdf-49f7-b28b-2a1811a1dd84",
      tenantId: "local",
      submittedBy: "qa",
      artifact: { uri: "artifact://report", sha256: "a".repeat(64) },
      status: "verified",
      verifiedAt: null,
    };
    const result = evidenceSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});
