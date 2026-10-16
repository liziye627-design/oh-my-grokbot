import { gte } from "semver";
import type { Check, Provider } from "../contracts/common.js";
import { exists, safePath } from "../io.js";
import { installations, stateRoot } from "./state.js";
import { verifyInstallation } from "./verify.js";

export async function doctor(workspace: string, provider: Provider): Promise<readonly Check[]> {
  const root = await stateRoot(workspace);
  const checks: Check[] = [
    {
      name: "node",
      status: gte(process.versions.node, "22.14.0") ? "passed" : "failed",
      code: "NODE_RUNTIME",
      message: `Node ${process.versions.node}; supported runtime >=22.14`,
    },
    {
      name: "workspace-lock",
      status: (await exists(await safePath(root, "operation.lock"))) ? "needs_human" : "passed",
      code: "WORKSPACE_LOCK",
      message: "Inspect active/stale operation lock before any manual recovery",
    },
    {
      name: `${provider}:native`,
      status: "needs_human",
      code: "NATIVE_API_UNVERIFIED",
      message: "Confirm Bots, Skills, Routines and authentication in the native application",
    },
    {
      name: "feishu-ingress",
      status: "needs_human",
      code: "SPIKE_REQUIRED",
      message: "Feishu → designated Grok Bot triggering needs a real-account experiment",
    },
    {
      name: "mcp",
      status: "needs_human",
      code: "GATEWAY_ACCOUNT_GATE",
      message:
        "Result MCP is implemented; start Gateway and verify task-scoped native-host binding",
    },
    {
      name: "guardian",
      status: "skipped",
      code: "NEXT_LAYER",
      message: "Service supervision and task recovery belong to the Guardian layer",
    },
  ];
  const records = await installations(workspace);
  if (!records.length)
    checks.push({
      name: "installation",
      status: "needs_human",
      code: "NOT_INSTALLED",
      message: "No local installation record exists",
    });
  for (const record of records) {
    checks.push(...(await verifyInstallation(workspace, record)));
  }
  return checks;
}
