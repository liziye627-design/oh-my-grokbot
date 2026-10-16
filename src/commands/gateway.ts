import { resolve } from "node:path";
import type { Command } from "commander";
import { z } from "zod";
import { gatewayConfigSchema } from "../gateway/config.js";
import { readData } from "../io.js";
import { emit, options } from "./output.js";

export function registerGatewayCommands(program: Command): void {
  program
    .command("gateway")
    .description("Native Integration Gateway and authenticated Result MCP")
    .command("serve")
    .requiredOption("--config <file>", "JSON/YAML config containing credential references only")
    .action(async (_local: object, command: Command) => {
      const config = options(command);
      const input = z.object({ config: z.string() }).parse(command.opts());
      const { startGateway } = await import("../gateway/server.js");
      const service = await startGateway(
        resolve(config.workspace),
        await readData(resolve(input.config), gatewayConfigSchema),
        process.env,
        (event) => process.stderr.write(`${JSON.stringify(event)}\n`),
      );
      const address = service.server.address();
      emit(
        {
          status: "passed",
          code: "GATEWAY_LISTENING",
          message: "Local Gateway ready; native triggering/account verification pending",
          context: { address, mcp: "/mcp", nativeTrigger: "manual_unverified" },
          evidence_refs: [],
        },
        config.json,
      );
      await new Promise<void>((resolve, reject) => {
        let closing = false;
        const stop = () => {
          if (closing) return;
          closing = true;
          process.off("SIGINT", stop);
          process.off("SIGTERM", stop);
          service.close().then(resolve, reject);
        };
        process.once("SIGINT", stop);
        process.once("SIGTERM", stop);
      });
    });
}
