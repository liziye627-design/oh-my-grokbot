import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";
import { installationSchema } from "../src/contracts/installation.js";

const resultSchema = z.object({ status: z.string(), code: z.string(), context: z.unknown() });
let workspace: string;
beforeEach(async () => {
  workspace = await mkdtemp(join(tmpdir(), "ohmy-cli-中文-"));
});
afterEach(async () => {
  await rm(workspace, { recursive: true, force: true });
});
function invoke(args: readonly string[]) {
  const processResult = spawnSync(
    process.execPath,
    [resolve("dist/cli.js"), "--workspace", workspace, "--json", ...args],
    { encoding: "utf8", timeout: 15000 },
  );
  if (processResult.error) throw processResult.error;
  return {
    exitCode: processResult.status,
    result: resultSchema.parse(JSON.parse(processResult.stdout)),
  };
}

describe("Built CLI end to end", () => {
  it("round-trips a lockfile through apply, verify and rollback", async () => {
    const lock = join(workspace, "core.lock.json");
    expect(invoke(["plan", "oh-my-core", "--out", lock]).exitCode).toBe(0);
    const applied = invoke(["apply", lock, "--yes", "--allow-unverified"]);
    expect(applied.exitCode).toBe(2);
    const record = installationSchema.parse(applied.result.context);
    expect(invoke(["verify", record.id]).result.status).toBe("needs_human");
    const file = join(workspace, ".ohmy", "skills", "source-research", "SKILL.md");
    expect((await readFile(file)).length).toBeGreaterThan(0);
    expect(invoke(["rollback", record.id, "--yes"]).result.code).toBe("ROLLED_BACK");
  }, 60000);
  it("reports unsupported provider selection as a failure", () => {
    const result = invoke(["plan", "oh-my-core", "--provider", "muse"]);
    expect(result.exitCode).toBe(1);
    expect(result.result.code).toBe("PROVIDER_UNSUPPORTED");
  });
  it("reports external integration checks as pending rather than passed", () => {
    const result = invoke(["doctor"]);
    expect(result.exitCode).toBe(2);
    expect(result.result.status).toBe("needs_human");
  });
  it("refuses a default installation of development resources", () => {
    const result = invoke(["install", "oh-my-core", "--yes"]);
    expect(result.exitCode).toBe(1);
    expect(result.result.code).toBe("UNVERIFIED_RESOURCE");
  });
});
