import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { Command } from "commander";
import { z } from "zod";
import { CoreError } from "../errors.js";
import { gatewayConfigSchema } from "../gateway/config.js";
import { loadValidatedIndustryManifests } from "../industry/catalog.js";
import { readData, writeJson } from "../io.js";
import { prepareWorkspaceBundle } from "../workspaces/bundle.js";
import { prepareWorkspacePlan } from "../workspaces/plan.js";
import { validateWorkspaces } from "../workspaces/validation.js";
import { emit, options } from "./output.js";

export function registerWorkspaceCommands(program: Command): void {
  const workspaceCommand = program
    .command("workspace")
    .description("Native Bot collaboration group configuration");
  workspaceCommand
    .command("plan")
    .requiredOption("--config <file>", "Gateway JSON/YAML config with workspace membership")
    .requiredOption("--id <id>", "Workspace identifier")
    .option("--out <file>", "Write a reviewable native group setup plan")
    .action(async (_local: object, command: Command) => {
      const config = options(command);
      const input = z.object({ config: z.string(), id: z.string() }).parse(command.opts());
      const gateway = await readData(resolve(input.config), gatewayConfigSchema);
      const manifests = await loadValidatedIndustryManifests(config.registry);
      validateWorkspaces(gateway.workspaces, gateway.principals, manifests);
      const workspace = gateway.workspaces.find((item) => item.id === input.id);
      if (!workspace)
        throw new CoreError("WORKSPACE_NOT_FOUND", "Workspace identifier is not configured");
      const manifest = manifests.find((item) => item.pack.metadata.name === workspace.pack);
      if (!manifest)
        throw new CoreError("WORKSPACE_PACK_MISSING", "Workspace industry pack is unavailable");
      const plan = prepareWorkspacePlan(workspace, manifest);
      if (config.out) await writeJson(resolve(config.out), plan);
      emit(
        {
          status: "needs_human",
          code: "WORKSPACE_NATIVE_SETUP_REQUIRED",
          message:
            "Native group plan prepared; account configuration and activation checks remain pending",
          context: plan,
          evidence_refs: config.out ? [resolve(config.out)] : [],
        },
        config.json,
      );
    });
  workspaceCommand
    .command("bundle")
    .requiredOption("--config <file>", "Gateway configuration containing workspace definitions")
    .requiredOption("--id <id>", "Workspace identifier")
    .requiredOption("--out <file>", "New Markdown attachment for native Bot bootstrap")
    .action(async (_local: object, command: Command) => {
      const config = options(command);
      const input = z
        .object({ config: z.string(), id: z.string(), out: z.string() })
        .parse(command.opts());
      const gateway = await readData(resolve(input.config), gatewayConfigSchema);
      const manifests = await loadValidatedIndustryManifests(config.registry);
      validateWorkspaces(gateway.workspaces, gateway.principals, manifests);
      const workspace = gateway.workspaces.find((item) => item.id === input.id);
      if (!workspace)
        throw new CoreError("WORKSPACE_NOT_FOUND", "Workspace identifier is not configured");
      const manifest = manifests.find((item) => item.pack.metadata.name === workspace.pack);
      if (!manifest)
        throw new CoreError("WORKSPACE_PACK_MISSING", "Workspace industry pack is unavailable");
      const bundle = await prepareWorkspaceBundle(
        resolve(dirname(config.registry), ".."),
        workspace,
        manifest,
      );
      const output = resolve(input.out);
      await mkdir(dirname(output), { recursive: true, mode: 0o700 });
      await writeFile(output, bundle.markdown, { encoding: "utf8", flag: "wx", mode: 0o600 });
      emit(
        {
          status: "needs_human",
          code: "WORKSPACE_BUNDLE_READY",
          message:
            "Native bootstrap attachment created; actual Bot and group tool receipts required",
          context: {
            workspaceId: bundle.workspaceId,
            sha256: bundle.sha256,
            sources: bundle.sources,
            output,
          },
          evidence_refs: [output],
        },
        config.json,
      );
    });
}
