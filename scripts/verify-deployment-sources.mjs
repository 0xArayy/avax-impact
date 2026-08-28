#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import {
  createCheckRunner,
  verifyRebuiltRuntimes,
  verifySourceCommit,
  verifySourceTag,
} from "./lib/fuji-verification.mjs";

const deployments = [
  {
    label: "historical schema 0",
    manifest: JSON.parse(await readFile(new URL("../deployments/fuji.json", import.meta.url))),
    temporaryPrefix: "avax-impact-release-schema0-",
  },
  {
    label: "current schema 1",
    manifest: JSON.parse(
      await readFile(new URL("../deployments/fuji-schema1.json", import.meta.url)),
    ),
    temporaryPrefix: "avax-impact-release-schema1-",
  },
];
const { check, failures } = createCheckRunner();

for (const deployment of deployments) {
  await check(`${deployment.label} source commit is available`, async () => {
    verifySourceCommit(deployment.manifest);
  });
  await check(`${deployment.label} source tag is immutable`, async () => {
    verifySourceTag(deployment.manifest);
  });
  await check(`${deployment.label} source reproduces runtime bytecode`, async () => {
    await verifyRebuiltRuntimes(deployment.manifest, deployment.temporaryPrefix);
  });
}

if (failures.length > 0) {
  console.error(`\nDeployment source verification failed (${failures.length} check(s)):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log("\nDeployment source verification passed for schema 0 and schema 1.");
}
