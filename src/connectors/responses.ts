import { z } from "zod";
import type { SocialItem, SocialPlatform } from "../contracts/social.js";
import { CoreError } from "../errors.js";

const timestamp = z.iso.datetime({ offset: true });
const webUrl = z.url({ protocol: /^https$/ });
const xResponse = z.object({
  data: z
    .array(
      z.object({
        id: z.string().regex(/^\d+$/),
        text: z.string(),
        author_id: z.string().optional(),
        created_at: timestamp.optional(),
      }),
    )
    .default([]),
  meta: z.object({ result_count: z.number().int().min(0), next_token: z.string().optional() }),
  errors: z.array(z.unknown()).optional(),
});
const blueskyResponse = z.object({
  cursor: z.string().optional(),
  posts: z.array(
    z.object({
      uri: z.string().regex(/^at:\/\/[^/]+\/app\.bsky\.feed\.post\/[^/]+$/),
      author: z.object({ handle: z.string() }),
      record: z.object({ text: z.string(), createdAt: timestamp.optional() }),
    }),
  ),
});
const mastodonResponse = z.object({
  statuses: z.array(
    z.object({
      id: z.string(),
      url: webUrl.nullable(),
      uri: webUrl,
      account: z.object({ acct: z.string() }),
      content: z.string(),
      created_at: timestamp,
      visibility: z.enum(["public", "unlisted", "private", "direct"]),
    }),
  ),
});
const youtubeResponse = z.object({
  nextPageToken: z.string().optional(),
  items: z.array(
    z.object({
      id: z.object({ videoId: z.string().regex(/^[A-Za-z0-9_-]+$/) }),
      snippet: z.object({
        title: z.string(),
        description: z.string(),
        channelTitle: z.string(),
        publishedAt: timestamp,
      }),
    }),
  ),
});
export type ParsedPage = {
  readonly items: readonly SocialItem[];
  readonly hasMore: boolean;
  readonly warnings: readonly string[];
};
function parse<S extends z.ZodType>(schema: S, value: unknown): z.output<S> {
  const result = schema.safeParse(value);
  if (!result.success)
    throw new CoreError(
      "CONNECTOR_RESPONSE",
      "Unexpected connector response shape; raw payload withheld",
    );
  return result.data;
}
export function parseSocialPage(
  platform: SocialPlatform,
  value: unknown,
  limit: number,
): ParsedPage {
  switch (platform) {
    case "x": {
      const data = parse(xResponse, value);
      if (data.meta.result_count !== data.data.length)
        throw new CoreError("CONNECTOR_RESPONSE", "X response count does not match its data");
      return {
        items: data.data.map((item) => ({
          id: item.id,
          url: `https://x.com/i/web/status/${item.id}`,
          author: item.author_id ?? "",
          text: item.text,
          contentFormat: "text",
          publishedAt: item.created_at ?? null,
        })),
        hasMore: !!data.meta.next_token,
        warnings: data.errors?.length
          ? ["X returned partial errors; coverage may be incomplete"]
          : [],
      };
    }
    case "bluesky": {
      const data = parse(blueskyResponse, value);
      return {
        items: data.posts.map((item) => {
          const parts = item.uri.split("/");
          return {
            id: item.uri,
            url: `https://bsky.app/profile/${encodeURIComponent(parts[2] ?? "")}/post/${encodeURIComponent(parts[4] ?? "")}`,
            author: item.author.handle,
            text: item.record.text,
            contentFormat: "text",
            publishedAt: item.record.createdAt ?? null,
          };
        }),
        hasMore: !!data.cursor,
        warnings: [],
      };
    }
    case "mastodon": {
      const data = parse(mastodonResponse, value);
      return {
        items: data.statuses
          .filter((item) => item.visibility === "public" || item.visibility === "unlisted")
          .map((item) => ({
            id: item.id,
            url: item.url ?? item.uri,
            author: item.account.acct,
            text: item.content,
            contentFormat: "html",
            publishedAt: item.created_at,
          })),
        hasMore: data.statuses.length >= limit,
        warnings: [
          "Instance-scoped search; status content is untrusted HTML. Render only with a sanitizer.",
        ],
      };
    }
    case "youtube": {
      const data = parse(youtubeResponse, value);
      return {
        items: data.items.map((item) => ({
          id: item.id.videoId,
          url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
          author: item.snippet.channelTitle,
          text: `${item.snippet.title}\n${item.snippet.description}`,
          contentFormat: "text",
          publishedAt: item.snippet.publishedAt,
        })),
        hasMore: !!data.nextPageToken,
        warnings: ["Video metadata only; no transcript or watched-video verification"],
      };
    }
  }
}
