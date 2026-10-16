import { fileURLToPath } from "node:url";
import { verifyProvenance } from "./registry/provenance.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const lock = await verifyProvenance(root, "registry/upstreams.lock.json");
process.stdout.write(
  `${JSON.stringify({ sources: lock.sources.length, adaptations: lock.adaptations.length, status: "passed" })}\n`,
);
