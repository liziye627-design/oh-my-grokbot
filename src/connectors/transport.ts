import { CoreError } from "../errors.js";

export type ReadRequest = {
  readonly url: URL;
  readonly headers: { readonly Accept?: string; readonly Authorization?: string };
};
export type ReadTransport = (request: ReadRequest) => Promise<unknown>;
const allowedEndpoints = new Set([
  "https://api.x.com/2/tweets/search/recent",
  "https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts",
  "https://mastodon.social/api/v2/search",
  "https://www.googleapis.com/youtube/v3/search",
]);

export const readJson: ReadTransport = async ({ url, headers }) => {
  if (!allowedEndpoints.has(`${url.origin}${url.pathname}`) || url.username || url.password)
    throw new CoreError("CONNECTOR_ENDPOINT", "Connector endpoint is not allowed");
  try {
    const response = await fetch(url, {
      method: "GET",
      headers,
      redirect: "error",
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) {
      await response.body?.cancel();
      const code =
        response.status === 429
          ? "CONNECTOR_RATE_LIMIT"
          : response.status === 401
            ? "CONNECTOR_AUTH"
            : response.status === 403
              ? "CONNECTOR_FORBIDDEN"
              : "CONNECTOR_HTTP";
      throw new CoreError(
        code,
        `Read request returned HTTP ${response.status}; no automatic retry`,
      );
    }
    const chunks: Uint8Array[] = [];
    let bytes = 0;
    if (!response.body) throw new CoreError("CONNECTOR_RESPONSE", "Empty connector response");
    for await (const chunk of response.body) {
      bytes += chunk.byteLength;
      if (bytes > 2_000_000)
        throw new CoreError("CONNECTOR_RESPONSE", "Connector response exceeds size limit");
      chunks.push(chunk);
    }
    const data: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    return data;
  } catch (error) {
    if (error instanceof CoreError) throw error;
    throw new CoreError(
      "CONNECTOR_TRANSPORT",
      "Read request failed; check network, timeout or response format. Credentials and raw errors are withheld.",
    );
  }
};
