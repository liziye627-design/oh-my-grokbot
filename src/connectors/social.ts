import {
  type SocialQuery,
  type SocialResult,
  socialQuerySchema,
  socialResultSchema,
} from "../contracts/social.js";
import { CoreError } from "../errors.js";
import { parseSocialPage } from "./responses.js";
import { type ReadRequest, type ReadTransport, readJson } from "./transport.js";

const endpoints = {
  x: { url: "https://api.x.com/2/tweets/search/recent", credentialEnv: "OHMY_X_BEARER_TOKEN" },
  bluesky: {
    url: "https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts",
    credentialEnv: null,
  },
  mastodon: {
    url: "https://mastodon.social/api/v2/search",
    credentialEnv: "OHMY_MASTODON_ACCESS_TOKEN",
  },
  youtube: {
    url: "https://www.googleapis.com/youtube/v3/search",
    credentialEnv: "OHMY_YOUTUBE_API_KEY",
  },
} as const;

export function describeSocialSearch(input: SocialQuery) {
  const query = socialQuerySchema.parse(input);
  const config = endpoints[query.platform];
  return {
    method: "GET",
    endpoint: config.url,
    credentialEnv: config.credentialEnv,
    query: query.query,
    requestedLimit: query.limit,
    upstreamLimit: query.platform === "x" ? Math.max(10, query.limit) : query.limit,
    maxRequests: 1,
    writesEnabled: false,
  };
}

function requestFor(
  query: SocialQuery,
  env: Readonly<Record<string, string | undefined>>,
): ReadRequest {
  const config = endpoints[query.platform];
  const credential = config.credentialEnv ? env[config.credentialEnv] : undefined;
  if (config.credentialEnv && !credential?.trim())
    throw new CoreError(
      "CONNECTOR_CREDENTIAL_REQUIRED",
      `Provision ${config.credentialEnv} privately before using this connector`,
    );
  const url = new URL(config.url);
  const headers: { Accept: string; Authorization?: string } = { Accept: "application/json" };
  switch (query.platform) {
    case "x":
      headers.Authorization = `Bearer ${credential}`;
      url.searchParams.set("query", query.query);
      url.searchParams.set("max_results", String(Math.max(10, query.limit)));
      url.searchParams.set("post.fields", "created_at,author_id");
      break;
    case "bluesky":
      url.searchParams.set("q", query.query);
      url.searchParams.set("limit", String(query.limit));
      break;
    case "mastodon":
      headers.Authorization = `Bearer ${credential}`;
      url.searchParams.set("q", query.query);
      url.searchParams.set("limit", String(query.limit));
      url.searchParams.set("type", "statuses");
      url.searchParams.set("resolve", "false");
      break;
    case "youtube":
      url.searchParams.set("key", credential ?? "");
      url.searchParams.set("part", "snippet");
      url.searchParams.set("type", "video");
      url.searchParams.set("q", query.query);
      url.searchParams.set("maxResults", String(query.limit));
      break;
  }
  return { url, headers };
}

export async function searchSocial(
  input: SocialQuery,
  dependencies: {
    readonly env?: Readonly<Record<string, string | undefined>>;
    readonly transport?: ReadTransport;
  } = {},
): Promise<SocialResult> {
  const query = socialQuerySchema.parse(input);
  const request = requestFor(query, dependencies.env ?? process.env);
  const page = parseSocialPage(
    query.platform,
    await (dependencies.transport ?? readJson)(request),
    query.limit,
  );
  return socialResultSchema.parse({
    platform: query.platform,
    query: query.query,
    retrievedAt: new Date().toISOString(),
    requests: 1,
    truncated: page.hasMore || page.items.length > query.limit,
    items: page.items.slice(0, query.limit),
    warnings: page.warnings,
  });
}
