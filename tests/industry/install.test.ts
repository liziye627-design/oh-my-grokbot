import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "vitest";
import { loadIndustryCatalog } from "../../src/industry/catalog.js";
import { applyPlan } from "../../src/installer/apply.js";
import { createPlan } from "../../src/installer/plan.js";
import { rollback } from "../../src/installer/rollback.js";
import { exists } from "../../src/io.js";

it("installs and rolls back industry resources when an employee pack is selected", async () => {
  // Given real manifests and a fresh workspace.
  const catalog = await loadIndustryCatalog("registry/catalog.json");
  const plan = await createPlan(catalog, {
    name: "oh-my-app-studio",
    range: "*",
    provider: "grokbot",
  });
  const workspace = await mkdtemp(join(tmpdir(), "ohmy-industry-install-"));
  try {
    // When the existing installer stages the industry pack.
    const result = await applyPlan(catalog, plan, {
      workspace,
      consent: true,
      allowUnverified: true,
      dryRun: false,
    });
    if (!("id" in result)) throw new Error("Expected installation");
    // Then role/workflow resources are not mistaken for Skills and rollback owns them.
    const manifest = join(workspace, ".ohmy/resources/app-studio-team/industry.json");
    expect(await exists(manifest)).toBe(true);
    expect(await exists(join(workspace, ".ohmy/skills/source-research/SKILL.md"))).toBe(true);
    await rollback(workspace, result.id);
    expect(await exists(manifest)).toBe(false);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});
