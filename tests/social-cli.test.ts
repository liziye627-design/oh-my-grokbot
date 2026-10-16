import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { z } from "zod";

const resultSchema = z.object({ code: z.string(), status: z.string(), context: z.unknown() });
function invoke(args: readonly string[]) {
  const child = spawnSync(process.execPath, [resolve("dist/cli.js"), "--json", "social", ...args], {
    encoding: "utf8",
    timeout: 15000,
    env: {
      ...process.env,
      OHMY_X_BEARER_TOKEN: "",
      OHMY_MASTODON_ACCESS_TOKEN: "",
      OHMY_YOUTUBE_API_KEY: "",
    },
  });
  if (child.error) throw child.error;
  return { exitCode: child.status, result: resultSchema.parse(JSON.parse(child.stdout)) };
}
describe("Built social CLI", () => {
  it("lists four read adapters and five reference-only platform entries", () => {
    const result = invoke(["list"]);
    const context = z
      .object({ connectors: z.array(z.object({ stage: z.string() })) })
      .parse(result.result.context);
    expect(result.exitCode).toBe(0);
    expect(context.connectors.filter((item) => item.stage === "read_adapter")).toHaveLength(4);
    expect(context.connectors.filter((item) => item.stage === "reference_only")).toHaveLength(5);
  });
  it("plans X reads without credentials and reports a real credential gate separately", () => {
    const dry = invoke(["search", "x", "grok", "--limit", "1", "--dry-run"]);
    expect(dry.exitCode).toBe(0);
    expect(dry.result.context).toMatchObject({
      upstreamLimit: 10,
      maxRequests: 1,
      writesEnabled: false,
    });
    const actual = invoke(["search", "x", "grok"]);
    expect(actual.exitCode).toBe(2);
    expect(actual.result.code).toBe("CONNECTOR_CREDENTIAL_REQUIRED");
  });
  it("rejects unsupported platforms and invalid budgets before dispatch", () => {
    for (const args of [
      ["search", "threads", "grok"],
      ["search", "bluesky", "grok", "--limit", "0"],
    ]) {
      expect(invoke(args).result.code).toBe("INPUT_INVALID");
    }
  });
});
