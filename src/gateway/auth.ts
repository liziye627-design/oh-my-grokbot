import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { hash } from "../io.js";
import type { Identity, Principal } from "./contracts.js";
import type { Ledger } from "./database.js";
import { GatewayError } from "./errors.js";

export class Access {
  private readonly entries: readonly { readonly principal: Principal; readonly digest: string }[];
  constructor(
    readonly ledger: Ledger,
    principals: readonly Principal[],
    env: Readonly<Record<string, string | undefined>>,
    readonly now: () => number,
  ) {
    this.entries = principals.map((principal) => {
      const token = env[principal.tokenEnv];
      if (!token || !/^[A-Za-z0-9_-]{32,200}$/.test(token))
        throw new GatewayError(
          "CREDENTIAL_REQUIRED",
          `Provision a strong token in ${principal.tokenEnv}`,
          400,
        );
      return { principal, digest: hash(token) };
    });
    if (new Set(this.entries.map((item) => item.digest)).size !== this.entries.length)
      throw new GatewayError(
        "CREDENTIAL_DUPLICATE",
        "Each principal requires a distinct token",
        400,
      );
  }
  authenticate(header: string | undefined): Identity {
    if (!header?.startsWith("Bearer ") || header.length > 210)
      throw new GatewayError("UNAUTHORIZED", "Bearer credential required", 401);
    const digest = hash(header.slice(7));
    for (const entry of this.entries)
      if (timingSafeEqual(Buffer.from(entry.digest, "hex"), Buffer.from(digest, "hex")))
        return entry.principal;
    const row = this.ledger.get(
      "SELECT tenant,task,run,actor,expires FROM credentials WHERE digest=? AND revoked=0",
      digest,
    );
    const parsed = z
      .object({
        tenant: z.string(),
        task: z.string(),
        run: z.string(),
        actor: z.string(),
        expires: z.number(),
      })
      .safeParse(row);
    if (!parsed.success || parsed.data.expires <= this.now())
      throw new GatewayError("UNAUTHORIZED", "Credential is invalid or expired", 401);
    const data = parsed.data;
    return {
      id: data.actor,
      tenantId: data.tenant,
      role: "runner",
      scope: { taskId: data.task, runId: data.run },
    };
  }
  principal(id: string): Principal {
    const entry = this.entries.find((item) => item.principal.id === id);
    if (!entry)
      throw new GatewayError("PRINCIPAL_MISSING", "Configured principal is unavailable", 400);
    return entry.principal;
  }
}
