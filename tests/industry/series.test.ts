import { access } from "node:fs/promises";
import { expect, it } from "vitest";
import { loadIndustryCatalog, loadIndustryManifests } from "../../src/industry/catalog.js";

const series = [
  "oh-my-app-studio",
  "oh-my-business-operations",
  "oh-my-content-studio",
  "oh-my-core-team",
  "oh-my-design-studio",
  "oh-my-engineering-lab",
  "oh-my-market-desk",
  "oh-my-office-team",
  "oh-my-research-lab",
  "oh-my-reverse-lab",
  "oh-my-sales-team",
  "oh-my-solo-company",
  "oh-my-specialist-lab",
  "oh-my-video-studio",
  "oh-my-wechat",
  "oh-my-x-growth",
] as const;

const referenceOnlySources = [
  "agency-agents",
  "wshobson-agents",
  "crewai-examples",
  "oh-my-openagent",
  "open-deep-research",
  "gpt-researcher",
  "browser-use",
  "openhands-sdk",
  "video-use",
  "remotion",
  "ai-hedge-fund",
  "trading-agents",
  "composio",
  "activepieces",
  "comfyui",
  "wewrite",
  "wechat-article-skills",
  "x-skills",
  "md2wechat-skill",
  "gzh-design-skill",
  "rea",
  "reverse-skill",
  "pentagi",
] as const;

it("installs the employee series from reviewed reference upstreams when licenses stay outside the bundle", async () => {
  // Given the trusted local registry and industry directories.
  const catalog = await loadIndustryCatalog("registry/catalog.json");
  const manifests = await loadIndustryManifests(catalog.root);
  // When the series is loaded, every named team is present and every candidate upstream is reference-only.
  expect(manifests.map((item) => item.pack.metadata.name).sort()).toEqual([...series]);
  for (const id of referenceOnlySources) {
    const source = catalog.data.sources.find((item) => item.id === id);
    expect(source?.redistribution, id).toBe("reference_only");
    expect(source?.verification, id).not.toBe("discovered");
  }
  for (const id of ["ai-hedge-fund", "trading-agents"] as const) {
    const capability = catalog.data.capabilities.find((item) => item.id === id);
    expect(capability?.delivery.mode).toBe("reference");
    expect(capability?.permissions).toEqual(["public-market-read"]);
  }
  for (const id of ["remotion", "comfyui", "video-use", "openhands-sdk"] as const) {
    const capability = catalog.data.capabilities.find((item) => item.id === id);
    expect(capability, id).toBeDefined();
    expect(capability?.delivery.mode, id).toBe("reference");
    expect(capability?.kind, id).not.toBe("skill");
  }
  expect(catalog.data.sources.find((source) => source.id === "baoyu-skills")?.redistribution).toBe(
    "allowed",
  );
  expect(catalog.data.sources.find((source) => source.id === "khazix-skills")?.redistribution).toBe(
    "allowed",
  );
  const content = manifests.find((item) => item.pack.metadata.name === "oh-my-content-studio");
  const piece = content?.workflows.find((workflow) => workflow.id === "produce-piece");
  expect(piece?.approvalRequired).toBe(true);
  expect(piece?.entryRole).toBe("producer");
  expect(piece?.steps.map((step) => step.id)).toEqual([
    "frame",
    "research",
    "voice",
    "outline",
    "draft",
    "adapt",
    "layout",
    "review",
    "handoff",
  ]);
  expect(piece?.steps.find((step) => step.id === "outline")?.dependsOn).toEqual([
    "research",
    "voice",
  ]);
  expect(piece?.steps.find((step) => step.id === "handoff")?.role).toBe("producer");
  expect(piece?.steps.find((step) => step.id === "adapt")?.requiredArtifacts).toEqual([
    "titles.md",
    "thread.md",
    "post-cut.md",
  ]);
  const rea = catalog.data.capabilities.find((item) => item.id === "rea");
  expect(rea?.kind).toBe("mcp");
  expect(rea?.delivery.mode).toBe("reference");
  expect(rea?.permissions).toEqual(["local-artifact-read"]);
  expect(catalog.data.capabilities.find((item) => item.id === "reverse-skill")).toBeUndefined();
  expect(catalog.data.capabilities.find((item) => item.id === "pentagi")).toBeUndefined();
  const reverse = manifests.find((item) => item.pack.metadata.name === "oh-my-reverse-lab");
  expect(reverse?.workflows.map((workflow) => workflow.id)).toEqual([
    "confirm-scope",
    "analyze-artifact",
  ]);
  expect(reverse?.workflows.every((workflow) => workflow.approvalRequired)).toBe(true);
  const market = manifests.find((item) => item.pack.metadata.name === "oh-my-market-desk");
  expect(market?.workflows.map((workflow) => workflow.id)).toEqual([
    "define-universe",
    "write-thesis",
  ]);
  expect(market?.workflows.every((workflow) => workflow.approvalRequired)).toBe(true);
  expect(manifests.reduce((count, manifest) => count + manifest.pack.spec.agents.length, 0)).toBe(
    75,
  );
  expect(manifests.reduce((count, manifest) => count + manifest.workflows.length, 0)).toBe(40);
  for (const manifest of manifests) {
    expect(manifest.pack.spec.agents.length).toBeGreaterThanOrEqual(2);
    expect(manifest.pack.spec.agents.length).toBeLessThanOrEqual(6);
    expect(manifest.workflows.length).toBeGreaterThanOrEqual(1);
    for (const agent of manifest.pack.spec.agents) {
      expect(agent.skills.length).toBeGreaterThan(0);
      for (const skill of agent.skills) {
        const capability = catalog.data.capabilities.find((item) => item.id === skill);
        expect(capability?.kind, `${manifest.pack.metadata.name}:${skill}`).toBe("skill");
      }
      const directory = manifest.pack.metadata.name.replace(/^oh-my-/, "");
      await access(`industries/${directory}/prompts/${agent.id}.md`);
    }
  }
});
