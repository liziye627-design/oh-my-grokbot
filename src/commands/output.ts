import type { Command } from "commander";
import { z } from "zod";
import { type Check, providerSchema } from "../contracts/common.js";

const optionsSchema = z.object({
  registry: z.string(),
  workspace: z.string(),
  provider: providerSchema,
  json: z.boolean().default(false),
  yes: z.boolean().default(false),
  allowUnverified: z.boolean().default(false),
  dryRun: z.boolean().default(false),
  out: z.string().optional(),
  kind: z
    .enum(["all", "pack", "skill", "mcp", "source", "native", "sdk", "cli", "adapter"])
    .default("all"),
});
export type Options = z.infer<typeof optionsSchema>;
export function options(command: Command): Options {
  return optionsSchema.parse(command.optsWithGlobals());
}

export type Result = {
  readonly status: Check["status"];
  readonly code: string;
  readonly message: string;
  readonly context: object;
  readonly evidence_refs: readonly string[];
};
export function emit(result: Result, json: boolean): void {
  process.stdout.write(
    json
      ? `${JSON.stringify(result)}\n`
      : `[${result.status}] ${result.message}\n${JSON.stringify(result.context, null, 2)}\n`,
  );
  process.exitCode = result.status === "failed" ? 1 : result.status === "needs_human" ? 2 : 0;
}
