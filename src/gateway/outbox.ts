import { randomUUID } from "node:crypto";
import { type Identity, type OutboxItem, outboxSchema, type TaskRecord } from "./contracts.js";
import { jsonColumn, type Ledger } from "./database.js";
import { GatewayError } from "./errors.js";
import { requireRole } from "./tasks.js";

export type Sender = (item: OutboxItem) => Promise<string>;
export class Outbox {
  constructor(readonly ledger: Ledger) {}
  enqueue(record: TaskRecord, text: string): OutboxItem {
    const item = outboxSchema.parse({
      id: randomUUID(),
      tenantId: record.task.tenantId,
      taskId: record.task.taskId,
      origin: record.origin,
      text,
      state: "pending",
      attempts: 0,
      receipt: null,
    });
    this.ledger.run(
      "INSERT INTO outbox(id,tenant,task,state,data) VALUES(?,?,?,?,?)",
      item.id,
      item.tenantId,
      item.taskId,
      item.state,
      JSON.stringify(item),
    );
    return item;
  }
  list(identity: Identity): readonly OutboxItem[] {
    requireRole(identity, ["operator"]);
    return this.ledger
      .all("SELECT data FROM outbox WHERE tenant=? ORDER BY rowid", identity.tenantId)
      .map((row) => outboxSchema.parse(jsonColumn(row)));
  }
  private save(item: OutboxItem): void {
    this.ledger.run(
      "UPDATE outbox SET state=?,data=? WHERE id=? AND tenant=?",
      item.state,
      JSON.stringify(item),
      item.id,
      item.tenantId,
    );
  }
  async dispatch(identity: Identity, sender: Sender): Promise<readonly OutboxItem[]> {
    requireRole(identity, ["operator"]);
    const results: OutboxItem[] = [];
    for (let i = 0; i < 10; i++) {
      const item = this.ledger.transaction(() => {
        const row = this.ledger.get(
          "SELECT data FROM outbox WHERE tenant=? AND state='pending' ORDER BY rowid LIMIT 1",
          identity.tenantId,
        );
        if (!row) return null;
        const pending = outboxSchema.parse(jsonColumn(row));
        const claimed: OutboxItem = {
          ...pending,
          state: "sending",
          attempts: pending.attempts + 1,
        };
        this.save(claimed);
        return claimed;
      });
      if (!item) break;
      try {
        const receipt = await sender(item);
        if (!receipt)
          throw new GatewayError("RECEIPT_MISSING", "Delivery did not provide a receipt");
        const sent: OutboxItem = { ...item, state: "sent", receipt };
        this.save(sent);
        results.push(sent);
      } catch {
        // A remote sender can reject with any value; every ambiguous outcome needs reconciliation.
        const uncertain: OutboxItem = { ...item, state: "needs_human" };
        this.save(uncertain);
        results.push(uncertain);
      }
    }
    return results;
  }
  reconcile(identity: Identity, id: string, receipt: string): OutboxItem {
    requireRole(identity, ["operator"]);
    return this.ledger.transaction(() => {
      const item = outboxSchema.parse(
        jsonColumn(
          this.ledger.get("SELECT data FROM outbox WHERE id=? AND tenant=?", id, identity.tenantId),
        ),
      );
      if (item.state !== "needs_human")
        throw new GatewayError("OUTBOX_STATE", "Only uncertain deliveries require reconciliation");
      const next: OutboxItem = { ...item, state: "sent", receipt };
      this.save(next);
      return next;
    });
  }
}
