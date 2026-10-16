import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { z } from "zod";
import { exists, hash, safePath } from "../io.js";
import {
  type Artifact,
  type artifactInputSchema,
  artifactSchema,
  type Identity,
} from "./contracts.js";
import { jsonColumn } from "./database.js";
import { GatewayError } from "./errors.js";
import type { Tasks } from "./tasks.js";

export class Artifacts {
  constructor(
    readonly tasks: Tasks,
    readonly root: string,
  ) {}
  list(identity: Identity, taskId: string): readonly Artifact[] {
    this.tasks.get(identity, taskId);
    return this.tasks.ledger
      .all(
        "SELECT data FROM artifacts WHERE tenant=? AND task=? ORDER BY name",
        identity.tenantId,
        taskId,
      )
      .map((row) => artifactSchema.parse(jsonColumn(row)));
  }
  async submit(identity: Identity, input: z.infer<typeof artifactInputSchema>): Promise<Artifact> {
    const task = this.tasks.runner(identity, input.taskId, input.runId);
    if (task.task.state !== "running")
      throw new GatewayError("STATE_CONFLICT", "Artifacts may only be submitted while running");
    const bytes = Buffer.from(input.content, "utf8");
    if (bytes.length > 1_048_576)
      throw new GatewayError("ARTIFACT_SIZE", "Artifact exceeds one MiB", 413);
    if (hash(bytes) !== input.sha256)
      throw new GatewayError("ARTIFACT_HASH", "Artifact bytes do not match the declared hash", 400);
    const path = `${input.taskId}/${input.runId}/${input.name}`;
    const target = await safePath(this.root, path);
    await mkdir(dirname(target), { recursive: true, mode: 0o700 });
    if (await exists(target)) {
      if (hash(await readFile(target)) !== input.sha256)
        throw new GatewayError(
          "ARTIFACT_CONFLICT",
          "An artifact with this name already has different bytes",
        );
    } else await writeFile(target, bytes, { flag: "wx", mode: 0o600 });
    return this.tasks.ledger.transaction(() => {
      const current = this.tasks.runner(identity, input.taskId, input.runId);
      if (current.task.state !== "running")
        throw new GatewayError("STATE_CONFLICT", "Task state changed during upload");
      const existing = this.tasks.ledger.get(
        "SELECT data FROM artifacts WHERE tenant=? AND task=? AND name=?",
        identity.tenantId,
        input.taskId,
        input.name,
      );
      if (existing) {
        const record = artifactSchema.parse(jsonColumn(existing));
        if (record.sha256 !== input.sha256)
          throw new GatewayError("ARTIFACT_CONFLICT", "Artifact name is already used");
        return record;
      }
      const record = artifactSchema.parse({
        id: randomUUID(),
        taskId: input.taskId,
        runId: input.runId,
        tenantId: identity.tenantId,
        name: input.name,
        path,
        sha256: input.sha256,
        submittedBy: identity.id,
        status: "submitted",
        verifiedAt: null,
      });
      this.tasks.ledger.run(
        "INSERT INTO artifacts(id,tenant,task,name,data) VALUES(?,?,?,?,?)",
        record.id,
        identity.tenantId,
        input.taskId,
        input.name,
        JSON.stringify(record),
      );
      this.tasks.ledger.audit(
        identity.tenantId,
        input.taskId,
        identity.id,
        "artifact.submitted",
        this.tasks.now(),
      );
      return record;
    });
  }
  async read(identity: Identity, taskId: string, id: string) {
    const artifact = this.list(identity, taskId).find((item) => item.id === id);
    if (!artifact) throw new GatewayError("NOT_FOUND", "Artifact is unavailable in this task", 404);
    return { artifact, content: (await this.readVerified(artifact)).toString("utf8") };
  }
  async check(artifacts: readonly Artifact[]): Promise<void> {
    for (const artifact of artifacts) await this.readVerified(artifact);
  }
  private async readVerified(artifact: Artifact): Promise<Buffer> {
    const bytes = await readFile(await safePath(this.root, artifact.path));
    if (hash(bytes) !== artifact.sha256)
      throw new GatewayError("ARTIFACT_DRIFT", "Artifact content changed after submission");
    return bytes;
  }
  mark(artifacts: readonly Artifact[], verdict: "accepted" | "rejected"): void {
    for (const item of artifacts) {
      const next = artifactSchema.parse({
        ...item,
        status: verdict === "accepted" ? "verified" : "rejected",
        verifiedAt: verdict === "accepted" ? new Date(this.tasks.now()).toISOString() : null,
      });
      this.tasks.ledger.run(
        "UPDATE artifacts SET data=? WHERE id=? AND tenant=?",
        JSON.stringify(next),
        item.id,
        item.tenantId,
      );
    }
  }
}
