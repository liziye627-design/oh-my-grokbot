import { afterEach, describe, expect, it, vi } from "vitest";
import { describeSocialSearch, searchSocial } from "../src/connectors/social.js";
import type { ReadTransport } from "../src/connectors/transport.js";
import { connectorSchema } from "../src/contracts/social.js";

const when = "2026-10-14T08:00:00Z";
afterEach(() => vi.restoreAllMocks());
describe("Read-only social connectors", () => {
  it("bounds X requests to one page, sends bearer only to X and normalizes results", async () => {
    const transport = vi.fn<ReadTransport>(async ({ url, headers }) => {
      expect(url.origin).toBe("https://api.x.com");
      expect(url.searchParams.get("query")).toBe("grok & api");
      expect(url.searchParams.get("max_results")).toBe("10");
      expect(headers.Authorization).toBe("Bearer test-secret");
      return {
        data: [{ id: "123", text: "release", author_id: "456", created_at: when }],
        meta: { result_count: 1, next_token: "more" },
      };
    });
    const result = await searchSocial(
      { platform: "x", query: "grok & api", limit: 1 },
      { env: { OHMY_X_BEARER_TOKEN: "test-secret" }, transport },
    );
    expect(transport).toHaveBeenCalledOnce();
    expect(result.items[0]).toMatchObject({
      url: "https://x.com/i/web/status/123",
      author: "456",
      contentFormat: "text",
    });
    expect(result.truncated).toBe(true);
    expect(JSON.stringify(result)).not.toContain("test-secret");
  });
  it("describes X upstream minimum without needing credentials", () => {
    expect(describeSocialSearch({ platform: "x", query: "api", limit: 1 })).toMatchObject({
      upstreamLimit: 10,
      maxRequests: 1,
      writesEnabled: false,
      credentialEnv: "OHMY_X_BEARER_TOKEN",
    });
  });
  it("requires credentials before dispatch and does not expose a write operation", async () => {
    const transport = vi.fn();
    await expect(
      searchSocial({ platform: "x", query: "api", limit: 10 }, { env: {}, transport }),
    ).rejects.toMatchObject({ code: "CONNECTOR_CREDENTIAL_REQUIRED" });
    expect(transport).not.toHaveBeenCalled();
    expect(
      connectorSchema.safeParse({
        platform: "x",
        stage: "read_adapter",
        auth: "bearer",
        readOperations: ["search"],
        writeOperations: ["publish"],
        documentation: "https://docs.x.com",
        limitations: ["pending"],
      }).success,
    ).toBe(false);
  });
  it("uses public Bluesky without tokens and builds a stable post citation", async () => {
    const result = await searchSocial(
      { platform: "bluesky", query: "tools", limit: 10 },
      {
        env: {},
        transport: async (request) => {
          expect(request.url.origin).toBe("https://public.api.bsky.app");
          expect(request.url.searchParams.get("q")).toBe("tools");
          expect(request.headers.Authorization).toBeUndefined();
          return {
            posts: [
              {
                uri: "at://did:plc:example/app.bsky.feed.post/abc",
                author: { handle: "someone.bsky.social" },
                record: { text: "hello", createdAt: when },
              },
            ],
          };
        },
      },
    );
    expect(result.items[0]?.url).toBe("https://bsky.app/profile/did%3Aplc%3Aexample/post/abc");
  });
  it("scopes Mastodon to one instance and excludes nonpublic statuses", async () => {
    const status = {
      id: "1",
      url: "https://mastodon.social/@someone/1",
      uri: "https://mastodon.social/users/someone/statuses/1",
      account: { acct: "someone" },
      content: "<p>hello</p>",
      created_at: when,
    };
    const result = await searchSocial(
      { platform: "mastodon", query: "hello", limit: 10 },
      {
        env: { OHMY_MASTODON_ACCESS_TOKEN: "test-only" },
        transport: async ({ url }) => {
          expect(url.origin).toBe("https://mastodon.social");
          expect(url.searchParams.get("resolve")).toBe("false");
          return {
            statuses: [
              { ...status, visibility: "public" },
              { ...status, id: "2", visibility: "private" },
            ],
          };
        },
      },
    );
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.contentFormat).toBe("html");
  });
  it("normalizes YouTube metadata and withholds the API key", async () => {
    const result = await searchSocial(
      { platform: "youtube", query: "demo", limit: 3 },
      {
        env: { OHMY_YOUTUBE_API_KEY: "test-key" },
        transport: async ({ url }) => {
          expect(url.origin).toBe("https://www.googleapis.com");
          expect(url.searchParams.get("key")).toBe("test-key");
          return {
            items: [
              {
                id: { videoId: "abc_DEF-123" },
                snippet: {
                  title: "Demo",
                  description: "About",
                  channelTitle: "Maker",
                  publishedAt: when,
                },
              },
            ],
          };
        },
      },
    );
    expect(result.items[0]?.url).toBe("https://www.youtube.com/watch?v=abc_DEF-123");
    expect(JSON.stringify(result)).not.toContain("test-key");
  });
  it("rejects malformed success payloads rather than presenting an empty success", async () => {
    await expect(
      searchSocial(
        { platform: "bluesky", query: "api", limit: 1 },
        { transport: async () => ({ error: "bad" }) },
      ),
    ).rejects.toMatchObject({ code: "CONNECTOR_RESPONSE" });
  });
});
