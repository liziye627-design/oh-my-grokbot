import { describe, expect, it } from "vitest";
import { registrySchema } from "../../src/contracts/registry.js";
import { industryManifestSchema } from "../../src/industry/contracts.js";
import { validateIndustryManifest } from "../../src/industry/validation.js";
import { readData } from "../../src/io.js";

const registry = await readData("registry/catalog.json", registrySchema);
const base = registry.packs[0];
if (!base) throw new Error("Fixture pack missing");
const manifest = industryManifestSchema.parse({
  pack: base,
  workflows: [
    {
      id: "research",
      name: "Research",
      entryRole: base.spec.agents[0]?.id,
      requiredInputs: ["brief"],
      approvalRequired: false,
      steps: [
        {
          id: "draft",
          role: base.spec.agents[0]?.id,
          dependsOn: [],
          requiredArtifacts: ["report.md"],
          acceptanceCriteria: ["Reviewed evidence"],
        },
      ],
    },
  ],
});
describe("industry validation", () => {
  it("accepts existing roles and resolved skills when references are valid", () => {
    // Given a manifest using the real Core registry; When validated; Then accepted.
    expect(() => validateIndustryManifest(manifest, registry)).not.toThrow();
  });
  it("rejects cyclic dependencies when a step depends on itself", () => {
    // Given a self cycle; When validated; Then rejected.
    const workflow = manifest.workflows[0];
    if (!workflow) throw new Error("Fixture missing");
    const invalid = industryManifestSchema.parse({
      ...manifest,
      workflows: [
        { ...workflow, steps: workflow.steps.map((step) => ({ ...step, dependsOn: [step.id] })) },
      ],
    });
    expect(() => validateIndustryManifest(invalid, registry)).toThrow();
  });
  it("rejects unknown roles when a workflow assigns unavailable employees", () => {
    // Given an unknown role; When validated; Then rejected.
    const invalid = industryManifestSchema.parse({
      ...manifest,
      workflows: manifest.workflows.map((workflow) => ({ ...workflow, entryRole: "missing-role" })),
    });
    expect(() => validateIndustryManifest(invalid, registry)).toThrow();
  });
});
