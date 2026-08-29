#!/usr/bin/env node

import { readFile } from "node:fs/promises";

const readJson = async (relativePath) => JSON.parse(
  await readFile(new URL(`../${relativePath}`, import.meta.url), "utf8"),
);
const readText = (relativePath) => readFile(
  new URL(`../${relativePath}`, import.meta.url),
  "utf8",
);

const rootPackage = await readJson("package.json");
const rootLock = await readJson("package-lock.json");
const sdkPackage = await readJson("packages/sdk/package.json");
const demoPackage = await readJson("demo/package.json");
const demoLock = await readJson("demo/package-lock.json");
const version = rootPackage.version;

const versionSurfaces = new Map([
  ["root package", rootPackage.version],
  ["root lock", rootLock.version],
  ["root lock workspace", rootLock.packages[""].version],
  ["SDK package", sdkPackage.version],
  ["root lock SDK workspace", rootLock.packages["packages/sdk"].version],
  ["demo package", demoPackage.version],
  ["demo lock", demoLock.version],
  ["demo lock workspace", demoLock.packages[""].version],
  ["demo lock SDK workspace", demoLock.packages["../packages/sdk"].version],
]);

const failures = [];
for (const [label, actual] of versionSurfaces) {
  if (actual !== version) failures.push(`${label}: expected ${version}, found ${actual}`);
}

const expectedReferences = new Map([
  ["CHANGELOG.md", `## ${version} -`],
  ["README.md", `/releases/tag/v${version}`],
  ["demo/README.md", `/releases/tag/v${version}`],
  ["docs/pilot-technical-flow.md", `avax-impact-sdk-${version}.tgz`],
  ["docs/release-runbook.md", `Current distributable release: [\`v${version}\`]`],
]);

for (const [path, expected] of expectedReferences) {
  const contents = await readText(path);
  if (!contents.includes(expected)) failures.push(`${path}: missing ${expected}`);
}

if (failures.length > 0) {
  console.error(`Version verification failed (${failures.length} issue(s)):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Version verification passed: every current project surface uses ${version}.`);
}
