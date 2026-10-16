import type { z } from "zod";
import type { Artifacts } from "./artifacts.js";
import type { completionSchema, failureSchema, Identity } from "./contracts.js";
import { GatewayError } from "./errors.js";
import type { Outbox } from "./outbox.js";
import { requireRole, type Tasks } from "./tasks.js";

export class Lifecycle {
  constructor(
    readonly tasks: Tasks,
    readonly artifacts: Artifacts,
    readonly outbox: Outbox,
  ) {}
  complete(identity: Identity, input: z.infer<typeof completionSchema>) {
    return this.tasks.ledger.transaction(() => {
      const record = this.tasks.runner(identity, input.taskId, input.runId);
      const requested = [...new Set(input.artifactIds)].sort();
      if (requested.length !== input.artifactIds.length)
        throw new GatewayError(
          "ARTIFACT_DUPLICATE",
          "Completion must reference unique artifacts",
          400,
        );
      if (
        record.task.state === "verifying" &&
        JSON.stringify([...record.completionIds].sort()) === JSON.stringify(requested)
      )
        return record;
      if (record.task.state !== "running")
        throw new GatewayError("STATE_CONFLICT", "Completion requires a running task");
      const artifacts = this.artifacts.list(identity, input.taskId);
      if (
        requested.some(
          (id) =>
            !artifacts.some(
              (item) => item.id === id && item.runId === input.runId && item.status === "submitted",
            ),
        )
      )
        throw new GatewayError(
          "ARTIFACT_MISSING",
          "Completion references unavailable submitted evidence",
          400,
        );
      return this.tasks.move(identity, record, "verifying", requested);
    });
  }
  fail(identity: Identity, input: z.infer<typeof failureSchema>) {
    return this.tasks.ledger.transaction(() => {
      const record = this.tasks.runner(identity, input.taskId, input.runId);
      if (record.task.state !== "running" && record.task.state !== "awaiting_approval")
        throw new GatewayError("STATE_CONFLICT", "Failure cannot modify this task state");
      const next = this.tasks.move(
        identity,
        record,
        record.task.state === "awaiting_approval" ? "needs_human" : "failed",
      );
      this.tasks.ledger.run(
        "INSERT INTO reports(tenant,task,run,actor,kind,message,at) VALUES(?,?,?,?,?,?,?)",
        identity.tenantId,
        input.taskId,
        input.runId,
        identity.id,
        "failure",
        `${input.code}: ${input.message}`,
        this.tasks.now(),
      );
      this.outbox.enqueue(
        next,
        `任务 ${input.taskId} 未完成。错误类别：${input.code}。请在任务台账查看原因。`,
      );
      return next;
    });
  }
  async review(identity: Identity, id: string, verdict: "accepted" | "rejected", reason: string) {
    requireRole(identity, ["operator", "verifier"]);
    const record = this.tasks.get(identity, id);
    if (identity.id === record.task.assignedRole)
      throw new GatewayError("SELF_REVIEW", "A distinct reviewer identity is required", 403);
    if (record.task.state !== "verifying")
      throw new GatewayError("STATE_CONFLICT", "Only a submitted completion can be reviewed");
    const evidence = this.artifacts
      .list(identity, id)
      .filter((item) => record.completionIds.includes(item.id));
    if (!evidence.length || evidence.length !== record.completionIds.length)
      throw new GatewayError("ARTIFACT_MISSING", "Completion evidence is incomplete");
    if (verdict === "accepted") await this.artifacts.check(evidence);
    return this.tasks.ledger.transaction(() => {
      const current = this.tasks.get(identity, id);
      if (
        current.task.state !== "verifying" ||
        JSON.stringify(current.completionIds) !== JSON.stringify(record.completionIds)
      )
        throw new GatewayError("STATE_CONFLICT", "Task changed during review");
      this.artifacts.mark(evidence, verdict);
      const next = this.tasks.move(
        identity,
        current,
        verdict === "accepted" ? "succeeded" : "failed",
      );
      this.tasks.ledger.run(
        "UPDATE credentials SET revoked=1 WHERE tenant=? AND task=?",
        identity.tenantId,
        id,
      );
      this.outbox.enqueue(
        next,
        `任务 ${id}：${verdict === "accepted" ? "已验收" : "验收未通过"}。${reason}\n交付物：${evidence.map((item) => `${item.name} (${item.sha256})`).join("、")}`,
      );
      return next;
    });
  }
}
