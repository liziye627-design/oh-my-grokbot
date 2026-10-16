import { readdir } from "node:fs/promises";
import { identifier } from "../contracts/common.js";
import { capabilitySchema, packSchema } from "../contracts/registry.js";
import { CoreError } from "../errors.js";
import { exists, hash, readData, safePath } from "../io.js";
import { type Catalog, loadCatalog } from "../registry/catalog.js";
import { type IndustryManifest, industryManifestSchema } from "./contracts.js";
import { validateIndustryManifest } from "./validation.js";

export async function loadIndustryManifests(root: string): Promise<readonly IndustryManifest[]> {
  const directory = await safePath(root, "industries");
  if (!(await exists(directory))) return [];
  const entries = await readdir(directory, { withFileTypes: true });
  const manifests: IndustryManifest[] = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name, "en"))) {
    if (entry.isSymbolicLink())
      throw new CoreError("SYMLINK_REJECTED", "Industry directories cannot contain symbolic links");
    if (!entry.isDirectory()) continue;
    identifier.parse(entry.name);
    const manifest = await readData(
      await safePath(root, `industries/${entry.name}/industry.json`),
      industryManifestSchema,
    );
    if (manifest.pack.metadata.name !== `oh-my-${entry.name}`)
      throw new CoreError(
        "INDUSTRY_DIRECTORY",
        "Industry directory must match pack name without oh-my- prefix",
      );
    manifests.push(manifest);
  }
  return manifests;
}
export async function augmentIndustryCatalog(catalog: Catalog): Promise<Catalog> {
  const manifests = await loadIndustryManifests(catalog.root);
  if (manifests.length === 0) return catalog;
  const directories = await readdir(await safePath(catalog.root, "industries"), {
    withFileTypes: true,
  });
  const capabilities = [...catalog.data.capabilities];
  const packs = [...catalog.data.packs];
  const keys = catalog.data.packs.map((pack) => `${pack.metadata.name}@${pack.metadata.version}`);
  for (const manifest of manifests) {
    validateIndustryManifest(manifest, catalog.data);
    const key = `${manifest.pack.metadata.name}@${manifest.pack.metadata.version}`;
    if (keys.includes(key))
      throw new CoreError("DUPLICATE_RESOURCE", `Duplicate industry pack ${key}`);
    keys.push(key);
    const directory = directories.find(
      (entry) =>
        entry.isDirectory() && entry.name === manifest.pack.metadata.name.replace(/^oh-my-/, ""),
    );
    if (!directory)
      throw new CoreError(
        "INDUSTRY_DIRECTORY",
        "Industry directory must match pack name without oh-my- prefix",
      );
    if (
      !catalog.data.sources.some(
        (source) => source.id === "ohmy-local" && source.redistribution !== "reference_only",
      )
    )
      throw new CoreError("SOURCE_MISSING", "Industry bundles require the local project source");
    const id = `${directory.name}-team`;
    if (capabilities.some((item) => item.id === id))
      throw new CoreError("DUPLICATE_RESOURCE", `Duplicate industry capability ${id}`);
    capabilities.push(
      capabilitySchema.parse({
        id,
        version: manifest.pack.metadata.version,
        kind: "adapter",
        source: "ohmy-local",
        description: manifest.pack.metadata.description,
        provides: [id],
        dependencies: [],
        permissions: [],
        risk: 1,
        providerSupport: { grokbot: "manual", muse: "unsupported" },
        verification: "reviewed",
        delivery: { mode: "bundled", directory: `industries/${directory.name}` },
      }),
    );
    packs.push(
      packSchema.parse({
        ...manifest.pack,
        spec: {
          ...manifest.pack.spec,
          requirements: [
            ...manifest.pack.spec.requirements,
            { capability: id, range: manifest.pack.metadata.version, optional: false },
          ],
        },
      }),
    );
  }
  // Include normalized manifests in the lock digest: workflow edits invalidate old plans too.
  return {
    root: catalog.root,
    digest: hash(JSON.stringify({ base: catalog.digest, manifests })),
    data: { ...catalog.data, packs, capabilities },
  };
}
export async function loadIndustryCatalog(path: string): Promise<Catalog> {
  return augmentIndustryCatalog(await loadCatalog(path));
}

export async function loadValidatedIndustryManifests(
  path: string,
): Promise<readonly IndustryManifest[]> {
  const catalog = await loadCatalog(path);
  const manifests = await loadIndustryManifests(catalog.root);
  const keys = new Set(
    catalog.data.packs.map((pack) => `${pack.metadata.name}@${pack.metadata.version}`),
  );
  for (const manifest of manifests) {
    validateIndustryManifest(manifest, catalog.data);
    const key = `${manifest.pack.metadata.name}@${manifest.pack.metadata.version}`;
    if (keys.has(key)) throw new CoreError("DUPLICATE_RESOURCE", `Duplicate industry pack ${key}`);
    keys.add(key);
  }
  return manifests;
}
