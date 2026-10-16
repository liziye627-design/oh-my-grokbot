import { appendFile, type FileHandle, mkdir, open, readdir, unlink } from "node:fs/promises";
import { join } from "node:path";
import {
  type Installation,
  type InstallationId,
  installationSchema,
} from "../contracts/installation.js";
import { CoreError } from "../errors.js";
import { exists, readData, safePath, writeJson } from "../io.js";

export async function stateRoot(workspace: string): Promise<string> {
  return safePath(workspace, ".ohmy");
}

export async function installations(workspace: string): Promise<readonly Installation[]> {
  const root = await stateRoot(workspace);
  const folder = await safePath(root, "installations");
  if (!(await exists(folder))) return [];
  const records: Installation[] = [];
  for (const file of (await readdir(folder)).filter((name) => name.endsWith(".json")).sort()) {
    records.push(await readData(await safePath(root, `installations/${file}`), installationSchema));
  }
  return records;
}

export async function getInstallation(
  workspace: string,
  id: InstallationId,
): Promise<Installation> {
  return readData(
    await safePath(await stateRoot(workspace), `installations/${id}.json`),
    installationSchema,
  );
}

export async function saveInstallation(
  workspace: string,
  installation: Installation,
): Promise<void> {
  const file = await safePath(await stateRoot(workspace), `installations/${installation.id}.json`);
  await writeJson(file, installation);
}

export async function audit(
  workspace: string,
  event: {
    readonly installationId: InstallationId;
    readonly action: string;
    readonly code: string;
  },
): Promise<void> {
  const file = await safePath(await stateRoot(workspace), "audit.jsonl");
  await appendFile(file, `${JSON.stringify({ timestamp: new Date().toISOString(), ...event })}\n`, {
    mode: 0o600,
  });
}

export async function withWorkspaceLock<T>(
  workspace: string,
  action: () => Promise<T>,
): Promise<T> {
  const root = await stateRoot(workspace);
  await mkdir(root, { recursive: true, mode: 0o700 });
  const file = join(root, "operation.lock");
  let handle: FileHandle;
  try {
    handle = await open(file, "wx", 0o600);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "EEXIST")
      throw new CoreError(
        "WORKSPACE_LOCKED",
        "Another operation owns the workspace; inspect operation.lock before manual recovery",
      );
    throw error;
  }
  try {
    await handle.writeFile(
      JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }),
    );
    return await action();
  } finally {
    await handle.close();
    await unlink(file);
  }
}
