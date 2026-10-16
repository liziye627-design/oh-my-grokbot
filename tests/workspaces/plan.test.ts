import { expect, it } from "vitest";
import { principalSchema } from "../../src/gateway/contracts.js";
import { loadValidatedIndustryManifests } from "../../src/industry/catalog.js";
import { workspaceSchema } from "../../src/workspaces/contracts.js";
import { prepareWorkspacePlan } from "../../src/workspaces/plan.js";
import { validateWorkspaces } from "../../src/workspaces/validation.js";

const manifests = await loadValidatedIndustryManifests("registry/catalog.json");
const manifest = manifests.find((item) => item.pack.metadata.name === "oh-my-app-studio");
if (!manifest) throw new Error("Fixture missing");
const principals = [
  principalSchema.parse({
    id: "owner",
    tenantId: "studio",
    role: "operator",
    tokenEnv: "OWNER_TOKEN",
  }),
  principalSchema.parse({
    id: "reviewer",
    tenantId: "studio",
    role: "verifier",
    tokenEnv: "REVIEWER_TOKEN",
  }),
  principalSchema.parse({
    id: "channel",
    tenantId: "studio",
    role: "channel",
    tokenEnv: "CHANNEL_TOKEN",
    chats: ["chat-1"],
    senders: ["sender-1"],
  }),
];
const workspace = workspaceSchema.parse({
  id: "app-group",
  name: "App Studio",
  tenantId: "studio",
  pack: manifest.pack.metadata.name,
  workflows: ["build-feature"],
  coordinatorRole: "product-analyst",
  bindings: manifest.pack.spec.agents.map((role) => ({ role: role.id, botName: role.id })),
  members: { operators: ["owner"], verifiers: ["reviewer"] },
  feishu: {
    principalId: "channel",
    chatId: "chat-1",
    senders: [{ senderId: "sender-1", principalId: "owner" }],
  },
});
it("accepts a fully bound group with authorized members", () => {
  // Given matching roles and scoped principals; When validating; Then configuration is accepted.
  expect(() => validateWorkspaces([workspace], principals, manifests)).not.toThrow();
});
it.each([
  "cross-tenant",
  "unlisted-member",
  "missing-role",
  "wrong-workflow",
  "single-bot",
  "duplicate-tenant",
  "unapproved-sender",
])("rejects %s before workspace activation", (failure) => {
  // Given a workspace with one invalid binding or membership.
  const changed = workspaceSchema.parse({
    ...workspace,
    ...(failure === "missing-role" ? { bindings: workspace.bindings.slice(1) } : {}),
    ...(failure === "wrong-workflow" ? { workflows: ["unknown"] } : {}),
    ...(failure === "single-bot"
      ? { bindings: workspace.bindings.map((binding) => ({ ...binding, botName: "one-bot" })) }
      : {}),
    ...(failure === "unapproved-sender"
      ? {
          feishu: {
            ...workspace.feishu,
            senders: [{ senderId: "intruder", principalId: "owner" }],
          },
        }
      : {}),
  });
  const accounts =
    failure === "cross-tenant"
      ? principals.map((principal) =>
          principal.id === "owner" ? { ...principal, tenantId: "elsewhere" } : principal,
        )
      : failure === "unlisted-member"
        ? [
            ...principals,
            principalSchema.parse({
              id: "outsider",
              tenantId: "studio",
              role: "operator",
              tokenEnv: "OUTSIDER_TOKEN",
            }),
          ]
        : principals;
  const groups =
    failure === "duplicate-tenant" ? [changed, { ...changed, id: "second-group" }] : [changed];
  // When validating; Then no invalid mapping reaches live task intake.
  expect(() => validateWorkspaces(groups, accounts, manifests)).toThrow();
});

it("prepares a reviewable roster without activating native groups", () => {
  // Given the validated workspace; When creating its local setup plan.
  const plan = prepareWorkspacePlan(workspace, manifest);
  // Then the machine-readable contract retains all role bindings and requires activation.
  expect(plan.status).toBe("needs_human");
  expect(plan.dispatch).toBe("manual_native");
  expect(plan.group.botCount).toBe(5);
  expect(plan.group.coordinatorBot).toBe("product-analyst");
  expect(plan.bots.flatMap((bot) => bot.roles.map((role) => role.id)).sort()).toEqual(
    manifest.pack.spec.agents.map((role) => role.id).sort(),
  );
  expect(plan.workflows.map((workflow) => workflow.id)).toEqual(["build-feature"]);
});
it("rejects credential fields at the workspace schema boundary", () => {
  // Given workspace data carrying an unsolicited token; When parsed; Then rejected.
  expect(workspaceSchema.safeParse({ ...workspace, token: "do-not-store" }).success).toBe(false);
  expect(
    workspaceSchema.safeParse({
      ...workspace,
      bindings: workspace.bindings.map((binding) => ({
        ...binding,
        templateUrl: "https://user:password@example.com/template",
      })),
    }).success,
  ).toBe(false);
});
it("rejects an operator masquerading as the independent verifier", () => {
  // Given a verifier membership pointing at the operator; When checked; Then roles cannot be conflated.
  const invalid = workspaceSchema.parse({
    ...workspace,
    members: { operators: ["owner"], verifiers: ["owner"] },
  });
  expect(() => validateWorkspaces([invalid], principals, manifests)).toThrow(
    expect.objectContaining({ code: "WORKSPACE_MEMBER_INVALID" }),
  );
});
it("rejects duplicate role bindings even when the roster size matches", () => {
  // Given repeated role ids at the expected count; When checked; Then each employee still requires its own binding.
  const invalid = workspaceSchema.parse({
    ...workspace,
    bindings: workspace.bindings.map((binding) => ({ ...binding, role: "product-analyst" })),
  });
  expect(() => validateWorkspaces([invalid], principals, manifests)).toThrow(
    expect.objectContaining({ code: "WORKSPACE_DUPLICATE" }),
  );
});
it("rejects duplicate sender mapping before Feishu identity translation", () => {
  // Given two entries for the same sender; When checked; Then ambiguous identity mapping is rejected.
  const invalid = workspaceSchema.parse({
    ...workspace,
    feishu: {
      ...workspace.feishu,
      senders: [
        { senderId: "sender-1", principalId: "owner" },
        { senderId: "sender-1", principalId: "owner" },
      ],
    },
  });
  expect(() => validateWorkspaces([invalid], principals, manifests)).toThrow(
    expect.objectContaining({ code: "WORKSPACE_DUPLICATE" }),
  );
});
