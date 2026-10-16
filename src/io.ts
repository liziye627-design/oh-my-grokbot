import { createHash, randomUUID } from "node:crypto";
import { lstat, mkdir, readdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { parse, YAMLParseError } from "yaml";
import type { z } from "zod";
import { CoreError } from "./errors.js";

export function hash(data: string | Buffer): string {
  return createHash("sha256").update(data).digest("hex");
}

export async function exists(path: string): Promise<boolean> {
  try {
    await lstat(path);
    return true;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return false;
    throw error;
  }
}

export async function safePath(root: string, name: string): Promise<string> {
  const base = resolve(root);
  const target = resolve(base, name);
  const local = relative(base, target);
  if (isAbsolute(local) || local === ".." || local.startsWith(`..${sep}`)) {
    throw new CoreError("PATH_ESCAPE", "Path must stay inside its managed root");
  }
  let current = base;
  for (const part of ["", ...local.split(sep).filter(Boolean)]) {
    current = resolve(current, part);
    if (await exists(current)) {
      const info = await lstat(current);
      if (info.isSymbolicLink())
        throw new CoreError("SYMLINK_REJECTED", "Managed paths cannot contain symbolic links");
    }
  }
  return target;
}

export async function readData<S extends z.ZodType>(file: string, schema: S): Promise<z.output<S>> {
  const text = await readFile(file, "utf8");
  let value: unknown;
  try {
    value = parse(text, { uniqueKeys: true, maxAliasCount: 0 });
  } catch (error) {
    if (error instanceof YAMLParseError || error instanceof ReferenceError) {
      throw new CoreError(
        "DOCUMENT_INVALID",
        "Invalid JSON/YAML document (duplicate keys and aliases are rejected)",
      );
    }
    throw error;
  }
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    const fields = parsed.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new CoreError("SCHEMA_INVALID", `Invalid document fields: ${fields}`);
  }
  return parsed.data;
}

export async function writeJson(path: string, value: object): Promise<void> {
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  const temporary = `${path}.${randomUUID()}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { flag: "wx", mode: 0o600 });
  await rename(temporary, path);
}

export async function tree(root: string, directory: string): Promise<readonly string[]> {
  const path = await safePath(root, directory);
  const entries = await readdir(path, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name, "en"))) {
    const name = `${directory}/${entry.name}`;
    if (entry.isSymbolicLink())
      throw new CoreError("SYMLINK_REJECTED", "Bundled resources cannot contain symbolic links");
    if (entry.isDirectory()) files.push(...(await tree(root, name)));
    else if (entry.isFile()) files.push(name);
    else throw new CoreError("FILE_TYPE_REJECTED", "Only regular bundled files are supported");
  }
  return files;
}
