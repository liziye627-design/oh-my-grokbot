import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import {
  type Installation,
  type InstallPlan,
  installationIdSchema,
} from "../contracts/installation.js";
import { CoreError } from "../errors.js";
import { exists, hash, safePath } from "../io.js";
import type { Catalog } from "../registry/catalog.js";
import { createPlan } from "./plan.js";
import { audit, installations, saveInstallation, stateRoot, withWorkspaceLock } from "./state.js";
import { verifyInstallation } from "./verify.js";

export type ApplyOptions = {
  readonly workspace: string;
  readonly consent: boolean;
  readonly allowUnverified: boolean;
  readonly dryRun: boolean;
};

export async function applyPlan(
  catalog: Catalog,
  plan: InstallPlan,
  options: ApplyOptions,
): Promise<Installation | InstallPlan> {
  const fresh = await createPlan(catalog, {
    name: plan.pack.metadata.name,
    range: plan.pack.metadata.version,
    provider: plan.provider,
  });
  const planDigest = hash(JSON.stringify(plan));
  if (planDigest !== hash(JSON.stringify(fresh)))
    throw new CoreError(
      "LOCK_STALE_OR_TAMPERED",
      "Lockfile differs from the current trusted catalog or bundled file hashes; regenerate the plan",
    );
  if (plan.checks.some((check) => check.status === "failed"))
    throw new CoreError("PLAN_BLOCKED", "Plan contains blocked resources");
  if (!options.allowUnverified && plan.checks.some((check) => check.code === "RESOURCE_UNVERIFIED"))
    throw new CoreError(
      "UNVERIFIED_RESOURCE",
      "Independent verification is pending; use --allow-unverified only for reviewed development resources",
    );
  if (options.dryRun) return plan;
  if (!options.consent)
    throw new CoreError(
      "CONSENT_REQUIRED",
      "Review the plan, then pass --yes to stage its local files",
    );
  return withWorkspaceLock(options.workspace, async () => {
    const records = await installations(options.workspace);
    const previous = records.find(
      (record) => record.planDigest === planDigest && record.state === "needs_human",
    );
    if (previous) {
      const checks = await verifyInstallation(options.workspace, previous);
      if (checks.some((check) => check.status === "failed"))
        throw new CoreError(
          "INSTALLATION_DRIFT",
          "Installed files changed; inspect and rollback explicitly before reinstalling",
        );
      return previous;
    }
    if (records.some((record) => record.state === "installing" || record.state === "failed"))
      throw new CoreError(
        "RECOVERY_REQUIRED",
        "An interrupted installation must be inspected and rolled back first",
      );
    const root = await stateRoot(options.workspace);
    const materialized = [];
    for (const file of plan.files) {
      const path = await safePath(root, file.target);
      const content =
        file.mode === "generated"
          ? Buffer.from(file.content)
          : await readFile(await safePath(catalog.root, file.source));
      if (hash(content) !== file.sha256)
        throw new CoreError("CONTENT_CHANGED", "Bundled content changed after planning");
      const present = await exists(path);
      if (present && hash(await readFile(path)) !== file.sha256)
        throw new CoreError("FILE_CONFLICT", `Refusing to overwrite existing file: ${file.target}`);
      materialized.push({ target: file.target, sha256: file.sha256, owned: !present, content });
    }
    let record: Installation = {
      id: installationIdSchema.parse(randomUUID()),
      pack: plan.pack.metadata.name,
      version: plan.pack.metadata.version,
      provider: plan.provider,
      planDigest,
      state: "installing",
      createdAt: new Date().toISOString(),
      files: materialized.map(({ target, sha256, owned }) => ({ target, sha256, owned })),
      plan,
    };
    await saveInstallation(options.workspace, record);
    await audit(options.workspace, {
      installationId: record.id,
      action: "install",
      code: "STARTED",
    });
    try {
      for (const file of materialized.filter((item) => item.owned)) {
        const path = await safePath(root, file.target);
        await mkdir(dirname(path), { recursive: true, mode: 0o700 });
        await writeFile(path, file.content, { flag: "wx", mode: 0o600 });
      }
      record = { ...record, state: "needs_human" };
      await saveInstallation(options.workspace, record);
      await audit(options.workspace, {
        installationId: record.id,
        action: "install",
        code: "LOCAL_STAGED_NATIVE_PENDING",
      });
      return record;
    } catch (error) {
      if (error instanceof Error) {
        await saveInstallation(options.workspace, { ...record, state: "failed" });
        await audit(options.workspace, {
          installationId: record.id,
          action: "install",
          code: "FAILED",
        });
      }
      throw error;
    }
  });
}
