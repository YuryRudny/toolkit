#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { resolveSourcePath } = require("./lib/workspace");
const { resolveInside } = require("./lib/path-safety");
const { hasSectionExemption } = require("./lib/input-contract");

const root = path.resolve(process.argv[2] || process.cwd());
const dir = resolveInside(root, "docs/agent-system/skill-inputs", "skill inputs");
const sidecar = fs.existsSync(path.join(root, "workspace.json"));
const model = JSON.parse(fs.readFileSync(resolveInside(root, "docs/agent-system/project-model.json", "model"), "utf8"));
const ready = [];
const requiredArrays = [
  "seedExtractions", "profileRoles", "ragRoutes", "projectHooks", "criticalFlows",
  "localRisks", "workflowSteps", "layerChecks", "gates", "stopConditions", "resultFormat",
];
const forbidden = /заполнить|уточнить после|R-TO-FILL|sourcePath selected seed/i;
const failures = [];

for (const name of fs.readdirSync(dir).filter((item) => item.endsWith(".json") && item !== "index.json").sort()) {
  const file = path.join(dir, name);
  const input = JSON.parse(fs.readFileSync(file, "utf8"));
  if (input.schemaVersion !== 2) failures.push(`${name}: schemaVersion must be 2`);
  if (input.projectFingerprint !== model.fingerprint) failures.push(`${name}: re-adapt projectFingerprint to the current model before finalizing`);
  if (input.seedExtractionStatus !== "extracted") failures.push(`${name}: seed extraction is not complete`);
  for (const key of requiredArrays) {
    if (hasSectionExemption(root, input, key)) continue;
    if (!Array.isArray(input[key]) || input[key].length === 0) failures.push(`${name}: ${key} is empty`);
  }
  const projectPayload = JSON.stringify({
    projectHooks: input.projectHooks,
    criticalFlows: input.criticalFlows,
    localRisks: input.localRisks,
    workflowSteps: input.workflowSteps,
    layerChecks: input.layerChecks,
    gates: input.gates,
    stopConditions: input.stopConditions,
  });
  if (forbidden.test(projectPayload)) failures.push(`${name}: project payload contains placeholder content`);
  for (const hook of input.projectHooks || []) {
    for (const value of hook.paths || []) {
      try {
        if (sidecar && !value.startsWith("repo://")) throw new Error("sidecar hooks require repo:// paths");
        if (!fs.existsSync(resolveSourcePath(root, value))) throw new Error(`source does not exist: ${value}`);
      } catch (error) { failures.push(`${name}: ${error.message}`); }
    }
  }
  if (!failures.some((failure) => failure.startsWith(`${name}:`))) {
    input.status = "ready";
    ready.push({ file, input });
  }
}

if (failures.length) {
  console.error("Skill inputs are not ready:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Skill inputs finalized: all structured project evidence passed.");
for (const { file, input } of ready) fs.writeFileSync(file, `${JSON.stringify(input, null, 2)}\n`);
