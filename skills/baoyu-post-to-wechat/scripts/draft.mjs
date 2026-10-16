import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { loadWechatExtendConfig, resolveAccount } from "../vendor/scripts/wechat-extend-config.ts";

function fail(code) {
  console.log(JSON.stringify({ code, externalWritesPerformed: false }));
  process.exit(1);
}

let options;
try {
  options = parseArgs({
    strict: true,
    allowPositionals: true,
    options: {
      account: { type: "string" },
      "expected-app-id": { type: "string" },
      "submit-approved": { type: "boolean", default: false },
      title: { type: "string" },
      author: { type: "string" },
      cover: { type: "string" },
      help: { type: "boolean", default: false },
    },
  });
} catch {
  fail("ARGUMENTS_INVALID");
}
if (options.values.help) {
  console.log(
    "bun --no-install scripts/draft.mjs --account ALIAS --expected-app-id APP_ID [ARTICLE.html --title TITLE --author AUTHOR --cover COVER --submit-approved]",
  );
  process.exit(0);
}
const alias = options.values.account;
const expected = options.values["expected-app-id"];
if (!alias || !/^[a-z][a-z0-9-]*$/.test(alias) || !expected) fail("ACCOUNT_REQUIRED");
const config = loadWechatExtendConfig();
if (config.accounts?.filter((item) => item.alias === alias).length !== 1) fail("ACCOUNT_NOT_FOUND");
const account = resolveAccount(config, alias);
if (account.default_publish_method !== "api") fail("TRANSPORT_BLOCKED");
// Require a complete account-specific environment pair. No generic/file credential fallback.
const prefix = `WECHAT_${alias.toUpperCase().replaceAll("-", "_")}_`;
const appId = process.env[`${prefix}APP_ID`]?.trim();
const appSecret = process.env[`${prefix}APP_SECRET`]?.trim();
if (!appId || !appSecret) fail("ACCOUNT_CREDENTIALS_MISSING");
if (appId !== expected) fail("ACCOUNT_MISMATCH");
if (account.app_id || account.app_secret) fail("CONFIG_CREDENTIALS_BLOCKED");
if (!options.values["submit-approved"]) {
  console.log(
    JSON.stringify({
      code: "READY_FOR_REVIEW",
      account: alias,
      transport: "api",
      externalWritesPerformed: false,
    }),
  );
  process.exit(0);
}
// This switch records caller intent; the host must first obtain scope-bound user approval.
const [article] = options.positionals;
const { title, author, cover } = options.values;
if (options.positionals.length !== 1 || !article || !title || !author || !cover)
  fail("PAYLOAD_INCOMPLETE");
if (!article.toLowerCase().endsWith(".html")) fail("RENDERED_HTML_REQUIRED");
// Isolate the upstream resolver from mutable user config and generic credentials.
const workspace = mkdtempSync(join(tmpdir(), "ohmy-wechat-submit-"));
try {
  const configDir = join(workspace, ".baoyu-skills", "baoyu-post-to-wechat");
  mkdirSync(configDir, { recursive: true });
  writeFileSync(
    join(configDir, "EXTEND.md"),
    [
      "default_publish_method: api",
      "accounts:",
      "  - alias: " + alias,
      "    name: approved-account",
      "",
    ].join(String.fromCharCode(10)),
  );
  const env = {
    ...process.env,
    HOME: workspace,
    USERPROFILE: workspace,
    XDG_CONFIG_HOME: workspace,
  };
  for (const key of Object.keys(env)) if (key.startsWith("WECHAT_")) delete env[key];
  env[prefix + "APP_ID"] = appId;
  env[prefix + "APP_SECRET"] = appSecret;
  const child = spawnSync(
    process.execPath,
    [
      fileURLToPath(new URL("../vendor/scripts/wechat-api.ts", import.meta.url)),
      resolve(article),
      "--account",
      alias,
      "--theme",
      "default",
      "--title",
      title,
      "--author",
      author,
      "--cover",
      resolve(cover),
    ],
    { cwd: workspace, env, stdio: "inherit", windowsHide: true },
  );
  process.exitCode = child.status ?? 1;
} finally {
  rmSync(workspace, { recursive: true, force: true });
}
