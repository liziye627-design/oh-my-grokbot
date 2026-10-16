import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "vitest";
import { registrySchema } from "../../src/contracts/registry.js";
import {
  loadIndustryManifests,
  loadValidatedIndustryManifests,
} from "../../src/industry/catalog.js";
import { readData, writeJson } from "../../src/io.js";

it("rejects an invalid entry role when loading industry manifests from disk", async () => {
  // Given a real manifest whose entry role is replaced with a missing employee.
  const source = await readData("registry/catalog.json", registrySchema);
  const manifest = (await loadIndustryManifests(process.cwd()))[0];
  if (!manifest) throw new Error("Fixture missing");
  const workspace = await mkdtemp(join(tmpdir(), "ohmy-invalid-industry-"));
  try {
    const registryPath = join(workspace, "registry/catalog.json");
    await writeJson(registryPath, {
      apiVersion: source.apiVersion,
      sources: source.sources,
      capabilities: source.capabilities,
      packs: source.packs,
    });
    await writeJson(
      join(
        workspace,
        `industries/${manifest.pack.metadata.name.replace(/^oh-my-/, "")}/industry.json`,
      ),
      {
        ...manifest,
        workflows: manifest.workflows.map((workflow) => ({
          ...workflow,
          entryRole: "unknown-employee",
        })),
      },
    );
    // When the production Gateway loader parses and validates the catalog.
    const loaded = loadValidatedIndustryManifests(registryPath);
    // Then invalid employee routing never reaches task intake.
    await expect(loaded).rejects.toMatchObject({ code: "INDUSTRY_ROLE_MISSING" });
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});
