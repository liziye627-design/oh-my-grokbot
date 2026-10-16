import type { Provider } from "../contracts/common.js";
import type { Resolution } from "../registry/resolver.js";

export function nativeGuide(resolution: Resolution, provider: Provider): string {
  const roster = resolution.pack.spec.agents
    .map(
      (agent) =>
        `## ${agent.id}\n\nMission: ${agent.mission}\n\nSkills: ${agent.skills.join(", ")}\n\nExpected outputs:\n${agent.expectedOutputs.map((item) => `- ${item}`).join("\n")}\n`,
    )
    .join("\n");
  return (
    `# ${resolution.pack.metadata.name} · ${provider}\n\n` +
    "Local files are staged only. Native import, authentication, skill visibility and real task execution require separate confirmation.\n\n" +
    "1. Open the native application and create the smallest required Bot roster below, or import a separately reviewed template link.\n" +
    "2. Transfer staged Skills through the host's supported skill/plugin workflow. This CLI does not modify private host settings.\n" +
    "3. Reauthorize connectors on your own account. Do not copy cookies or credentials.\n" +
    "4. Give each Bot a safe one-time task. Check its skill access and actual output.\n" +
    "5. Configure and test Routines only after the one-time task succeeds.\n\n" +
    roster +
    "\n## Policies\n\n" +
    resolution.pack.spec.policies.map((item) => `- ${item}`).join("\n") +
    "\n\n## Integration gates\n\n" +
    "Generic Feishu → Grok Bot triggering is unverified. Grok Automations webhooks are a separate product surface.\n" +
    "Gateway provides Feishu Channel SDK integration and Result MCP separately; installing this pack does not start services or activate native Bots. Guardian remains pending.\n" +
    "Bots on one Grok Bot account share files, sessions and credentials. Role descriptions are not security isolation.\n\n" +
    "Sources: https://docs.x.ai/grok-bot/bots and https://docs.x.ai/grok-bot/skills-routines-and-automations\n"
  );
}
