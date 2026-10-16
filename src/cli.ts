#!/usr/bin/env node
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Command, CommanderError } from "commander";
import { ZodError } from "zod";
import { inspectCatalog, packRequest, searchCatalog } from "./commands/catalog.js";
import { registerGatewayCommands } from "./commands/gateway.js";
import { registerIndustryCommands } from "./commands/industry.js";
import { emit, options } from "./commands/output.js";
import { registerSocialCommands } from "./commands/social.js";
import { registerWorkspaceCommands } from "./commands/workspace.js";
import { installationIdSchema, planSchema } from "./contracts/installation.js";
import { CoreError } from "./errors.js";
import { loadIndustryCatalog as loadCatalog } from "./industry/catalog.js";
import { applyPlan } from "./installer/apply.js";
import { doctor } from "./installer/doctor.js";
import { createPlan } from "./installer/plan.js";
import { rollback } from "./installer/rollback.js";
import { getInstallation, installations } from "./installer/state.js";
import { checkStatus, verifyInstallation } from "./installer/verify.js";
import { readData, writeJson } from "./io.js";

const program = new Command()
  .name("ohmy")
  .description("Oh My Core Installer · native agent distribution layer")
  .version("0.1.0-alpha.1")
  .option(
    "--registry <file>",
    "trusted local catalog JSON/YAML",
    fileURLToPath(new URL("../registry/catalog.json", import.meta.url)),
  )
  .option("--workspace <directory>", "workspace whose .ohmy directory is managed", process.cwd())
  .option("--provider <name>", "native provider: grokbot or muse", "grokbot")
  .option("--json", "machine-readable result; exit 0=passed, 1=failed, 2=needs_human")
  .exitOverride();

program
  .command("search [query]")
  .description("Discover resources and their review status")
  .option("--kind <kind>", "all, pack, skill, mcp, source, native, sdk, cli, adapter", "all")
  .action(async (query: string | undefined, _local: object, command: Command) => {
    const config = options(command);
    const items = searchCatalog(await loadCatalog(config.registry), query ?? "", config.kind);
    emit(
      {
        status: "passed",
        code: "SEARCH_COMPLETE",
        message: "Catalog results (reviewed is not Verified)",
        context: { items },
        evidence_refs: [],
      },
      config.json,
    );
  });
program
  .command("inspect <reference>")
  .description("Inspect source, permissions, license and delivery declaration")
  .action(async (reference: string, _local: object, command: Command) => {
    const config = options(command);
    emit(
      {
        status: "passed",
        code: "RESOURCE_FOUND",
        message: reference,
        context: inspectCatalog(await loadCatalog(config.registry), reference),
        evidence_refs: [],
      },
      config.json,
    );
  });
program
  .command("plan <pack>")
  .description("Resolve exact versions and hashes without installing")
  .option("--out <file>", "write a lockfile explicitly")
  .action(async (pack: string, _local: object, command: Command) => {
    const config = options(command);
    const plan = await createPlan(
      await loadCatalog(config.registry),
      packRequest(pack, config.provider),
    );
    if (config.out) await writeJson(resolve(config.out), plan);
    emit(
      {
        status: "passed",
        code: "PLAN_CREATED",
        message: "Installation plan created; native verification remains pending",
        context: plan,
        evidence_refs: config.out ? [resolve(config.out)] : [],
      },
      config.json,
    );
  });
for (const name of ["apply", "install"] as const) {
  program
    .command(name === "apply" ? "apply <lockfile>" : "install <pack>")
    .description(
      name === "apply"
        ? "Apply a lockfile from the trusted catalog"
        : "Plan and stage a local Core Pack",
    )
    .option("--yes", "consent to the displayed local filesystem changes")
    .option(
      "--allow-unverified",
      "allow reviewed development resources; never unreviewed resources",
    )
    .option("--dry-run", "validate without creating workspace state")
    .action(async (reference: string, _local: object, command: Command) => {
      const config = options(command);
      const catalog = await loadCatalog(config.registry);
      const plan =
        name === "apply"
          ? await readData(reference, planSchema)
          : await createPlan(catalog, packRequest(reference, config.provider));
      const result = await applyPlan(catalog, plan, {
        workspace: config.workspace,
        consent: config.yes,
        allowUnverified: config.allowUnverified,
        dryRun: config.dryRun,
      });
      emit(
        {
          status: config.dryRun ? "passed" : "needs_human",
          code: config.dryRun ? "DRY_RUN_COMPLETE" : "LOCAL_STAGED_NATIVE_PENDING",
          message: config.dryRun
            ? "Validated plan; no workspace files changed"
            : "Local files staged; complete the native guide and account-level smoke test",
          context: result,
          evidence_refs: "id" in result ? [`.ohmy/installations/${result.id}.json`] : [],
        },
        config.json,
      );
    });
}
program
  .command("doctor")
  .description("Check local integrity and report native integration gates")
  .action(async (_local: object, command: Command) => {
    const config = options(command);
    const checks = await doctor(config.workspace, config.provider);
    emit(
      {
        status: checkStatus(checks),
        code: "DOCTOR_COMPLETE",
        message: "Environment diagnostics",
        context: { checks },
        evidence_refs: [],
      },
      config.json,
    );
  });
program
  .command("status")
  .description("List journaled installations")
  .action(async (_local: object, command: Command) => {
    const config = options(command);
    const records = await installations(config.workspace);
    emit(
      {
        status: "passed",
        code: "STATUS_COMPLETE",
        message: "Local installation state",
        context: {
          installations: records.map(({ id, pack, version, state, createdAt }) => ({
            id,
            pack,
            version,
            state,
            createdAt,
          })),
        },
        evidence_refs: [],
      },
      config.json,
    );
  });
program
  .command("verify <installation-id>")
  .description("Check installed hashes; native execution is a separate gate")
  .action(async (id: string, _local: object, command: Command) => {
    const config = options(command);
    const record = await getInstallation(config.workspace, installationIdSchema.parse(id));
    const checks = await verifyInstallation(config.workspace, record);
    emit(
      {
        status: checkStatus(checks),
        code: "VERIFICATION_COMPLETE",
        message: "Installation checks",
        context: { checks },
        evidence_refs: [`.ohmy/installations/${record.id}.json`],
      },
      config.json,
    );
  });
program
  .command("rollback <installation-id>")
  .description("Remove only unchanged files owned by this installation")
  .option("--yes", "consent to removing the owned files")
  .action(async (id: string, _local: object, command: Command) => {
    const config = options(command);
    if (!config.yes)
      throw new CoreError(
        "CONSENT_REQUIRED",
        "Pass --yes to rollback this installation's unchanged files",
      );
    const record = await rollback(config.workspace, installationIdSchema.parse(id));
    emit(
      {
        status: "passed",
        code: "ROLLED_BACK",
        message: "Owned files removed; native and external resources are unchanged",
        context: { id: record.id, state: record.state },
        evidence_refs: [`.ohmy/installations/${record.id}.json`],
      },
      config.json,
    );
  });

registerSocialCommands(program);
registerGatewayCommands(program);
registerIndustryCommands(program);
registerWorkspaceCommands(program);

try {
  await program.parseAsync();
} catch (error) {
  if (error instanceof CommanderError && error.exitCode === 0) process.exitCode = 0;
  else {
    const code =
      error instanceof CoreError
        ? error.code
        : error instanceof ZodError
          ? "INPUT_INVALID"
          : error instanceof CommanderError
            ? error.code
            : "IO_ERROR";
    const message =
      error instanceof CoreError
        ? error.message
        : "Command failed; check input, local paths and permissions. Raw payloads and credentials are not printed.";
    emit(
      { status: "failed", code, message, context: {}, evidence_refs: [] },
      process.argv.includes("--json"),
    );
  }
}
