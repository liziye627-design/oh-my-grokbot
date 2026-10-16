import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { expect, it } from "vitest";

it("blocks alias fallback and inherited remote transport before account access", async () => {
  // Given an isolated upstream config and generic credentials that must never be a fallback.
  const workspace = await mkdtemp(join(tmpdir(), "ohmy-account-guard-"));
  const config = join(workspace, ".baoyu-skills/baoyu-post-to-wechat");
  await mkdir(config, { recursive: true });
  const entry = resolve("skills/baoyu-post-to-wechat/scripts/draft.mjs");
  try {
    for (const [method, account, secret, expected] of [
      ["api", "missing", "test-secret", "ACCOUNT_NOT_FOUND"],
      ["api", "editor", "", "ACCOUNT_CREDENTIALS_MISSING"],
      ["remote-api", "editor", "test-secret", "TRANSPORT_BLOCKED"],
      ["api", "editor", "test-secret", "READY_FOR_REVIEW"],
      ["api", "editor", "test-secret", "RENDERED_HTML_REQUIRED"],
    ]) {
      await writeFile(
        join(config, "EXTEND.md"),
        `default_publish_method: ${method}\naccounts:\n  - alias: editor\n    name: test\n`,
      );
      // When the actual installed-style entry checks the chosen account without publishing.
      const child = spawnSync(
        process.execPath,
        [
          "--experimental-strip-types",
          entry,
          "--account",
          account ?? "",
          "--expected-app-id",
          "test-app",
          ...(expected === "RENDERED_HTML_REQUIRED"
            ? [
                "article.md",
                "--title",
                "Title",
                "--author",
                "Author",
                "--cover",
                "cover.png",
                "--submit-approved",
              ]
            : []),
        ],
        {
          cwd: workspace,
          encoding: "utf8",
          timeout: 10000,
          env: {
            ...process.env,
            HOME: workspace,
            USERPROFILE: workspace,
            XDG_CONFIG_HOME: workspace,
            WECHAT_APP_ID: "wrong-default",
            WECHAT_APP_SECRET: "wrong-secret",
            WECHAT_EDITOR_APP_ID: "test-app",
            WECHAT_EDITOR_APP_SECRET: secret ?? "",
          },
        },
      );
      // Then each unsafe state fails closed and the valid state performs no upload.
      expect(child.error).toBeUndefined();
      expect(JSON.parse(child.stdout)).toMatchObject({
        code: expected,
        externalWritesPerformed: false,
      });
      expect(child.stdout).not.toContain("test-secret");
      expect(child.stderr).not.toContain("test-secret");
      expect(child.status).toBe(expected === "READY_FOR_REVIEW" ? 0 : 1);
    }
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
}, 60000);
