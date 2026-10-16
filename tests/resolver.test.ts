import { beforeAll, describe, expect, it } from "vitest";
import type { Requirement } from "../src/contracts/common.js";
import { type Capability, capabilitySchema, type Registry } from "../src/contracts/registry.js";
import { loadCatalog } from "../src/registry/catalog.js";
import { resolvePack } from "../src/registry/resolver.js";

let catalog: Registry;
beforeAll(async () => {
  catalog = (await loadCatalog("registry/catalog.json")).data;
});
const req = (capability: string, range = "*", optional = false): Requirement => ({
  capability,
  range,
  optional,
});
function candidate(id: string, changes: Partial<Capability> = {}): Capability {
  return capabilitySchema.parse({
    id,
    version: "1.0.0",
    kind: "mcp",
    source: "ohmy-local",
    description: id,
    provides: [id],
    dependencies: [],
    permissions: [],
    risk: 0,
    providerSupport: { grokbot: "supported", muse: "unsupported" },
    verification: "reviewed",
    delivery: { mode: "reference", url: "https://example.com/tool", instructions: "manual" },
    ...changes,
  });
}
function solve(capabilities: readonly Capability[], requirements: readonly Requirement[]) {
  const base = catalog.packs[0];
  if (!base) throw new Error("Core fixture is missing");
  return resolvePack(
    { ...catalog, capabilities, packs: [{ ...base, spec: { ...base.spec, requirements } }] },
    { name: "oh-my-core", range: "*", provider: "grokbot" },
  );
}

describe("Capability resolution", () => {
  it("prefers a native connector over a duplicate MCP", () => {
    const candidates = [
      candidate("external-tool", { provides: ["research"] }),
      candidate("native-tool", { kind: "native", provides: ["research"] }),
    ];
    const result = solve(candidates, [req("research")]);
    expect(result.capabilities.map((item) => item.id)).toEqual(["native-tool"]);
  });
  it("backtracks when the newest dependency version conflicts", () => {
    const candidates = [
      candidate("writer", { version: "2.0.0", dependencies: [req("shared", "^2")] }),
      candidate("writer", { dependencies: [req("shared", "^1")] }),
      candidate("reviewer", { dependencies: [req("shared", "^1")] }),
      candidate("shared", { version: "2.0.0" }),
      candidate("shared"),
    ];
    const result = solve(candidates, [req("writer"), req("reviewer")]);
    expect(result.capabilities.find((item) => item.id === "writer")?.version).toBe("1.0.0");
  });
  it("rejects cyclic capability dependencies", () => {
    const candidates = [
      candidate("first", { dependencies: [req("second")] }),
      candidate("second", { dependencies: [req("first")] }),
    ];
    expect(() => solve(candidates, [req("first")])).toThrowError(
      expect.objectContaining({ code: "DEPENDENCY_CYCLE" }),
    );
  });
  it("rejects incompatible version constraints", () => {
    const candidates = [
      candidate("first", { dependencies: [req("shared", "^1")] }),
      candidate("second", { dependencies: [req("shared", "^2")] }),
      candidate("shared"),
      candidate("shared", { version: "2.0.0" }),
    ];
    expect(() => solve(candidates, [req("first"), req("second")])).toThrowError(
      expect.objectContaining({ code: "DEPENDENCY_CONFLICT" }),
    );
  });
  it("records unavailable optional dependencies explicitly", () => {
    const candidates = [candidate("first")];
    const result = solve(candidates, [req("first"), req("optional", "*", true)]);
    expect(result.skipped).toEqual(["optional"]);
  });
  it("prefers the same-kind capability that declares the requested task fit", () => {
    const candidates = [
      candidate("writer", { version: "2.0.0", provides: ["draft"], taskFit: ["text"] }),
      candidate("illustrator", { provides: ["draft"], taskFit: ["image"] }),
    ];
    const result = solve(candidates, [{ ...req("draft"), fit: "image" }]);
    expect(result.capabilities.map((item) => item.id)).toEqual(["illustrator"]);
  });
  it("keeps native precedence when only a lower-trust capability matches the task fit", () => {
    const candidates = [
      candidate("external-image", { provides: ["draft"], taskFit: ["image"] }),
      candidate("native-draft", { kind: "native", provides: ["draft"], taskFit: ["text"] }),
    ];
    const result = solve(candidates, [{ ...req("draft"), fit: "image" }]);
    expect(result.capabilities.map((item) => item.id)).toEqual(["native-draft"]);
  });
  it("rejects capabilities unsupported by the requested provider", () => {
    const candidates = [
      candidate("first", { providerSupport: { grokbot: "unsupported", muse: "supported" } }),
    ];
    expect(() => solve(candidates, [req("first")])).toThrowError(
      expect.objectContaining({ code: "DEPENDENCY_CONFLICT" }),
    );
  });
});
