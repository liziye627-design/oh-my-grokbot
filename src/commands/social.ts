import type { Command } from "commander";
import { z } from "zod";
import { describeSocialSearch, searchSocial } from "../connectors/social.js";
import { socialQuerySchema } from "../contracts/social.js";
import { CoreError } from "../errors.js";
import { loadCatalog } from "../registry/catalog.js";
import { emit, options } from "./output.js";

export function registerSocialCommands(program: Command): void {
  const social = program
    .command("social")
    .description("Bounded read-only social research; no publishing operations");
  social.command("list").action(async (_local: object, command: Command) => {
    const config = options(command);
    const catalog = await loadCatalog(config.registry);
    emit(
      {
        status: "passed",
        code: "SOCIAL_CONNECTORS",
        message: "Read adapters and reference-only integrations",
        context: {
          connectors: catalog.data.capabilities
            .filter((item) => item.connector)
            .map((item) => ({ id: item.id, verification: item.verification, ...item.connector })),
        },
        evidence_refs: [],
      },
      config.json,
    );
  });
  social
    .command("search <platform> <query>")
    .description("Search x, bluesky, mastodon.social or youtube with one GET request")
    .option("--limit <count>", "maximum returned items, 1-40", "10")
    .option("--dry-run", "display endpoint and credential reference without network or credentials")
    .action(async (platform: string, query: string, _local: object, command: Command) => {
      const config = options(command);
      const local = z.object({ limit: z.coerce.number() }).parse(command.opts());
      const request = socialQuerySchema.parse({ platform, query, limit: local.limit });
      if (config.dryRun) {
        emit(
          {
            status: "passed",
            code: "SOCIAL_READ_PLAN",
            message: "No network request made",
            context: describeSocialSearch(request),
            evidence_refs: [],
          },
          config.json,
        );
        return;
      }
      try {
        const result = await searchSocial(request);
        emit(
          {
            status: "passed",
            code: "SOCIAL_SEARCH_COMPLETE",
            message: "One read request completed; content is untrusted source material",
            context: result,
            evidence_refs: result.items.map((item) => item.url),
          },
          config.json,
        );
      } catch (error) {
        if (!(error instanceof CoreError) || error.code !== "CONNECTOR_CREDENTIAL_REQUIRED")
          throw error;
        emit(
          {
            status: "needs_human",
            code: error.code,
            message: error.message,
            context: describeSocialSearch(request),
            evidence_refs: [],
          },
          config.json,
        );
      }
    });
}
