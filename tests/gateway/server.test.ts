import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ky from "ky";
import { expect, it } from "vitest";
import { gatewayConfigSchema } from "../../src/gateway/config.js";
import { startGateway } from "../../src/gateway/server.js";
import { principals, token } from "./helpers.js";

it("binds loopback, rejects a competing server and releases its owned lock on close", async () => {
  const root = await mkdtemp(join(tmpdir(), "ohmy-gateway-server-"));
  const config = gatewayConfigSchema.parse({ schemaVersion: "0.1", port: 0, principals });
  const env = {
    OWNER: token,
    REVIEWER: "v".repeat(40),
    BETA: "b".repeat(40),
    CHANNEL: "c".repeat(40),
  };
  const service = await startGateway(root, config, env, () => undefined);
  try {
    const address = service.server.address();
    if (!address || typeof address === "string") throw new Error("Missing TCP address");
    expect(address.address).toBe("127.0.0.1");
    expect(await ky.get(`http://127.0.0.1:${address.port}/health`).json()).toMatchObject({
      status: "ok",
      nativeTrigger: "manual_unverified",
    });
    await expect(startGateway(root, config, env, () => undefined)).rejects.toMatchObject({
      code: "GATEWAY_LOCKED",
    });
  } finally {
    await service.close();
    await service.close();
  }
  const restarted = await startGateway(root, config, env, () => undefined);
  await restarted.close();
  await rm(root, { recursive: true, force: true });
});

it("releases the owned lock even if HTTP shutdown reports an error", async () => {
  const root = await mkdtemp(join(tmpdir(), "ohmy-gateway-server-"));
  const config = gatewayConfigSchema.parse({ schemaVersion: "0.1", port: 0, principals });
  const env = {
    OWNER: token,
    REVIEWER: "v".repeat(40),
    BETA: "b".repeat(40),
    CHANNEL: "c".repeat(40),
  };
  const service = await startGateway(root, config, env, () => undefined);
  await new Promise<void>((resolve, reject) =>
    service.server.close((error) => (error ? reject(error) : resolve())),
  );
  await expect(service.close()).rejects.toMatchObject({ code: "ERR_SERVER_NOT_RUNNING" });
  const restarted = await startGateway(root, config, env, () => undefined);
  await restarted.close();
  await rm(root, { recursive: true, force: true });
});
