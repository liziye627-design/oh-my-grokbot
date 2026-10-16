import type { Hono } from "hono";
import { CoreError } from "../errors.js";
import type { IndustryManifest } from "../industry/contracts.js";
import { industryPlanInputSchema, prepareIndustryPlan } from "../industry/plan.js";
import type { Identity } from "./contracts.js";
import { GatewayError } from "./errors.js";
import type { Gateway } from "./service.js";
import { requireRole } from "./tasks.js";

export type IndustryEnvironment = { readonly Variables: { readonly identity: Identity } };
const intakeSchema = industryPlanInputSchema.unwrap().required({ eventId: true }).readonly();

export function registerIndustryRoutes(
  app: Hono<IndustryEnvironment>,
  gateway: Gateway,
  manifests: readonly IndustryManifest[],
): void {
  app.get("/v1/industries", (c) => {
    requireRole(c.var.identity, ["operator", "verifier"]);
    return c.json({ industries: manifests });
  });
  app.post("/v1/industries/:pack/workflows/:workflow/tasks", async (c) => {
    requireRole(c.var.identity, ["operator"]);
    const manifest = manifests.find((item) => item.pack.metadata.name === c.req.param("pack"));
    if (!manifest)
      throw new GatewayError("INDUSTRY_PACK_MISSING", "Industry pack is unavailable", 404);
    const input = intakeSchema.parse(await c.req.json());
    try {
      const handoff = prepareIndustryPlan(manifest, c.req.param("workflow"), input);
      const result = gateway.create(c.var.identity, handoff.taskRequest);
      return c.json({ ...result, handoff }, 201);
    } catch (error) {
      if (error instanceof CoreError) {
        if (error.code === "INDUSTRY_WORKFLOW_MISSING")
          throw new GatewayError(error.code, error.message, 404);
        if (error.code === "INDUSTRY_INPUT_MISSING" || error.code === "INDUSTRY_HANDOFF_TOO_LARGE")
          throw new GatewayError(error.code, error.message, 400);
      }
      throw error;
    }
  });
}
