import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { provenanceSchema } from "../src/contracts/provenance.js";
import { loadCatalog } from "../src/registry/catalog.js";
import { verifyProvenance } from "../src/registry/provenance.js";

let root: string;
beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "ohmy-upstreams-"));
  for (const path of ["registry", "skills", "third_party"])
    await cp(path, join(root, path), { recursive: true });
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});
async function lock() {
  return provenanceSchema.parse(
    JSON.parse(await readFile(join(root, "registry/upstreams.lock.json"), "utf8")),
  );
}
async function save(value: unknown) {
  await writeFile(join(root, "registry/upstreams.lock.json"), JSON.stringify(value));
}
describe("Pinned licensed upstream distribution", () => {
  it("verifies all original snapshots and twenty-two adapted Skill trees", async () => {
    const result = await verifyProvenance(root, "registry/upstreams.lock.json");
    expect(result.sources).toHaveLength(12);
    expect(result.adaptations).toHaveLength(22);
    expect((await loadCatalog(join(root, "registry/catalog.json"))).data.packs).toHaveLength(2);
  });
  it("rejects changed upstream bytes at catalog load before planning", async () => {
    await writeFile(join(root, "third_party/upstreams/superpowers/LICENSE"), "changed");
    await expect(loadCatalog(join(root, "registry/catalog.json"))).rejects.toMatchObject({
      code: "PROVENANCE_HASH",
    });
  });
  it("rejects missing preserved license declarations even when the directory exists", async () => {
    const value = await lock();
    await save({
      ...value,
      adaptations: value.adaptations.map((item) =>
        item.skill === "task-planning"
          ? { ...item, files: item.files.filter((file) => !file.path.includes("/licenses/")) }
          : item,
      ),
    });
    await expect(verifyProvenance(root, "registry/upstreams.lock.json")).rejects.toThrow();
  });
  it("rejects modified adapted Skill content and unexpected executable files", async () => {
    await writeFile(join(root, "skills/task-planning/SKILL.md"), "changed");
    await expect(verifyProvenance(root, "registry/upstreams.lock.json")).rejects.toMatchObject({
      code: "PROVENANCE_HASH",
    });
    await mkdir(join(root, "skills/source-research/scripts"));
    await writeFile(join(root, "skills/source-research/scripts/unreviewed.sh"), "exit 0");
    await expect(verifyProvenance(root, "registry/upstreams.lock.json")).rejects.toMatchObject({
      code: "PROVENANCE_FILES",
    });
  });
  it("rejects floating revisions", async () => {
    const value = await lock();
    await save({ ...value, sources: value.sources.map((item) => ({ ...item, commit: "main" })) });
    await expect(verifyProvenance(root, "registry/upstreams.lock.json")).rejects.toMatchObject({
      code: "SCHEMA_INVALID",
    });
  });
});
