import { readFile } from "node:fs/promises";
import { parse, YAMLParseError } from "yaml";
import { z } from "zod";
import { CoreError } from "../errors.js";

const frontmatter = z.object({
  name: z
    .string()
    .max(64)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().min(1).max(1024),
  license: z.string().optional(),
  compatibility: z.string().max(500).optional(),
  metadata: z.record(z.string(), z.string()).optional(),
  "allowed-tools": z.string().optional(),
});

export async function validateSkill(path: string, expectedName: string): Promise<void> {
  const text = await readFile(path, "utf8");
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]+)$/.exec(text);
  if (!match?.[1] || !match[2]?.trim())
    throw new CoreError("SKILL_INVALID", `Missing frontmatter or instructions: ${expectedName}`);
  try {
    const parsed = frontmatter.safeParse(parse(match[1], { maxAliasCount: 0, uniqueKeys: true }));
    if (!parsed.success || parsed.data.name !== expectedName)
      throw new CoreError("SKILL_INVALID", `Invalid Skill metadata: ${expectedName}`);
  } catch (error) {
    if (error instanceof YAMLParseError || error instanceof ReferenceError)
      throw new CoreError("SKILL_INVALID", `Invalid Skill frontmatter: ${expectedName}`);
    throw error;
  }
}
