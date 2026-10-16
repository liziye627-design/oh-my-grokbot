import { createLarkChannel, type LarkChannel, type NormalizedMessage } from "@larksuite/channel";
import { eventSchema, type OutboxItem } from "./contracts.js";
import { GatewayError } from "./errors.js";
import type { Gateway } from "./service.js";

export type GatewayLog = (event: { readonly code: string; readonly taskId?: string }) => void;
export class FeishuBridge {
  readonly channel: LarkChannel;
  constructor(
    readonly gateway: Gateway,
    readonly principalId: string,
    credentials: { readonly appId: string; readonly appSecret: string },
    readonly log: GatewayLog,
  ) {
    const principal = gateway.access.principal(principalId);
    if (principal.role !== "channel" || !principal.chats.length || !principal.senders.length)
      throw new GatewayError(
        "FEISHU_POLICY",
        "Feishu needs a channel principal with chat and sender allowlists",
        400,
      );
    this.channel = createLarkChannel({
      appId: credentials.appId,
      appSecret: credentials.appSecret,
      policy: {
        requireMention: true,
        respondToMentionAll: false,
        dmMode: "disabled",
        groupAllowlist: [...principal.chats],
      },
      safety: { staleMessageWindowMs: 300000, chatQueue: { enabled: true } },
      outbound: { retry: { maxAttempts: 1 } },
      httpTimeoutMs: 15000,
      connectTimeoutMs: 15000,
      logger: {
        debug: () => undefined,
        info: () => undefined,
        warn: () => log({ code: "FEISHU_SDK_WARNING" }),
        error: () => log({ code: "FEISHU_SDK_ERROR" }),
        trace: () => undefined,
      },
    });
    this.channel.on("message", (message) => {
      try {
        const result = this.receive(message);
        log({
          code: result.replayed ? "TASK_REPLAYED" : "TASK_QUEUED_MANUAL_NATIVE",
          taskId: result.record.task.taskId,
        });
      } catch (error) {
        if (!(error instanceof Error)) throw error;
        log({ code: error instanceof GatewayError ? error.code : "FEISHU_EVENT_REJECTED" });
      }
    });
    this.channel.on("error", () => log({ code: "FEISHU_CHANNEL_ERROR" }));
  }
  receive(message: NormalizedMessage) {
    if (
      message.chatType !== "group" ||
      message.senderIsBot ||
      message.mentionAll ||
      message.senderType === "bot"
    )
      throw new GatewayError(
        "CHANNEL_POLICY",
        "Only explicit user mentions in permitted groups are accepted",
        403,
      );
    return this.gateway.receive(
      this.gateway.access.principal(this.principalId),
      eventSchema.parse({
        messageId: message.messageId,
        chatId: message.chatId,
        senderId: message.senderId,
        content: message.content,
        mentionedBot: message.mentionedBot,
      }),
    );
  }
  async send(item: OutboxItem): Promise<string> {
    const principal = this.gateway.access.principal(this.principalId);
    if (
      item.tenantId !== principal.tenantId ||
      item.origin.channel !== "feishu" ||
      !principal.chats.includes(item.origin.chatId)
    )
      throw new GatewayError("DELIVERY_SCOPE", "Reply is outside this Feishu channel scope", 403);
    const receipt = await this.channel.send(
      item.origin.chatId,
      { text: item.text },
      { replyTo: item.origin.messageId },
    );
    return receipt.messageId;
  }
  async connect(): Promise<void> {
    await this.channel.connect();
  }
  async close(): Promise<void> {
    await this.channel.disconnect();
  }
}
