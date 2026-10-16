import { resolve } from "node:path";
import type { Command } from "commander";
import { z } from "zod";
import { CoreError } from "../errors.js";
import { loadIndustryCatalog, loadIndustryManifests } from "../industry/catalog.js";
import {
  industryInputsSchema,
  industryPlanInputSchema,
  prepareIndustryPlan,
} from "../industry/plan.js";
import { selectTeams } from "../industry/selection.js";
import { readData, writeJson } from "../io.js";
import { emit, options } from "./output.js";

export function registerIndustryCommands(program: Command): void {
  const industry = program
    .command("industry")
    .description("Industry employee teams and native workflow handoff plans");
  industry.command("list").action(async (_local: object, command: Command) => {
    const config = options(command);
    const catalog = await loadIndustryCatalog(config.registry);
    const manifests = await loadIndustryManifests(catalog.root);
    emit(
      {
        status: "passed",
        code: "INDUSTRIES_LISTED",
        message: "Industry packs; native execution requires account verification",
        context: {
          items: manifests.map((manifest) => ({
            id: manifest.pack.metadata.name,
            version: manifest.pack.metadata.version,
            roles: manifest.pack.spec.agents.map((role) => role.id),
            workflows: manifest.workflows.map((workflow) => ({
              id: workflow.id,
              requiredInputs: workflow.requiredInputs,
            })),
          })),
        },
        evidence_refs: [],
      },
      config.json,
    );
  });
  industry
    .command("choose [ids...]")
    .description("Record which teams the operator wants. This does not install them")
    .option("--out <file>", "Write the selection record")
    .action(async (ids: string[], _local: object, command: Command) => {
      const config = options(command);
      const requested = z.array(z.string()).parse(ids ?? []);
      const catalog = await loadIndustryCatalog(config.registry);
      const manifests = await loadIndustryManifests(catalog.root);
      const selection = selectTeams(
        manifests.map((manifest) => ({
          id: manifest.pack.metadata.name,
          description: manifest.pack.metadata.description,
          roles: manifest.pack.spec.agents.map((role) => role.id),
        })),
        requested,
      );
      if (config.out) await writeJson(resolve(config.out), selection);
      emit(
        {
          status: "passed",
          code: requested.length === 0 ? "TEAMS_AVAILABLE" : "TEAMS_SELECTED",
          message:
            requested.length === 0
              ? "No team selected; nothing will be installed"
              : "Selection recorded; run install separately for each chosen team",
          context: selection,
          evidence_refs: config.out ? [resolve(config.out)] : [],
        },
        config.json,
      );
    });
  industry.command("inspect <id>").action(async (id: string, _local: object, command: Command) => {
    const config = options(command);
    const catalog = await loadIndustryCatalog(config.registry);
    const manifest = (await loadIndustryManifests(catalog.root)).find(
      (item) => item.pack.metadata.name === id,
    );
    if (!manifest) throw new CoreError("INDUSTRY_NOT_FOUND", "Industry pack does not exist");
    emit(
      {
        status: "passed",
        code: "INDUSTRY_FOUND",
        message: id,
        context: manifest,
        evidence_refs: [],
      },
      config.json,
    );
  });
  industry
    .command("plan <id> <workflow>")
    .requiredOption("--objective <text>", "Task objective")
    .requiredOption("--inputs <file>", "JSON/YAML mapping of required input names to references")
    .option("--event-id <id>", "Explicit deduplication key; default is deterministic")
    .option("--deadline <iso>", "Task deadline in UTC")
    .option("--out <file>", "Write the reviewable team/workflow/task-request JSON")
    .action(async (id: string, workflow: string, _local: object, command: Command) => {
      const config = options(command);
      const args = z
        .object({
          objective: z.string(),
          inputs: z.string(),
          eventId: z.string().optional(),
          deadline: z.string().optional(),
        })
        .parse(command.opts());
      const catalog = await loadIndustryCatalog(config.registry);
      const manifest = (await loadIndustryManifests(catalog.root)).find(
        (item) => item.pack.metadata.name === id,
      );
      if (!manifest) throw new CoreError("INDUSTRY_NOT_FOUND", "Industry pack does not exist");
      const input = industryPlanInputSchema.parse({
        ...args,
        inputs: await readData(resolve(args.inputs), industryInputsSchema),
      });
      const plan = prepareIndustryPlan(manifest, workflow, input);
      if (config.out) await writeJson(resolve(config.out), plan);
      emit(
        {
          status: "passed",
          code: "INDUSTRY_PLAN_CREATED",
          message: "Native team handoff prepared; no task dispatched or external action performed",
          context: plan,
          evidence_refs: config.out ? [resolve(config.out)] : [],
        },
        config.json,
      );
    });
}
