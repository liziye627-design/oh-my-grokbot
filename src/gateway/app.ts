import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { z } from "zod";
import { CoreError } from "../errors.js";
import type { IndustryManifest } from "../industry/contracts.js";
import {
  createTaskSchema,
  decisionSchema,
  eventSchema,
  type Identity,
  recordSchema,
  reviewSchema,
} from "./contracts.js";
import { jsonColumn } from "./database.js";
import { GatewayError } from "./errors.js";
import { registerIndustryRoutes } from "./industry-routes.js";
import type { Sender } from "./outbox.js";
import { handleResultMcp } from "./result-mcp.js";
import type { Gateway } from "./service.js";
import { requireRole } from "./tasks.js";
import { registerWorkspaceRoutes } from "./workspace-routes.js";

type Environment = { readonly Variables: { readonly identity: Identity } };
export function createGatewayApp(
  gateway: Gateway,
  sender?: Sender,
  industries: readonly IndustryManifest[] = [],
) {
  const app = new Hono<Environment>();
  app.use(
    "*",
    bodyLimit({ maxSize: 1_100_000, onError: (c) => c.json({ code: "BODY_TOO_LARGE" }, 413) }),
  );
  app.get("/health", (c) =>
    c.json({ status: "ok", layer: "gateway-alpha2", nativeTrigger: "manual_unverified" }),
  );
  app.use("*", async (c, next) => {
    const url = new URL(c.req.url);
    if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))
      throw new GatewayError("HOST_DENIED", "Gateway expects loopback Host", 403);
    const origin = c.req.header("Origin");
    if (origin && origin !== url.origin)
      throw new GatewayError("ORIGIN_DENIED", "Cross-origin requests are not accepted", 403);
    c.set("identity", gateway.access.authenticate(c.req.header("Authorization")));
    await next();
  });
  app.onError((error, c) => {
    if (error instanceof GatewayError)
      return c.json({ code: error.code, message: error.message }, error.status);
    if (error instanceof z.ZodError || error instanceof SyntaxError)
      return c.json(
        { code: "INPUT_INVALID", message: "Input does not match endpoint contract" },
        400,
      );
    if (error instanceof CoreError && error.code === "NOT_FOUND")
      return c.json({ code: "NOT_FOUND" }, 404);
    return c.json(
      { code: "GATEWAY_ERROR", message: "Request failed; raw errors and credentials withheld" },
      500,
    );
  });
  registerIndustryRoutes(app, gateway, industries);
  registerWorkspaceRoutes(app, gateway);
  app.get("/v1/tasks", (c) => {
    requireRole(c.var.identity, ["operator", "verifier"]);
    const rows = gateway.ledger.all(
      "SELECT data FROM tasks WHERE tenant=? ORDER BY rowid DESC LIMIT 100",
      c.var.identity.tenantId,
    );
    return c.json({ tasks: rows.map((row) => recordSchema.parse(jsonColumn(row))) });
  });
  app.get("/v1/tasks/:id/artifacts/:artifact", async (c) => {
    requireRole(c.var.identity, ["operator", "verifier", "runner"]);
    return c.json(
      await gateway.artifacts.read(
        c.var.identity,
        z.uuid().parse(c.req.param("id")),
        z.uuid().parse(c.req.param("artifact")),
      ),
    );
  });
  app.post("/v1/outbox/:id/reconcile", async (c) => {
    const body = z
      .strictObject({ receipt: z.string().trim().min(1).max(1000) })
      .parse(await c.req.json());
    return c.json(
      gateway.outbox.reconcile(c.var.identity, z.uuid().parse(c.req.param("id")), body.receipt),
    );
  });
  app.post("/v1/tasks", async (c) =>
    c.json(gateway.create(c.var.identity, createTaskSchema.parse(await c.req.json())), 201),
  );
  app.post("/v1/events", async (c) =>
    c.json(gateway.receive(c.var.identity, eventSchema.parse(await c.req.json())), 201),
  );
  app.get("/v1/tasks/:id", (c) => {
    requireRole(c.var.identity, ["operator", "verifier", "runner"]);
    const record = gateway.tasks.get(c.var.identity, z.uuid().parse(c.req.param("id")));
    return c.json({
      task: record.task,
      artifacts: gateway.artifacts.list(c.var.identity, record.task.taskId),
      reports: gateway.reports(c.var.identity, record.task.taskId),
      approvals: gateway.approvals.list(c.var.identity, record.task.taskId),
    });
  });
  app.post("/v1/tasks/:id/claim", (c) =>
    c.json(gateway.tasks.claim(c.var.identity, z.uuid().parse(c.req.param("id")))),
  );
  app.post("/v1/tasks/:id/review", async (c) => {
    const body = reviewSchema.parse(await c.req.json());
    return c.json(
      await gateway.lifecycle.review(
        c.var.identity,
        z.uuid().parse(c.req.param("id")),
        body.verdict,
        body.reason,
      ),
    );
  });
  app.post("/v1/approvals/:id/decision", async (c) => {
    const input = decisionSchema.parse(await c.req.json());
    return c.json(
      gateway.approvals.decide(
        c.var.identity,
        z.uuid().parse(c.req.param("id")),
        input.decision,
        input.payloadHash,
      ),
    );
  });
  app.get("/v1/outbox", (c) => c.json({ items: gateway.outbox.list(c.var.identity) }));
  app.post("/v1/outbox/dispatch", async (c) => {
    if (!sender) throw new GatewayError("CHANNEL_NOT_CONNECTED", "No channel sender is connected");
    return c.json({ items: await gateway.outbox.dispatch(c.var.identity, sender) });
  });
  app.post("/mcp", (c) => handleResultMcp(gateway, c.var.identity, c.req.raw));
  return app;
}
