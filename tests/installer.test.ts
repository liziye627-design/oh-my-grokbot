import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { Installation, InstallPlan } from "../src/contracts/installation.js";
import { type ApplyOptions, applyPlan } from "../src/installer/apply.js";
import { createPlan } from "../src/installer/plan.js";
import { rollback } from "../src/installer/rollback.js";
import { installations } from "../src/installer/state.js";
import { verifyInstallation } from "../src/installer/verify.js";
import { exists } from "../src/io.js";
import { type Catalog, loadCatalog } from "../src/registry/catalog.js";

let catalog: Catalog;
let plan: InstallPlan;
let workspace: string;
let config: ApplyOptions;
beforeAll(async () => {
  catalog = await loadCatalog("registry/catalog.json");
  plan = await createPlan(catalog, { name: "oh-my-core", range: "*", provider: "grokbot" });
});
beforeEach(async () => {
  workspace = await mkdtemp(join(tmpdir(), "ohmy-core-"));
  config = { workspace, consent: true, allowUnverified: true, dryRun: false };
});
afterEach(async () => {
  await rm(workspace, { recursive: true, force: true });
});
async function install(): Promise<Installation> {
  const result = await applyPlan(catalog, plan, config);
  if (!("id" in result)) throw new Error("Expected an installation record");
  return result;
}

describe("Local installer lifecycle", () => {
  it("stages twelve licensed Skills but keeps native verification pending", async () => {
    const record = await install();
    const checks = await verifyInstallation(workspace, record);
    expect(plan.capabilities.filter((item) => item.kind === "skill")).toHaveLength(12);
    expect(checks.filter((check) => check.code === "FILE_VERIFIED")).toHaveLength(
      plan.files.length,
    );
    expect(record.state).toBe("needs_human");
  });
  it("reuses the same installation when applied twice", async () => {
    const first = await install();
    const second = await install();
    expect(second.id).toBe(first.id);
    expect(await installations(workspace)).toHaveLength(1);
  });
  it("creates no workspace state during dry-run", async () => {
    await applyPlan(catalog, plan, { ...config, dryRun: true, consent: false });
    expect(await exists(join(workspace, ".ohmy"))).toBe(false);
  });
  it("requires explicit consent before filesystem changes", async () => {
    await expect(applyPlan(catalog, plan, { ...config, consent: false })).rejects.toMatchObject({
      code: "CONSENT_REQUIRED",
    });
    expect(await exists(join(workspace, ".ohmy"))).toBe(false);
  });
  it("rejects unverified development resources by default", async () => {
    await expect(
      applyPlan(catalog, plan, { ...config, allowUnverified: false }),
    ).rejects.toMatchObject({ code: "UNVERIFIED_RESOURCE" });
  });
  it("rejects a modified lockfile before filesystem changes", async () => {
    const tampered = { ...plan, permissions: [] };
    await expect(applyPlan(catalog, tampered, config)).rejects.toMatchObject({
      code: "LOCK_STALE_OR_TAMPERED",
    });
    expect(await exists(join(workspace, ".ohmy"))).toBe(false);
  });
  it("removes owned files and preserves unrelated files during rollback", async () => {
    const record = await install();
    const unrelated = join(workspace, ".ohmy", "keep.txt");
    await writeFile(unrelated, "user-owned");
    const result = await rollback(workspace, record.id);
    expect(result.state).toBe("rolled_back");
    expect(await readFile(unrelated, "utf8")).toBe("user-owned");
    expect(await exists(join(workspace, ".ohmy", "skills/source-research/SKILL.md"))).toBe(false);
  });
  it("preserves existing identical files that the installer did not create", async () => {
    const original = await readFile("skills/source-research/SKILL.md");
    const directory = join(workspace, ".ohmy", "skills", "source-research");
    await mkdir(directory, { recursive: true });
    const file = join(directory, "SKILL.md");
    await writeFile(file, original);
    const record = await install();
    await rollback(workspace, record.id);
    expect(await readFile(file)).toEqual(original);
  });
  it("detects drift and refuses to delete edited files", async () => {
    const record = await install();
    const file = join(workspace, ".ohmy", "skills", "source-research", "SKILL.md");
    await writeFile(file, "edited by user");
    const checks = await verifyInstallation(workspace, record);
    expect(checks.some((check) => check.code === "FILE_MISSING_OR_CHANGED")).toBe(true);
    await expect(rollback(workspace, record.id)).rejects.toMatchObject({
      code: "ROLLBACK_CONFLICT",
    });
    expect(await readFile(file, "utf8")).toBe("edited by user");
  });
  it("reports an interrupted installation as failed despite complete local files", async () => {
    const record = await install();
    const checks = await verifyInstallation(workspace, { ...record, state: "failed" });
    expect(
      checks.some(
        (check) => check.code === "INTERRUPTED_INSTALLATION" && check.status === "failed",
      ),
    ).toBe(true);
  });
});
