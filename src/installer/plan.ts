import { readFile } from "node:fs/promises";
import type { Check, Provider } from "../contracts/common.js";
import { type InstallPlan, type LockedFile, planSchema } from "../contracts/installation.js";
import { assertNever, CoreError } from "../errors.js";
import { hash, safePath, tree } from "../io.js";
import { nativeGuide } from "../providers/grokbot.js";
import type { Catalog } from "../registry/catalog.js";
import { resolvePack } from "../registry/resolver.js";
import { validateSkill } from "../registry/skill.js";

export async function createPlan(
  catalog: Catalog,
  request: { readonly name: string; readonly range: string; readonly provider: Provider },
): Promise<InstallPlan> {
  const resolution = resolvePack(catalog.data, request);
  const selectedSkills = new Set(
    resolution.capabilities.filter((item) => item.kind === "skill").map((item) => item.id),
  );
  if (
    resolution.pack.spec.agents.some((agent) =>
      agent.skills.some((skill) => !selectedSkills.has(skill)),
    )
  )
    throw new CoreError(
      "AGENT_SKILL_MISSING",
      "An agent references a Skill outside the resolved capability set",
    );
  const files: LockedFile[] = [];
  const checks: Check[] = [];
  if (resolution.pack.metadata.verification !== "verified")
    checks.push({
      name: resolution.pack.metadata.name,
      status: resolution.pack.metadata.verification === "discovered" ? "failed" : "needs_human",
      code:
        resolution.pack.metadata.verification === "discovered"
          ? "RESOURCE_UNREVIEWED"
          : "RESOURCE_UNVERIFIED",
      message: "Pack requires independent review and native verification",
    });
  for (const capability of resolution.capabilities) {
    const source = catalog.data.sources.find((item) => item.id === capability.source);
    if (!source) throw new CoreError("SOURCE_MISSING", "Selected capability has no source");
    if (source.verification === "discovered" || capability.verification === "discovered") {
      checks.push({
        name: capability.id,
        status: "failed",
        code: "RESOURCE_UNREVIEWED",
        message: "Unreviewed resources cannot be installed",
      });
    } else if (source.verification !== "verified" || capability.verification !== "verified") {
      checks.push({
        name: capability.id,
        status: "needs_human",
        code: "RESOURCE_UNVERIFIED",
        message: "Reviewed development resource; independent native verification pending",
      });
    }
    switch (capability.delivery.mode) {
      case "bundled": {
        const directory = capability.delivery.directory;
        if (capability.kind === "skill")
          await validateSkill(await safePath(catalog.root, `${directory}/SKILL.md`), capability.id);
        const bundled = await tree(catalog.root, directory);
        if (!bundled.length) throw new CoreError("BUNDLE_EMPTY", "Bundled capability has no files");
        for (const sourcePath of bundled) {
          const target = `${capability.kind === "skill" ? "skills" : "resources"}/${capability.id}/${sourcePath.slice(directory.length + 1)}`;
          files.push({
            mode: "bundled",
            source: sourcePath,
            target,
            sha256: hash(await readFile(await safePath(catalog.root, sourcePath))),
          });
        }
        break;
      }
      case "reference":
        checks.push({
          name: capability.id,
          status: "needs_human",
          code: "REFERENCE_ONLY",
          message: capability.delivery.instructions,
        });
        break;
      default: {
        return assertNever(capability.delivery);
      }
    }
    if (capability.providerSupport[request.provider] !== "supported") {
      checks.push({
        name: `${capability.id}:provider`,
        status: "needs_human",
        code: "PROVIDER_CONFIRMATION",
        message: `Provider capability is ${capability.providerSupport[request.provider]}; confirm in the native environment`,
      });
    }
  }
  const content = nativeGuide(resolution, request.provider);
  files.push({
    mode: "generated",
    content,
    target: `recipes/${resolution.pack.metadata.name}/${request.provider}.md`,
    sha256: hash(content),
  });
  if (new Set(files.map((file) => file.target.toLowerCase())).size !== files.length)
    throw new CoreError("TARGET_CONFLICT", "Capabilities target the same managed path");
  checks.push({
    name: "native-smoke",
    status: "needs_human",
    code: "NATIVE_VERIFICATION_REQUIRED",
    message: "Verify Bot creation/import, Skill visibility and one real task in the native host",
  });
  return planSchema.parse({
    schemaVersion: "0.1",
    pack: resolution.pack,
    provider: request.provider,
    registryDigest: catalog.digest,
    capabilities: resolution.capabilities,
    files,
    checks,
    permissions: [...new Set(resolution.capabilities.flatMap((item) => item.permissions))].sort(),
    skipped: resolution.skipped,
  });
}
