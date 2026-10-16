import { readFile } from "node:fs/promises";
import type { Check } from "../contracts/common.js";
import type { Installation } from "../contracts/installation.js";
import { exists, hash, safePath } from "../io.js";
import { stateRoot } from "./state.js";

export async function verifyInstallation(
  workspace: string,
  record: Installation,
): Promise<readonly Check[]> {
  const root = await stateRoot(workspace);
  const checks: Check[] = [];
  if (record.state === "installing" || record.state === "failed")
    checks.push({
      name: record.id,
      status: "failed",
      code: "INTERRUPTED_INSTALLATION",
      message: "Inspect and rollback this interrupted installation",
    });
  if (record.state === "rolled_back")
    return [
      {
        name: record.id,
        status: "skipped",
        code: "ROLLED_BACK",
        message: "Installation has been rolled back",
      },
    ];
  for (const file of record.files) {
    const path = await safePath(root, file.target);
    const passed = (await exists(path)) && hash(await readFile(path)) === file.sha256;
    checks.push({
      name: file.target,
      status: passed ? "passed" : "failed",
      code: passed ? "FILE_VERIFIED" : "FILE_MISSING_OR_CHANGED",
      message: passed
        ? "Managed file matches its locked hash"
        : "Managed file is missing or differs from the installation",
    });
  }
  checks.push(...record.plan.checks);
  return checks;
}

export function checkStatus(checks: readonly Check[]): Check["status"] {
  if (checks.some((check) => check.status === "failed")) return "failed";
  if (checks.some((check) => check.status === "needs_human")) return "needs_human";
  if (checks.length && checks.every((check) => check.status === "skipped")) return "skipped";
  return "passed";
}
