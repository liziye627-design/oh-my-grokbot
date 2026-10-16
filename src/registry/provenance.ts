import { readFile } from "node:fs/promises";
import type { Provenance } from "../contracts/provenance.js";
import { provenanceSchema } from "../contracts/provenance.js";
import { CoreError } from "../errors.js";
import { hash, readData, safePath, tree } from "../io.js";

export async function verifyProvenance(root: string, path: string): Promise<Provenance> {
  const lock = await readData(await safePath(root, path), provenanceSchema);
  const unique = (values: readonly string[]) => new Set(values).size === values.length;
  if (
    !unique(lock.sources.map((source) => source.id)) ||
    !unique(lock.adaptations.map((item) => item.skill))
  )
    throw new CoreError("PROVENANCE_DUPLICATE", "Duplicate provenance identity");
  for (const source of lock.sources) {
    const prefix = `third_party/upstreams/${source.id}/`;
    if (
      !source.files.some((file) => file.role === "license") ||
      source.files.some((file) => !file.path.startsWith(prefix))
    )
      throw new CoreError("PROVENANCE_LICENSE", "Source license or snapshot scope is missing");
    await verifyFiles(root, source.files, prefix.slice(0, -1));
  }
  for (const adaptation of lock.adaptations) {
    if (adaptation.directory !== `skills/${adaptation.skill}`)
      throw new CoreError("PROVENANCE_SCOPE", "Adaptation directory does not match its Skill");
    for (const id of adaptation.upstreams) {
      const source = lock.sources.find((item) => item.id === id);
      if (!source) throw new CoreError("PROVENANCE_SOURCE", "Adaptation source is missing");
      const license = source.files.find((file) => file.role === "license");
      const installed = adaptation.files.find(
        (file) => file.path === `${adaptation.directory}/licenses/${id}.txt`,
      );
      if (!license || installed?.sha256 !== license.sha256)
        throw new CoreError(
          "PROVENANCE_LICENSE",
          "Adaptation must preserve the source license bytes",
        );
    }
    if (
      !adaptation.files.some((file) => file.path === `${adaptation.directory}/SKILL.md`) ||
      !adaptation.files.some((file) => file.path === `${adaptation.directory}/NOTICE.md`)
    )
      throw new CoreError("PROVENANCE_NOTICE", "Adaptation entry point or notice is missing");
    await verifyFiles(root, adaptation.files, adaptation.directory);
  }
  return lock;
}

async function verifyFiles(
  root: string,
  files: readonly { readonly path: string; readonly sha256: string }[],
  directory: string,
): Promise<void> {
  const actual = await tree(root, directory);
  const declared = files.map((file) => file.path);
  if (
    new Set(declared).size !== declared.length ||
    actual.length !== declared.length ||
    actual.some((file) => !declared.includes(file))
  )
    throw new CoreError("PROVENANCE_FILES", "Snapshot files differ from the provenance lock");
  for (const file of files) {
    if (hash(await readFile(await safePath(root, file.path))) !== file.sha256)
      throw new CoreError("PROVENANCE_HASH", `Provenance checksum mismatch: ${file.path}`);
  }
}
