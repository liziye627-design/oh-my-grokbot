import { chmod, type FileHandle, mkdir, open, unlink } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { serve } from "@hono/node-server";
import { loadValidatedIndustryManifests } from "../industry/catalog.js";
import { safePath } from "../io.js";
import { createGatewayApp } from "./app.js";
import type { GatewayConfig } from "./config.js";
import { GatewayError } from "./errors.js";
import { FeishuBridge, type GatewayLog } from "./feishu.js";
import { Gateway } from "./service.js";

export async function startGateway(
  workspace: string,
  config: GatewayConfig,
  env: Readonly<Record<string, string | undefined>>,
  log: GatewayLog,
) {
  const root = await safePath(workspace, ".ohmy/gateway");
  await mkdir(root, { recursive: true, mode: 0o700 });
  const lockPath = await safePath(root, "service.lock");
  let lock: FileHandle;
  try {
    lock = await open(lockPath, "wx", 0o600);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "EEXIST")
      throw new GatewayError(
        "GATEWAY_LOCKED",
        "Gateway lock exists; verify its process before recovery",
      );
    throw error;
  }
  let gateway: Gateway | undefined;
  let bridge: FeishuBridge | undefined;
  try {
    await lock.writeFile(JSON.stringify({ pid: process.pid }));
    const database = await safePath(root, "ledger.sqlite");
    const industries = await loadValidatedIndustryManifests(
      fileURLToPath(new URL("../../registry/catalog.json", import.meta.url)),
    );
    gateway = new Gateway({
      database,
      artifacts: await safePath(root, "artifacts"),
      principals: config.principals,
      workspaces: config.workspaces,
      industries,
      env,
    });
    await chmod(database, 0o600);
    gateway.ledger.recoverDeliveries();
    if (config.feishu) {
      const appId = env[config.feishu.appIdEnv],
        appSecret = env[config.feishu.appSecretEnv];
      if (!appId || !appSecret)
        throw new GatewayError(
          "FEISHU_CREDENTIAL_REQUIRED",
          "Provision the configured Feishu credential references",
          400,
        );
      bridge = new FeishuBridge(gateway, config.feishu.principalId, { appId, appSecret }, log);
      await bridge.connect();
    }
    const active = gateway,
      channel = bridge;
    const app = createGatewayApp(
      active,
      channel ? (item) => channel.send(item) : undefined,
      industries,
    );
    const server = serve({ fetch: app.fetch, hostname: config.host, port: config.port });
    await new Promise<void>((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });
    let busy: Promise<void> | null = null;
    const timer = channel
      ? setInterval(() => {
          if (busy) return;
          busy = (async () => {
            for (const owner of config.principals.filter(
              (item) =>
                item.role === "operator" &&
                item.tenantId === active.access.principal(channel.principalId).tenantId,
            ))
              await active.outbox.dispatch(owner, (item) => channel.send(item));
          })()
            .catch((error: unknown) => {
              if (!(error instanceof Error)) throw error;
              log({ code: "OUTBOX_PUMP_FAILED" });
            })
            .finally(() => {
              busy = null;
            });
        }, 2000)
      : undefined;
    let closing: Promise<void> | undefined;
    return {
      server,
      gateway: active,
      close(): Promise<void> {
        closing ??= (async () => {
          if (timer) clearInterval(timer);
          await releaseResources([
            async () => {
              if (busy) await busy;
            },
            () =>
              new Promise<void>((resolve, reject) =>
                server.close((error) => (error ? reject(error) : resolve())),
              ),
            () => channel?.close(),
            () => active.close(),
            () => lock.close(),
            () => unlink(lockPath),
          ]);
        })();
        return closing;
      },
    };
  } catch (error) {
    try {
      await releaseResources([
        () => bridge?.close(),
        () => gateway?.close(),
        () => lock.close(),
        () => unlink(lockPath),
      ]);
    } catch (cleanupError) {
      throw new AggregateError([error, cleanupError], "Gateway startup and cleanup failed");
    }
    throw error;
  }
}

async function releaseResources(actions: readonly (() => void | Promise<void>)[]): Promise<void> {
  const failures: unknown[] = [];
  for (const action of actions) {
    try {
      await action();
    } catch (error) {
      failures.push(error);
    }
  }
  const first = failures[0];
  if (first instanceof Error) throw first;
  if (failures.length) throw new AggregateError(failures, "Gateway cleanup failed");
}
