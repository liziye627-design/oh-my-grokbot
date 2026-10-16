import type { z } from "zod";
import { hash } from "../io.js";
import {
  type Approval,
  type approvalInputSchema,
  approvalSchema,
  type Identity,
} from "./contracts.js";
import { jsonColumn } from "./database.js";
import { GatewayError } from "./errors.js";
import { requireRole, type Tasks } from "./tasks.js";

export class Approvals {
  constructor(readonly tasks: Tasks) {}
  list(identity: Identity, taskId: string): readonly Approval[] {
    this.tasks.get(identity, taskId);
    return this.tasks.ledger
      .all("SELECT data FROM approvals WHERE tenant=? AND task=?", identity.tenantId, taskId)
      .map((row) => approvalSchema.parse(jsonColumn(row)));
  }
  request(identity: Identity, input: z.infer<typeof approvalInputSchema>): Approval {
    return this.tasks.ledger.transaction(() => {
      const record = this.tasks.runner(identity, input.taskId, input.runId);
      const payloadHash = hash(
        JSON.stringify({
          operation: input.operation,
          destination: input.destination,
          payload: input.payload,
        }),
      );
      const existing = this.tasks.ledger.get(
        "SELECT data FROM approvals WHERE id=?",
        input.approvalId,
      );
      if (existing) {
        const approval = approvalSchema.parse(jsonColumn(existing));
        if (
          approval.tenantId !== identity.tenantId ||
          approval.taskId !== input.taskId ||
          approval.runId !== input.runId ||
          approval.payloadHash !== payloadHash ||
          approval.expiresAt !== input.expiresAt
        )
          throw new GatewayError(
            "APPROVAL_CONFLICT",
            "Approval identifier is already bound to another proposal",
          );
        return approval;
      }
      if (record.task.state !== "running")
        throw new GatewayError("STATE_CONFLICT", "Only a running task may request approval");
      const expires = Date.parse(input.expiresAt);
      if (expires <= this.tasks.now() || expires > this.tasks.now() + 86_400_000)
        throw new GatewayError(
          "APPROVAL_EXPIRY",
          "Approval expiry must be within the next 24 hours",
          400,
        );
      const approval = approvalSchema.parse({
        ...input,
        tenantId: identity.tenantId,
        payloadHash,
        state: "pending",
        decidedBy: null,
      });
      this.tasks.ledger.run(
        "INSERT INTO approvals(id,tenant,task,data) VALUES(?,?,?,?)",
        approval.approvalId,
        identity.tenantId,
        input.taskId,
        JSON.stringify(approval),
      );
      this.tasks.move(identity, record, "awaiting_approval");
      return approval;
    });
  }
  decide(
    identity: Identity,
    id: string,
    decision: "approved" | "denied",
    payloadHash: string,
  ): Approval {
    requireRole(identity, ["operator"]);
    return this.tasks.ledger.transaction(() => {
      const approval = approvalSchema.parse(
        jsonColumn(
          this.tasks.ledger.get(
            "SELECT data FROM approvals WHERE id=? AND tenant=?",
            id,
            identity.tenantId,
          ),
        ),
      );
      if (approval.payloadHash !== payloadHash)
        throw new GatewayError("APPROVAL_HASH", "Decision does not match the exact proposal");
      if (approval.state !== "pending")
        throw new GatewayError("APPROVAL_STATE", "Approval has already been decided");
      const record = this.tasks.get(identity, approval.taskId);
      if (identity.id === record.task.assignedRole)
        throw new GatewayError("SELF_APPROVAL", "A distinct approver identity is required", 403);
      if (record.task.state !== "awaiting_approval" || record.task.runId !== approval.runId)
        throw new GatewayError(
          "STATE_CONFLICT",
          "Approval task is no longer awaiting this decision",
        );
      const state = Date.parse(approval.expiresAt) <= this.tasks.now() ? "expired" : decision;
      const next: Approval = { ...approval, state, decidedBy: identity.id };
      this.tasks.ledger.run("UPDATE approvals SET data=? WHERE id=?", JSON.stringify(next), id);
      this.tasks.move(identity, record, state === "approved" ? "running" : "needs_human");
      return next;
    });
  }
}
