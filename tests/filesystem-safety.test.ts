import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { registrySchema } from "../src/contracts/registry.js";
import { applyPlan } from "../src/installer/apply.js";
import { createPlan } from "../src/installer/plan.js";
import { withWorkspaceLock } from "../src/installer/state.js";
import { exists, readData, safePath } from "../src/io.js";
import { loadCatalog } from "../src/registry/catalog.js";

let workspace: string;
beforeEach(async () => {
  workspace = await mkdtemp(join(tmpdir(), "ohmy-safety-"));
});
afterEach(async () => {
  await rm(workspace, { recursive: true, force: true });
});

describe("Filesystem and trust boundaries", () => {
  it("rejects a path outside the managed root", async () => {
    await expect(safePath(workspace, "../escape")).rejects.toMatchObject({ code: "PATH_ESCAPE" });
  });
  it("rejects a managed directory redirected by a junction", async () => {
    const outside = join(workspace, "outside");
    await mkdir(outside);
    await symlink(outside, join(workspace, ".ohmy"), "junction");
    await expect(safePath(workspace, ".ohmy/skills")).rejects.toMatchObject({
      code: "SYMLINK_REJECTED",
    });
  });
  it("refuses a second installer while the workspace is locked", async () => {
    const catalog = await loadCatalog("registry/catalog.json");
    const plan = await createPlan(catalog, { name: "oh-my-core", range: "*", provider: "grokbot" });
    await withWorkspaceLock(workspace, async () => {
      await expect(
        applyPlan(catalog, plan, {
          workspace,
          consent: true,
          allowUnverified: true,
          dryRun: false,
        }),
      ).rejects.toMatchObject({ code: "WORKSPACE_LOCKED" });
    });
    expect(await exists(join(workspace, ".ohmy", "operation.lock"))).toBe(false);
  });
  it("preserves a conflicting file instead of overwriting it", async () => {
    const catalog = await loadCatalog("registry/catalog.json");
    const plan = await createPlan(catalog, { name: "oh-my-core", range: "*", provider: "grokbot" });
    const directory = join(workspace, ".ohmy", "skills", "source-research");
    await mkdir(directory, { recursive: true });
    const file = join(directory, "SKILL.md");
    await writeFile(file, "user content");
    await expect(
      applyPlan(catalog, plan, { workspace, consent: true, allowUnverified: true, dryRun: false }),
    ).rejects.toMatchObject({ code: "FILE_CONFLICT" });
    expect(await readFile(file, "utf8")).toBe("user content");
  });
  it("never lets the development flag install an unreviewed pack", async () => {
    const original = await loadCatalog("registry/catalog.json");
    const data = registrySchema.parse({
      ...original.data,
      packs: original.data.packs.map((pack) => ({
        ...pack,
        metadata: { ...pack.metadata, verification: "discovered" },
      })),
    });
    const catalog = { ...original, data };
    const plan = await createPlan(catalog, { name: "oh-my-core", range: "*", provider: "grokbot" });
    await expect(
      applyPlan(catalog, plan, { workspace, consent: true, allowUnverified: true, dryRun: false }),
    ).rejects.toMatchObject({ code: "PLAN_BLOCKED" });
  });
  it("rejects duplicate YAML keys at the file boundary", async () => {
    const file = join(workspace, "invalid.yaml");
    await writeFile(file, "apiVersion: first\napiVersion: second\n");
    await expect(readData(file, registrySchema)).rejects.toMatchObject({
      code: "DOCUMENT_INVALID",
    });
  });
});
