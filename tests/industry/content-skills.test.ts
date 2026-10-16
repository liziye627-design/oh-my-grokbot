import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "vitest";
import { loadIndustryCatalog } from "../../src/industry/catalog.js";
import { applyPlan } from "../../src/installer/apply.js";
import { createPlan } from "../../src/installer/plan.js";

it("stages executable content skills and preserved licenses in a clean workspace", async () => {
  // Given the real content pack, with runtime resources rather than reference links.
  const catalog = await loadIndustryCatalog("registry/catalog.json");
  const plan = await createPlan(catalog, {
    name: "oh-my-content-studio",
    range: "*",
    provider: "grokbot",
  });
  const entries = [
    ["baoyu-url-to-markdown", "vendor/scripts/lib/cli.ts"],
    ["baoyu-markdown-to-html", "vendor/scripts/main.ts"],
    ["baoyu-post-to-wechat", "vendor/scripts/wechat-api.ts"],
  ] as const;
  for (const [id, entry] of entries) {
    expect(plan.files.some((file) => file.target === `skills/${id}/${entry}`)).toBe(true);
    expect(plan.files.some((file) => file.target === `skills/${id}/vendor/scripts/bun.lock`)).toBe(
      true,
    );
  }
  const workspace = await mkdtemp(join(tmpdir(), "ohmy-content-install-"));
  try {
    // When the user installs into an empty workspace.
    const result = await applyPlan(catalog, plan, {
      workspace,
      consent: true,
      allowUnverified: true,
      dryRun: false,
    });
    // Then local entry points are usable resources; native execution stays pending.
    expect(result).toMatchObject({ state: "needs_human" });
    for (const [id, entry] of entries) {
      expect(await readFile(join(workspace, `.ohmy/skills/${id}/${entry}`))).toEqual(
        await readFile(`skills/${id}/${entry}`),
      );
      expect(
        await readFile(join(workspace, `.ohmy/skills/${id}/licenses/baoyu-skills.txt`)),
      ).toEqual(await readFile("third_party/upstreams/baoyu-skills/LICENSE"));
    }
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
}, 30000);
