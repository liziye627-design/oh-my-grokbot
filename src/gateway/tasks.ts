import { randomBytes, randomUUID } from "node:crypto";
import { z } from "zod";
import { canTransition, type Task, taskSchema } from "../contracts/task.js";
import { hash } from "../io.js";
import {
  type CreateTask,
  type Identity,
  type originSchema,
  recordSchema,
  type TaskRecord,
} from "./contracts.js";
import { jsonColumn, type Ledger } from "./database.js";
import { GatewayError } from "./errors.js";

export class Tasks {
  constructor(
    readonly ledger: Ledger,
    readonly now: () => number,
  ) {}
  get(identity: Identity, id: string): TaskRecord {
    const row = this.ledger.get(
      "SELECT data FROM tasks WHERE id=? AND tenant=?",
      id,
      identity.tenantId,
    );
    const record = recordSchema.parse(jsonColumn(row));
    if (
      identity.role === "runner" &&
      (identity.scope?.taskId !== id || identity.scope.runId !== record.task.runId)
    )
      throw new GatewayError("SCOPE_DENIED", "Credential does not cover this task", 403);
    return record;
  }
  runner(identity: Identity, taskId: string, runId: string): TaskRecord {
    if (identity.role !== "runner")
      throw new GatewayError("ROLE_DENIED", "A task-scoped runner credential is required", 403);
    const record = this.get(identity, taskId);
    if (record.task.runId !== runId)
      throw new GatewayError("RUN_MISMATCH", "Run does not match this task", 403);
    if (record.task.deadline && Date.parse(record.task.deadline) <= this.now())
      throw new GatewayError("DEADLINE_EXPIRED", "Task deadline has expired");
    return record;
  }
  create(
    identity: Identity,
    input: CreateTask,
    origin: z.infer<typeof originSchema>,
    requestedBy = identity.id,
  ) {
    const digest = hash(JSON.stringify({ input, origin, requestedBy }));
    return this.ledger.transaction(() => {
      const existing = this.ledger.get(
        "SELECT digest,task FROM events WHERE tenant=? AND source=? AND id=?",
        identity.tenantId,
        identity.id,
        input.eventId,
      );
      if (existing) {
        const row = z.object({ digest: z.string(), task: z.string() }).parse(existing);
        if (row.digest !== digest)
          throw new GatewayError("EVENT_CONFLICT", "Replayed event has different content");
        return { record: this.get(identity, row.task), replayed: true };
      }
      if (input.deadline && Date.parse(input.deadline) <= this.now())
        throw new GatewayError("DEADLINE_EXPIRED", "Task deadline must be in the future");
      const task = taskSchema.parse({
        schemaVersion: "0.1",
        taskId: randomUUID(),
        runId: randomUUID(),
        tenantId: identity.tenantId,
        pack: input.pack,
        requestedBy,
        assignedRole: input.assignedRole,
        objective: input.objective,
        inputRefs: input.inputRefs,
        state: "queued",
        approvalPolicy: "external-actions",
        deadline: input.deadline,
      });
      const record = recordSchema.parse({ task, origin, completionIds: [] });
      this.ledger.run(
        "INSERT INTO tasks(id,tenant,run,data) VALUES(?,?,?,?)",
        task.taskId,
        task.tenantId,
        task.runId,
        JSON.stringify(record),
      );
      this.ledger.run(
        "INSERT INTO events(tenant,source,id,digest,task) VALUES(?,?,?,?,?)",
        identity.tenantId,
        identity.id,
        input.eventId,
        digest,
        task.taskId,
      );
      this.ledger.audit(identity.tenantId, task.taskId, identity.id, "task.queued", this.now());
      return { record, replayed: false };
    });
  }
  save(record: TaskRecord): void {
    this.ledger.run(
      "UPDATE tasks SET data=? WHERE id=? AND tenant=?",
      JSON.stringify(record),
      record.task.taskId,
      record.task.tenantId,
    );
  }
  move(
    identity: Identity,
    record: TaskRecord,
    state: Task["state"],
    completionIds = record.completionIds,
  ): TaskRecord {
    if (!canTransition(record.task.state, state))
      throw new GatewayError("STATE_CONFLICT", "Operation is invalid in the current task state");
    const next = recordSchema.parse({ ...record, task: { ...record.task, state }, completionIds });
    this.save(next);
    this.ledger.audit(
      identity.tenantId,
      record.task.taskId,
      identity.id,
      `task.${state}`,
      this.now(),
    );
    return next;
  }
  claim(identity: Identity, id: string) {
    requireRole(identity, ["operator"]);
    return this.ledger.transaction(() => {
      const record = this.get(identity, id);
      const expires = Math.min(
        this.now() + 3_600_000,
        record.task.deadline ? Date.parse(record.task.deadline) : Infinity,
      );
      if (expires <= this.now())
        throw new GatewayError("DEADLINE_EXPIRED", "Task deadline has expired");
      const next = this.move(identity, record, "running");
      const credential = randomBytes(32).toString("base64url");
      this.ledger.run(
        "INSERT INTO credentials(digest,tenant,task,run,actor,expires) VALUES(?,?,?,?,?,?)",
        hash(credential),
        identity.tenantId,
        id,
        record.task.runId,
        record.task.assignedRole,
        expires,
      );
      return {
        record: next,
        credential,
        expiresAt: new Date(expires).toISOString(),
        dispatch: "manual_native" as const,
      };
    });
  }
}
export function requireRole(identity: Identity, allowed: readonly Identity["role"][]): void {
  if (!allowed.includes(identity.role))
    throw new GatewayError("ROLE_DENIED", "Identity cannot perform this operation", 403);
}
