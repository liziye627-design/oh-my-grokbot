import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { CoreError } from "../errors.js";
import {
  approvalInputSchema,
  artifactInputSchema,
  completionSchema,
  failureSchema,
  type Identity,
  progressSchema,
  scopeSchema,
} from "./contracts.js";
import type { Gateway } from "./service.js";
import { requireRole } from "./tasks.js";

async function result(action: () => unknown | Promise<unknown>): Promise<CallToolResult> {
  try {
    const value = await action();
    return { content: [{ type: "text", text: JSON.stringify(value) }] };
  } catch (error) {
    if (!(error instanceof Error)) throw error;
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: JSON.stringify({
            code: error instanceof CoreError ? error.code : "RESULT_FAILED",
            message:
              error instanceof CoreError ? error.message : "Operation failed; raw data withheld",
          }),
        },
      ],
    };
  }
}
export function createResultMcp(gateway: Gateway, identity: Identity): McpServer {
  requireRole(identity, ["runner"]);
  const server = new McpServer({ name: "oh-my-result", version: "0.2.0-alpha.1" });
  server.registerTool(
    "get_task",
    {
      description: "Read requirements and evidence only for this credential's task/run",
      inputSchema: scopeSchema,
    },
    async ({ taskId, runId }) =>
      result(() => ({
        task: gateway.tasks.runner(identity, taskId, runId).task,
        artifacts: gateway.artifacts.list(identity, taskId),
        approvals: gateway.approvals.list(identity, taskId),
      })),
  );
  server.registerTool(
    "report_progress",
    { description: "Persist a bounded progress report", inputSchema: progressSchema },
    async ({ taskId, runId, message }) =>
      result(() => gateway.progress(identity, taskId, runId, message)),
  );
  server.registerTool(
    "submit_artifact",
    {
      description: "Upload UTF-8 content with a SHA-256 hash to this task's artifact store",
      inputSchema: artifactInputSchema,
    },
    async (input) => result(() => gateway.artifacts.submit(identity, input)),
  );
  server.registerTool(
    "request_approval",
    {
      description: "Request approval for an exact proposal; does not execute a write",
      inputSchema: approvalInputSchema,
    },
    async (input) => result(() => gateway.approvals.request(identity, input)),
  );
  server.registerTool(
    "complete_task",
    {
      description: "Submit completion for independent review; cannot mark success",
      inputSchema: completionSchema,
    },
    async (input) => result(() => gateway.lifecycle.complete(identity, input).task),
  );
  server.registerTool(
    "report_failure",
    { description: "Record a failure without automatic retry", inputSchema: failureSchema },
    async (input) => result(() => gateway.lifecycle.fail(identity, input).task),
  );
  return server;
}
export async function handleResultMcp(
  gateway: Gateway,
  identity: Identity,
  request: Request,
): Promise<Response> {
  const server = createResultMcp(gateway, identity);
  const transport = new WebStandardStreamableHTTPServerTransport({
    enableJsonResponse: true,
    maxRequestBodySize: 1_100_000,
  });
  await server.connect(transport);
  try {
    return await transport.handleRequest(request);
  } finally {
    await server.close();
  }
}
