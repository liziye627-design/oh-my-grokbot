import { z } from "zod";
import type { IndustryManifest } from "../industry/contracts.js";
import type { IndustryPlanInput } from "../industry/plan.js";
import type { Workspace } from "../workspaces/contracts.js";
import { WorkspaceRouter } from "../workspaces/router.js";
import { validateWorkspaces } from "../workspaces/validation.js";
import { Approvals } from "./approvals.js";
import { Artifacts } from "./artifacts.js";
import { Access } from "./auth.js";
import {
  type ChannelEvent,
  type CreateTask,
  createTaskSchema,
  type Identity,
  type Principal,
} from "./contracts.js";
import { Ledger } from "./database.js";
import { GatewayError } from "./errors.js";
import { Lifecycle } from "./lifecycle.js";
import { Outbox } from "./outbox.js";
import { requireRole, Tasks } from "./tasks.js";

export type GatewayOptions = {
  readonly database: string;
  readonly artifacts: string;
  readonly principals: readonly Principal[];
  readonly env: Readonly<Record<string, string | undefined>>;
  readonly now?: () => number;
  readonly workspaces?: readonly Workspace[];
  readonly industries?: readonly IndustryManifest[];
};
export class Gateway {
  private closed = false;
  readonly ledger: Ledger;
  readonly tasks: Tasks;
  readonly access: Access;
  readonly artifacts: Artifacts;
  readonly approvals: Approvals;
  readonly outbox: Outbox;
  readonly lifecycle: Lifecycle;
  readonly workspaces: WorkspaceRouter;
  constructor(options: GatewayOptions) {
    validateWorkspaces(options.workspaces ?? [], options.principals, options.industries ?? []);
    this.workspaces = new WorkspaceRouter(options.workspaces ?? [], options.industries ?? []);
    this.ledger = new Ledger(options.database);
    this.tasks = new Tasks(this.ledger, options.now ?? Date.now);
    try {
      this.access = new Access(this.ledger, options.principals, options.env, this.tasks.now);
    } catch (error) {
      this.ledger.close();
      throw error;
    }
    this.artifacts = new Artifacts(this.tasks, options.artifacts);
    this.approvals = new Approvals(this.tasks);
    this.outbox = new Outbox(this.ledger);
    this.lifecycle = new Lifecycle(this.tasks, this.artifacts, this.outbox);
  }
  create(identity: Identity, input: CreateTask) {
    requireRole(identity, ["operator"]);
    if (this.workspaces.configured(identity.tenantId))
      throw new GatewayError(
        "WORKSPACE_ROUTE_REQUIRED",
        "Use the authorized workspace workflow task endpoint",
        403,
      );
    return this.tasks.create(identity, input, {
      channel: "manual",
      chatId: "local",
      messageId: input.eventId,
    });
  }
  createWorkspace(
    identity: Identity,
    workspaceId: string,
    workflowId: string,
    input: IndustryPlanInput,
  ) {
    const { workspace, handoff } = this.workspaces.prepare(
      identity,
      workspaceId,
      workflowId,
      input,
    );
    const result = this.tasks.create(identity, handoff.taskRequest, {
      channel: "manual",
      chatId: workspace.id,
      messageId: handoff.taskRequest.eventId,
    });
    return { ...result, handoff };
  }
  receive(identity: Identity, event: ChannelEvent) {
    requireRole(identity, ["channel"]);
    const policy = this.access.principal(identity.id);
    if (
      !policy.chats.includes(event.chatId) ||
      !policy.senders.includes(event.senderId) ||
      !event.mentionedBot
    )
      throw new GatewayError(
        "CHANNEL_POLICY",
        "Event is outside the authorized chat, sender or mention policy",
        403,
      );
    const routed = this.workspaces.receive(identity, event);
    if (routed)
      return this.tasks.create(
        identity,
        routed.handoff.taskRequest,
        { channel: "feishu", chatId: event.chatId, messageId: event.messageId },
        routed.requestedBy,
      );
    const input = createTaskSchema.parse({ eventId: event.messageId, objective: event.content });
    return this.tasks.create(
      identity,
      input,
      { channel: "feishu", chatId: event.chatId, messageId: event.messageId },
      event.senderId,
    );
  }
  progress(identity: Identity, taskId: string, runId: string, message: string) {
    const record = this.tasks.runner(identity, taskId, runId);
    if (record.task.state !== "running")
      throw new GatewayError("STATE_CONFLICT", "Progress requires a running task");
    this.ledger.run(
      "INSERT INTO reports(tenant,task,run,actor,kind,message,at) VALUES(?,?,?,?,?,?,?)",
      identity.tenantId,
      taskId,
      runId,
      identity.id,
      "progress",
      message,
      this.tasks.now(),
    );
    return { taskId, runId, state: record.task.state };
  }
  reports(identity: Identity, taskId: string) {
    this.tasks.get(identity, taskId);
    return this.ledger
      .all(
        "SELECT actor,kind,message,at FROM reports WHERE tenant=? AND task=? ORDER BY seq LIMIT 1000",
        identity.tenantId,
        taskId,
      )
      .map((row) =>
        z
          .object({ actor: z.string(), kind: z.string(), message: z.string(), at: z.number() })
          .parse(row),
      );
  }
  close(): void {
    if (this.closed) return;
    this.closed = true;
    this.ledger.close();
  }
}
