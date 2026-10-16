import { rcompare, satisfies } from "semver";
import type { Provider, Requirement } from "../contracts/common.js";
import type { Capability, Pack, Registry } from "../contracts/registry.js";
import { CoreError } from "../errors.js";

type Work = { readonly requirement: Requirement; readonly trail: readonly string[] };
type Selection = {
  readonly chosen: ReadonlyMap<string, Capability>;
  readonly bindings: ReadonlyMap<string, Capability>;
  readonly skipped: readonly string[];
};
export type Resolution = {
  readonly pack: Pack;
  readonly capabilities: readonly Capability[];
  readonly skipped: readonly string[];
};
const preference = { native: 0, cli: 1, sdk: 1, skill: 2, mcp: 3, adapter: 4 } as const;

function fitRank(capability: Capability, fit: Requirement["fit"]): number {
  if (!fit) return 0;
  return capability.taskFit?.includes(fit) ? 0 : 1;
}

export function resolvePack(
  registry: Registry,
  request: { readonly name: string; readonly range: string; readonly provider: Provider },
): Resolution {
  const pack = registry.packs
    .filter(
      (item) =>
        item.metadata.name === request.name && satisfies(item.metadata.version, request.range),
    )
    .sort((a, b) => rcompare(a.metadata.version, b.metadata.version))[0];
  if (!pack)
    throw new CoreError("PACK_NOT_FOUND", "No pack matches the requested name and version");
  if (!pack.spec.providers.includes(request.provider))
    throw new CoreError("PROVIDER_UNSUPPORTED", "Pack does not support this provider");
  let cycle = false;
  const search = (selection: Selection, pending: readonly Work[]): Selection | undefined => {
    const [work, ...rest] = pending;
    if (!work) return selection;
    const requirement = work.requirement;
    const bound = selection.bindings.get(requirement.capability);
    const candidates = bound
      ? [bound]
      : registry.capabilities
          .filter((candidate) => candidate.provides.includes(requirement.capability))
          .sort(
            (a, b) =>
              preference[a.kind] - preference[b.kind] ||
              fitRank(a, requirement.fit) - fitRank(b, requirement.fit) ||
              rcompare(a.version, b.version) ||
              a.id.localeCompare(b.id),
          );
    for (const candidate of candidates) {
      if (
        !satisfies(candidate.version, requirement.range) ||
        candidate.providerSupport[request.provider] === "unsupported"
      )
        continue;
      if (work.trail.includes(candidate.id)) {
        cycle = true;
        continue;
      }
      const existing = selection.chosen.get(candidate.id);
      if (existing && existing.version !== candidate.version) continue;
      const bindings = new Map(selection.bindings).set(requirement.capability, candidate);
      const chosen = new Map(selection.chosen).set(candidate.id, candidate);
      const dependencies = existing
        ? []
        : candidate.dependencies.map((dependency) => ({
            requirement: dependency,
            trail: [...work.trail, candidate.id],
          }));
      const result = search({ chosen, bindings, skipped: selection.skipped }, [
        ...dependencies,
        ...rest,
      ]);
      if (result) return result;
    }
    if (requirement.optional)
      return search(
        { ...selection, skipped: [...selection.skipped, requirement.capability] },
        rest,
      );
    return undefined;
  };
  const selection = search(
    { chosen: new Map(), bindings: new Map(), skipped: [] },
    pack.spec.requirements.map((requirement) => ({ requirement, trail: [] })),
  );
  if (!selection)
    throw new CoreError(
      cycle ? "DEPENDENCY_CYCLE" : "DEPENDENCY_CONFLICT",
      "Dependencies contain a cycle, conflict, or unavailable capability",
    );
  const ordered: Capability[] = [];
  const visited = new Set<string>();
  const visit = (capability: Capability): void => {
    if (visited.has(capability.id)) return;
    visited.add(capability.id);
    for (const dependency of capability.dependencies) {
      const match = selection.bindings.get(dependency.capability);
      if (match) visit(match);
    }
    ordered.push(capability);
  };
  for (const capability of selection.chosen.values()) visit(capability);
  return { pack, capabilities: ordered, skipped: selection.skipped };
}
