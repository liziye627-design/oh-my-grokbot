import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { expect, it } from "vitest";
import { z } from "zod";
import { gatewayConfigSchema } from "../../src/gateway/config.js";
import { loadValidatedIndustryManifests } from "../../src/industry/catalog.js";
import { hash, readData } from "../../src/io.js";
import { prepareWorkspaceBundle } from "../../src/workspaces/bundle.js";

const config = await readData("examples/workspaces.config.json", gatewayConfigSchema);
const workspace = config.workspaces[0];
if (!workspace) throw new Error("Workspace fixture missing");
const manifests = await loadValidatedIndustryManifests("registry/catalog.json");
const manifest = manifests.find((item) => item.pack.metadata.name === workspace.pack);
if (!manifest) throw new Error("Industry fixture missing");
it("embeds exact role sources and parseable native configuration in an uploadable Markdown file", async () => {
  // Given the real compiled CLI and workspace config without actual credentials.
  const directory = await mkdtemp(join(tmpdir(), "ohmy-native-bundle-"));
  try {
    const output = join(directory, "bootstrap.md");
    // When writing a native bootstrap attachment through the real CLI.
    const child = spawnSync(
      process.execPath,
      [
        resolve("dist/cli.js"),
        "--json",
        "workspace",
        "bundle",
        "--config",
        resolve("examples/workspaces.config.json"),
        "--id",
        workspace.id,
        "--out",
        output,
      ],
      { encoding: "utf8", timeout: 20000 },
    );
    if (child.error) throw child.error;
    expect(child.status, child.stderr + child.stdout).toBe(2);
    const result = z
      .object({
        code: z.literal("WORKSPACE_BUNDLE_READY"),
        context: z.object({ sha256: z.string() }),
      })
      .parse(JSON.parse(child.stdout));
    const markdown = await readFile(output, "utf8");
    // Then source blocks are byte-equivalent to trusted local prompts, with ordinary Markdown fences.
    expect(hash(markdown)).toBe(result.context.sha256);
    for (const role of manifest.pack.spec.agents) {
      const path = `industries/${manifest.pack.metadata.name.replace(/^oh-my-/, "")}/prompts/${role.id}.md`;
      const start = `<!-- source:${path} -->\n`;
      const end = `\n<!-- end-source:${path} -->`;
      const content = markdown.split(start)[1]?.split(end)[0];
      expect(content).toBeDefined();
      if (content !== undefined) expect(hash(content)).toBe(hash(await readFile(path)));
    }
    const block = markdown.match(/```json\n([\s\S]*?)\n```/)?.[1];
    if (!block) throw new Error("Missing machine-readable configuration fence");
    const native = z
      .object({
        workspaceId: z.string(),
        group: z.object({ botCount: z.number() }),
        bots: z.array(z.unknown()),
      })
      .strict();
    const parsed: unknown = JSON.parse(block);
    expect(z.object({ workspaceId: z.literal(workspace.id) }).parse(parsed).workspaceId).toBe(
      workspace.id,
    );
    expect(
      z.object({ members: z.unknown(), channelBinding: z.unknown() }).safeParse(parsed).success,
    ).toBe(false);
    expect(
      native.omit({ workspaceId: true }).passthrough().parse(parsed).group.botCount,
    ).toBeGreaterThanOrEqual(2);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
it("rejects oversized local role prompts instead of embedding unbounded content", async () => {
  // Given an oversized first role prompt in an isolated source tree.
  const directory = await mkdtemp(join(tmpdir(), "ohmy-native-oversize-"));
  try {
    const role = manifest.pack.spec.agents[0];
    if (!role) throw new Error("Role missing");
    const path = join(
      directory,
      `industries/${manifest.pack.metadata.name.replace(/^oh-my-/, "")}/prompts`,
    );
    await mkdir(path, { recursive: true });
    await writeFile(join(path, `${role.id}.md`), "x".repeat(65537));
    // When bundling; Then the bounded file boundary rejects it.
    await expect(prepareWorkspaceBundle(directory, workspace, manifest)).rejects.toMatchObject({
      code: "WORKSPACE_PROMPT_SIZE",
    });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
