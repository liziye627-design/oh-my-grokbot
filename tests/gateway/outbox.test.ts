import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTaskSchema } from "../../src/gateway/contracts.js";
import { fixture, owner } from "./helpers.js";

let f: Awaited<ReturnType<typeof fixture>>;
beforeEach(async () => {
  f = await fixture();
});
afterEach(async () => {
  await f.cleanup();
});
function queue() {
  const { record } = f.gateway.create(
    owner,
    createTaskSchema.parse({ eventId: "e", objective: "task" }),
  );
  return f.gateway.outbox.enqueue(record, "result");
}
describe("Durable outbox reconciliation", () => {
  it("does not resend a sent reply", async () => {
    queue();
    let calls = 0;
    const sender = async () => {
      calls++;
      return "receipt-1";
    };
    await f.gateway.outbox.dispatch(owner, sender);
    await f.gateway.outbox.dispatch(owner, sender);
    expect(calls).toBe(1);
    expect(f.gateway.outbox.list(owner)[0]?.state).toBe("sent");
  });
  it("requires human reconciliation after an ambiguous send failure", async () => {
    queue();
    let calls = 0;
    const sender = async () => {
      calls++;
      throw new Error("timeout after possible delivery");
    };
    await f.gateway.outbox.dispatch(owner, sender);
    await f.gateway.outbox.dispatch(owner, sender);
    expect(calls).toBe(1);
    expect(f.gateway.outbox.list(owner)[0]?.state).toBe("needs_human");
  });
  it("claims each item once across concurrent dispatch attempts", async () => {
    queue();
    let release: (() => void) | undefined;
    let calls = 0;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const first = f.gateway.outbox.dispatch(owner, async () => {
      calls++;
      await gate;
      return "receipt";
    });
    const second = await f.gateway.outbox.dispatch(owner, async () => {
      calls++;
      return "duplicate";
    });
    release?.();
    await first;
    expect(second).toHaveLength(0);
    expect(calls).toBe(1);
  });
  it("marks interrupted in-flight deliveries uncertain before recovery", () => {
    const item = queue();
    f.gateway.ledger.run(
      "UPDATE outbox SET state='sending',data=json_set(data,'$.state','sending') WHERE id=?",
      item.id,
    );
    f.gateway.ledger.recoverDeliveries();
    expect(f.gateway.outbox.list(owner)[0]?.state).toBe("needs_human");
  });
});

it("makes non-Error delivery rejection immediately reconcilable", async () => {
  const item = queue();
  await f.gateway.outbox.dispatch(owner, () => Promise.reject("unknown failure"));
  expect(f.gateway.outbox.list(owner)[0]?.state).toBe("needs_human");
  expect(f.gateway.outbox.reconcile(owner, item.id, "checked-receipt").state).toBe("sent");
});
