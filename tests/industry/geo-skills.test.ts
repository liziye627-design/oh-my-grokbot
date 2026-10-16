import { expect, it } from "vitest";
import { loadIndustryCatalog } from "../../src/industry/catalog.js";
import { createPlan } from "../../src/installer/plan.js";

it("includes executable GEO research in the content Bot installation", async () => {
  // Given the actual second-layer content catalog.
  const catalog = await loadIndustryCatalog("registry/catalog.json");
  // When the user installs their content team.
  const plan = await createPlan(catalog, {
    name: "oh-my-content-studio",
    range: "*",
    provider: "grokbot",
  });
  // Then the report runner and source license travel with that team.
  for (const path of [
    "vendor/scripts/run_research.py",
    "vendor/geo_research/report.py",
    "licenses/zimu-growth-skills.txt",
  ]) {
    expect(plan.files.some((file) => file.target === `skills/zimu-geo-research/${path}`)).toBe(
      true,
    );
  }
});
