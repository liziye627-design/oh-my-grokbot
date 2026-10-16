import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { expect, it } from "vitest";
import { z } from "zod";

it("completes local protocol acceptance for every employee pack when compiled surfaces run", () => {
  // Given compiled CLI/Gateway modules and packaged industry manifests.
  // When a separate process drives real HTTP/MCP with synthetic fixture inputs.
  const child = spawnSync(process.execPath, [resolve("examples/industry-smoke.mjs")], {
    encoding: "utf8",
    timeout: 240000,
  });
  if (child.error) throw child.error;
  // Then every pack installs, rolls back, persists its workflow and reaches independent review.
  expect(child.status, child.stdout + child.stderr).toBe(0);
  const result = z
    .object({
      status: z.literal("passed"),
      realHTTP: z.literal(true),
      officialMCP: z.literal(true),
      localFixtureOnly: z.literal(true),
      liveNative: z.literal(false),
      liveFeishu: z.literal(false),
      localSinkDeliveries: z.literal(15),
      industries: z
        .array(
          z.object({
            pack: z.string(),
            installRollback: z.literal(true),
            missingInputsDenied: z.literal(true),
            durableWorkflowViaMCP: z.literal(true),
            protocolFixtureReviewed: z.literal(true),
            businessWorkPerformed: z.literal(false),
          }),
        )
        .length(15),
    })
    .parse(JSON.parse(child.stdout));
  expect(result.industries.map((industry) => industry.pack).sort()).toEqual([
    "oh-my-app-studio",
    "oh-my-business-operations",
    "oh-my-content-studio",
    "oh-my-core-team",
    "oh-my-engineering-lab",
    "oh-my-market-desk",
    "oh-my-office-team",
    "oh-my-research-lab",
    "oh-my-reverse-lab",
    "oh-my-sales-team",
    "oh-my-solo-company",
    "oh-my-specialist-lab",
    "oh-my-video-studio",
    "oh-my-wechat",
    "oh-my-x-growth",
  ]);
}, 240000);
