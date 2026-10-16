import type { Registry } from "../contracts/registry.js";
import { CoreError } from "../errors.js";
import { resolvePack } from "../registry/resolver.js";
import type { IndustryManifest, Workflow } from "./contracts.js";

function unique(values: readonly string[], label: string): void {
  if (new Set(values).size !== values.length)
    throw new CoreError("INDUSTRY_DUPLICATE", `Duplicate ${label}`);
}
export function orderedSteps(workflow: Workflow): Workflow["steps"] {
  const steps = new Map(workflow.steps.map((step) => [step.id, step]));
  const visited = new Set<string>();
  const active = new Set<string>();
  const ordered: Workflow["steps"][number][] = [];
  const visit = (id: string): void => {
    if (active.has(id))
      throw new CoreError("INDUSTRY_CYCLE", "Workflow dependencies contain a cycle");
    if (visited.has(id)) return;
    const step = steps.get(id);
    if (!step) throw new CoreError("INDUSTRY_STEP_MISSING", `Unknown dependency ${id}`);
    active.add(id);
    for (const dependency of step.dependsOn) visit(dependency);
    active.delete(id);
    visited.add(id);
    ordered.push(step);
  };
  for (const step of workflow.steps) visit(step.id);
  return ordered;
}
export function validateIndustryManifest(manifest: IndustryManifest, registry: Registry): void {
  const pack = manifest.pack;
  unique(
    pack.spec.agents.map((agent) => agent.id),
    "employee role",
  );
  unique(
    manifest.workflows.map((workflow) => workflow.id),
    "workflow",
  );
  const roles = new Set(pack.spec.agents.map((agent) => agent.id));
  const augmented = { ...registry, packs: [pack] };
  for (const provider of pack.spec.providers) {
    const resolved = resolvePack(augmented, {
      name: pack.metadata.name,
      range: pack.metadata.version,
      provider,
    });
    for (const agent of pack.spec.agents) {
      unique(agent.skills, "role skill");
      for (const skill of agent.skills) {
        if (
          !resolved.capabilities.some(
            (capability) => capability.kind === "skill" && capability.id === skill,
          )
        )
          throw new CoreError(
            "INDUSTRY_SKILL_MISSING",
            `Role ${agent.id} requires an unresolved skill: ${skill}`,
          );
      }
    }
  }
  for (const workflow of manifest.workflows) {
    unique(workflow.requiredInputs, "required input");
    unique(
      workflow.steps.map((step) => step.id),
      "workflow step",
    );
    if (!roles.has(workflow.entryRole))
      throw new CoreError("INDUSTRY_ROLE_MISSING", "Workflow entry role is unavailable");
    for (const step of workflow.steps) {
      if (!roles.has(step.role))
        throw new CoreError("INDUSTRY_ROLE_MISSING", `Step role is unavailable: ${step.role}`);
      unique(step.dependsOn, "step dependency");
      unique(step.requiredArtifacts, "step artifact");
    }
    orderedSteps(workflow);
    const roots = workflow.steps.filter((step) => step.dependsOn.length === 0);
    if (roots.length !== 1 || roots[0]?.role !== workflow.entryRole)
      throw new CoreError(
        "INDUSTRY_ENTRY_INVALID",
        "Workflow must have one root owned by its entry role",
      );
  }
}
