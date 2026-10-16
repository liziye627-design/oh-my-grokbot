import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { expect, it } from "vitest";
import { z } from "zod";

it("shares group work while isolating outsiders when real HTTP and MCP surfaces are used", () => {
  // Given two isolated groups and two human operators plus an independent reviewer in group A.
  // When an isolated process exercises compiled Gateway APIs and the official MCP client.
  const child = spawnSync(process.execPath, [resolve("examples/workspace-smoke.mjs")], {
    encoding: "utf8",
    timeout: 60000,
  });
  if (child.error) throw child.error;
  // Then shared work, identity mapping, independent review and once-only local delivery all hold.
  expect(child.status, child.stdout + child.stderr).toBe(0);
  z.object({
    status: z.literal("passed"),
    realHTTP: z.literal(true),
    officialMCP: z.literal(true),
    sharedOperators: z.literal(2),
    isolatedWorkspaces: z.literal(2),
    filteredListing: z.literal(true),
    sharedTaskClaim: z.literal(true),
    durableWorkspaceBindings: z.literal(true),
    outsiderDenied: z.literal(true),
    mappedChannelOrigin: z.literal(true),
    unmappedSenderDenied: z.literal(true),
    runnerSelfReviewDenied: z.literal(true),
    independentReview: z.literal(true),
    localSinkReceipts: z.literal(1),
    localFixtureOnly: z.literal(true),
    nativeGroupVerified: z.literal(false),
    liveFeishu: z.literal(false),
    businessWorkPerformed: z.literal(false),
  }).parse(JSON.parse(child.stdout));
}, 65000);

it("prepares a native group roster when the compiled workspace plan command is invoked", () => {
  // Given the supplied four-workspace example configuration.
  // When a local handoff plan is requested without platform credentials.
  const child = spawnSync(
    process.execPath,
    [
      resolve("dist/cli.js"),
      "--json",
      "workspace",
      "plan",
      "--config",
      resolve("examples/workspaces.config.json"),
      "--id",
      "app-studio",
    ],
    { encoding: "utf8", timeout: 20000 },
  );
  if (child.error) throw child.error;
  // Then manual account setup remains explicit while machine-readable role bindings are present.
  expect(child.status, child.stdout + child.stderr).toBe(2);
  const result = z
    .object({
      status: z.literal("needs_human"),
      code: z.literal("WORKSPACE_NATIVE_SETUP_REQUIRED"),
      context: z.object({
        dispatch: z.literal("manual_native"),
        workspaceId: z.literal("app-studio"),
        group: z.object({ botCount: z.number().min(2).max(6), coordinatorBot: z.string().min(1) }),
        bots: z
          .array(
            z.object({ botName: z.string(), roles: z.array(z.object({ id: z.string() })).min(1) }),
          )
          .min(2)
          .max(6),
        kickoffMessage: z.string().min(1),
      }),
    })
    .parse(JSON.parse(child.stdout));
  expect(result.context.bots.map((bot) => bot.botName)).toContain(
    result.context.group.coordinatorBot,
  );
  expect(result.context.bots).toHaveLength(result.context.group.botCount);
});
