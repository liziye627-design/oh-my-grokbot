import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type Identity, principalSchema } from "../../src/gateway/contracts.js";
import { Gateway } from "../../src/gateway/service.js";

export const owner: Identity = { id: "owner", tenantId: "alpha", role: "operator" };
export const reviewer: Identity = { id: "reviewer", tenantId: "alpha", role: "verifier" };
export const token = "o".repeat(40);
export const principals = [
  principalSchema.parse({ ...owner, tokenEnv: "OWNER" }),
  principalSchema.parse({ ...reviewer, tokenEnv: "REVIEWER" }),
  principalSchema.parse({ id: "beta-owner", tenantId: "beta", role: "operator", tokenEnv: "BETA" }),
  principalSchema.parse({
    id: "feishu",
    tenantId: "alpha",
    role: "channel",
    tokenEnv: "CHANNEL",
    chats: ["chat-1"],
    senders: ["user-1"],
  }),
];
export async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "ohmy-gateway-"));
  let now = Date.parse("2026-10-15T08:00:00Z");
  const options = {
    database: join(root, "ledger.sqlite"),
    artifacts: join(root, "artifacts"),
    principals,
    env: { OWNER: token, REVIEWER: "v".repeat(40), BETA: "b".repeat(40), CHANNEL: "c".repeat(40) },
    now: () => now,
  };
  const gateway = new Gateway(options);
  return {
    gateway,
    root,
    options,
    advance(ms: number) {
      now += ms;
    },
    async cleanup() {
      gateway.close();
      await rm(root, { recursive: true, force: true });
    },
  };
}
