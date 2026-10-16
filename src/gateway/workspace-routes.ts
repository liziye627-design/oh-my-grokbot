import type { Hono } from "hono";
import { industryPlanInputSchema } from "../industry/plan.js";
import type { IndustryEnvironment } from "./industry-routes.js";
import type { Gateway } from "./service.js";
import { requireRole } from "./tasks.js";

const intakeSchema = industryPlanInputSchema.unwrap().required({ eventId: true }).readonly();
export function registerWorkspaceRoutes(app: Hono<IndustryEnvironment>, gateway: Gateway): void {
  app.get("/v1/workspaces", (c) => c.json({ workspaces: gateway.workspaces.list(c.var.identity) }));
  app.post("/v1/workspaces/:id/workflows/:workflow/tasks", async (c) => {
    requireRole(c.var.identity, ["operator"]);
    const input = intakeSchema.parse(await c.req.json());
    return c.json(
      gateway.createWorkspace(c.var.identity, c.req.param("id"), c.req.param("workflow"), input),
      201,
    );
  });
}
