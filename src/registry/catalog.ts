import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { type Registry, registrySchema } from "../contracts/registry.js";
import { CoreError } from "../errors.js";
import { hash, readData, safePath } from "../io.js";
import { verifyProvenance } from "./provenance.js";

export type Catalog = {
  readonly root: string;
  readonly digest: string;
  readonly data: Registry;
};

export async function loadCatalog(path: string): Promise<Catalog> {
  const data = await readData(path, registrySchema);
  const keys = [
    ...data.sources.map((source) => `source:${source.id}`),
    ...data.capabilities.map((capability) => `capability:${capability.id}@${capability.version}`),
    ...data.packs.map((pack) => `pack:${pack.metadata.name}@${pack.metadata.version}`),
  ];
  if (new Set(keys).size !== keys.length)
    throw new CoreError(
      "DUPLICATE_RESOURCE",
      "Registry contains duplicate identifiers and versions",
    );
  for (const capability of data.capabilities) {
    const source = data.sources.find((item) => item.id === capability.source);
    if (!source) throw new CoreError("SOURCE_MISSING", `Source is missing for ${capability.id}`);
    if (capability.delivery.mode === "bundled" && source.redistribution === "reference_only") {
      throw new CoreError(
        "LICENSE_RESTRICTED",
        `Reference-only source cannot be bundled: ${source.id}`,
      );
    }
  }
  const root = resolve(dirname(path), "..");
  let provenanceDigest = "";
  if (data.upstreamLock) {
    const lock = await verifyProvenance(root, data.upstreamLock);
    for (const capability of data.capabilities.filter(
      (item) => item.kind === "skill" && item.delivery.mode === "bundled",
    )) {
      if (
        !lock.adaptations.some(
          (item) =>
            item.skill === capability.id &&
            capability.delivery.mode === "bundled" &&
            item.directory === capability.delivery.directory,
        )
      )
        throw new CoreError("PROVENANCE_SKILL", `Skill provenance is missing: ${capability.id}`);
    }
    provenanceDigest = hash(await readFile(await safePath(root, data.upstreamLock)));
  }
  return {
    root,
    digest: hash(Buffer.concat([await readFile(path), Buffer.from(provenanceDigest)])),
    data,
  };
}
