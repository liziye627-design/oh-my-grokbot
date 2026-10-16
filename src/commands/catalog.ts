import { validRange } from "semver";
import { identifier } from "../contracts/common.js";
import { CoreError } from "../errors.js";
import type { Catalog } from "../registry/catalog.js";
import type { Options } from "./output.js";

export function packRequest(
  value: string,
  provider: Options["provider"],
): { readonly name: string; readonly range: string; readonly provider: Options["provider"] } {
  const [name, range = "*"] = value.split("@");
  if (
    !name ||
    !identifier.safeParse(name).success ||
    !validRange(range) ||
    value.split("@").length > 2
  )
    throw new CoreError("PACK_REFERENCE_INVALID", "Use pack-name or pack-name@version-range");
  return { name, range, provider };
}

export function searchCatalog(
  catalog: Catalog,
  query: string,
  kind: Options["kind"],
): readonly object[] {
  const entries = [
    ...catalog.data.packs.map((pack) => ({
      kind: "pack",
      id: pack.metadata.name,
      version: pack.metadata.version,
      description: pack.metadata.description,
      verification: pack.metadata.verification,
    })),
    ...catalog.data.capabilities.map((capability) => ({
      kind: capability.kind,
      id: capability.id,
      version: capability.version,
      description: capability.description,
      verification: capability.verification,
    })),
    ...catalog.data.sources.map((source) => ({
      kind: "source",
      id: source.id,
      description: source.author,
      verification: source.verification,
    })),
  ];
  return entries.filter(
    (entry) =>
      (kind === "all" || entry.kind === kind) &&
      `${entry.id} ${entry.description}`.toLowerCase().includes(query.toLowerCase()),
  );
}

export function inspectCatalog(catalog: Catalog, reference: string): object {
  const [name, version] = reference.split("@");
  const result =
    catalog.data.packs.find(
      (item) => item.metadata.name === name && (!version || item.metadata.version === version),
    ) ??
    catalog.data.capabilities.find(
      (item) => item.id === name && (!version || item.version === version),
    ) ??
    catalog.data.sources.find((item) => item.id === reference);
  if (!result)
    throw new CoreError("RESOURCE_NOT_FOUND", "No resource matches this identifier/version");
  return result;
}
