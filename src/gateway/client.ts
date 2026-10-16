import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";

export function statelessResultTransport(url: URL, credential: string): Transport {
  const source = new StreamableHTTPClientTransport(url, {
    requestInit: { headers: { Authorization: `Bearer ${credential}` } },
  });
  // SDK 1.x exposes an optional session getter incompatibly with exact optional
  // properties. Stateless clients need callbacks and protocol negotiation only.
  const transport: Transport = {
    start: () => source.start(),
    close: () => source.close(),
    send: (message, options) => source.send(message, options),
    setProtocolVersion: (version) => source.setProtocolVersion(version),
  };
  source.onmessage = (message) => transport.onmessage?.(message);
  source.onerror = (error) => transport.onerror?.(error);
  source.onclose = () => transport.onclose?.();
  return transport;
}
