import { afterEach, describe, expect, it, vi } from "vitest";
import { readJson } from "../src/connectors/transport.js";

const request = {
  url: new URL("https://api.x.com/2/tweets/search/recent?query=api"),
  headers: { Authorization: "Bearer test-secret" },
};
afterEach(() => vi.restoreAllMocks());
describe("Credential-constrained GET transport", () => {
  it("allows only GET with redirects disabled and a finite timeout", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response('{"data":[]}', { status: 200 }));
    expect(await readJson(request)).toEqual({ data: [] });
    expect(fetchSpy).toHaveBeenCalledWith(
      request.url,
      expect.objectContaining({
        method: "GET",
        redirect: "error",
        signal: expect.any(AbortSignal),
      }),
    );
    expect(fetchSpy).toHaveBeenCalledOnce();
  });
  it("rejects nonallowlisted hosts and write endpoints before sending credentials", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    for (const url of [
      "https://example.com/2/tweets/search/recent",
      "https://api.x.com/2/tweets",
      "https://user:pass@api.x.com/2/tweets/search/recent",
    ]) {
      await expect(readJson({ ...request, url: new URL(url) })).rejects.toMatchObject({
        code: "CONNECTOR_ENDPOINT",
      });
    }
    expect(fetchSpy).not.toHaveBeenCalled();
  });
  it.each([
    [401, "CONNECTOR_AUTH"],
    [403, "CONNECTOR_FORBIDDEN"],
    [429, "CONNECTOR_RATE_LIMIT"],
    [500, "CONNECTOR_HTTP"],
  ])("sanitizes HTTP %i without retry", async (status, code) => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response("private raw failure test-secret", { status: Number(status) }),
      );
    await expect(readJson(request)).rejects.toMatchObject({ code });
    expect(fetchSpy).toHaveBeenCalledOnce();
  });
  it("withholds transport exceptions and refuses oversized responses", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValueOnce(new Error("test-secret private URL"));
    await expect(readJson(request)).rejects.toMatchObject({
      code: "CONNECTOR_TRANSPORT",
      message: expect.not.stringContaining("test-secret"),
    });
    fetchSpy.mockResolvedValueOnce(new Response("x".repeat(2_000_001)));
    await expect(readJson(request)).rejects.toMatchObject({ code: "CONNECTOR_RESPONSE" });
  });
});
