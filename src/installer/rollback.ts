import { readFile, unlink } from "node:fs/promises";
import type { Installation, InstallationId } from "../contracts/installation.js";
import { CoreError } from "../errors.js";
import { exists, hash, safePath } from "../io.js";
import {
  audit,
  getInstallation,
  installations,
  saveInstallation,
  stateRoot,
  withWorkspaceLock,
} from "./state.js";

export async function rollback(workspace: string, id: InstallationId): Promise<Installation> {
  return withWorkspaceLock(workspace, async () => {
    const record = await getInstallation(workspace, id);
    if (record.state === "rolled_back") return record;
    const root = await stateRoot(workspace);
    const others = (await installations(workspace)).filter(
      (item) => item.id !== id && item.state !== "rolled_back",
    );
    const files: string[] = [];
    for (const file of record.files.filter((item) => item.owned)) {
      if (others.some((item) => item.files.some((shared) => shared.target === file.target)))
        throw new CoreError(
          "FILE_IN_USE",
          "Another active installation references this file; rollback dependants first",
        );
      const path = await safePath(root, file.target);
      if (!(await exists(path))) continue;
      if (hash(await readFile(path)) !== file.sha256)
        throw new CoreError(
          "ROLLBACK_CONFLICT",
          `Managed file changed; preserving user changes: ${file.target}`,
        );
      files.push(path);
    }
    for (const file of files) await unlink(file);
    const updated: Installation = { ...record, state: "rolled_back" };
    await saveInstallation(workspace, updated);
    await audit(workspace, { installationId: id, action: "rollback", code: "ROLLED_BACK" });
    return updated;
  });
}
