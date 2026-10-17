import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { expect, it } from "vitest";
import { z } from "zod";
import { createTaskSchema } from "../../src/gateway/contracts.js";
import { loadIndustryManifests } from "../../src/industry/catalog.js";

const envelope = z.object({ code: z.string(), context: z.unknown() });
function invoke(args: readonly string[]) {
  const child = spawnSync(
    process.execPath,
    [resolve("dist/cli.js"), "--json", "industry", ...args],
    { encoding: "utf8", timeout: 20000 },
  );
  if (child.error) throw child.error;
  return { status: child.status, result: envelope.parse(JSON.parse(child.stdout)) };
}
it("exports an executable Gateway request when a real industry workflow is planned", async () => {
  // Given every local industry manifest and valid required inputs.
  const manifests = await loadIndustryManifests(process.cwd());
  const directory = await mkdtemp(join(tmpdir(), "ohmy-industry-cli-"));
  try {
    for (const manifest of manifests) {
      const workflow = manifest.workflows[0];
      if (!workflow) throw new Error("Expected workflow");
      const inputs = join(directory, "inputs.json");
      const output = join(directory, "plan.json");
      await writeFile(
        inputs,
        JSON.stringify(
          Object.fromEntries(workflow.requiredInputs.map((key) => [key, `fixture:${key}`])),
        ),
      );
      // When invoking the built CLI rather than its handler.
      const result = invoke([
        "plan",
        manifest.pack.metadata.name,
        workflow.id,
        "--objective",
        "Prepare reviewable output",
        "--inputs",
        inputs,
        "--out",
        output,
      ]);
      // Then output is durable and the real Gateway boundary accepts the request.
      expect(result.status).toBe(0);
      const plan = z
        .object({ taskRequest: createTaskSchema })
        .parse(JSON.parse(await readFile(output, "utf8")));
      expect(plan.taskRequest.assignedRole).toBe(workflow.entryRole);
      const handoff = z
        .object({
          workflow: z.object({ id: z.string(), steps: z.array(z.unknown()) }),
          team: z.array(z.unknown()),
        })
        .parse(JSON.parse(plan.taskRequest.objective));
      expect(handoff.workflow.id).toBe(workflow.id);
      expect(handoff.workflow.steps).toHaveLength(workflow.steps.length);
      expect(handoff.team).toHaveLength(manifest.pack.spec.agents.length);
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}, 120000);
it("refuses missing workflow input when no references are supplied", async () => {
  // Given an empty input file.
  const directory = await mkdtemp(join(tmpdir(), "ohmy-industry-invalid-"));
  try {
    const inputs = join(directory, "inputs.json");
    await writeFile(inputs, "{}");
    // When planning a real required-input workflow.
    const result = invoke([
      "plan",
      "oh-my-app-studio",
      "build-feature",
      "--objective",
      "Build",
      "--inputs",
      inputs,
    ]);
    // Then no runnable handoff is returned.
    expect(result.status).toBe(1);
    expect(result.result.code).toBe("INDUSTRY_INPUT_MISSING");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
