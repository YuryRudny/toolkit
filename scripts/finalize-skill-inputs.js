#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = path.resolve(process.argv[2] || process.cwd());
const dir = path.join(root, "docs", "agent-system", "skill-inputs");
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
  if (input.seedExtractionStatus !== "extracted") failures.push(`${name}: seed extraction is not complete`);
  for (const key of requiredArrays) {
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
  if (!(input.projectHooks || []).every((item) => (item.paths || []).every((value) => /^repo:\/\//.test(value)))) {
    failures.push(`${name}: project hooks must use logical repo:// paths`);
  }
  if (!failures.some((failure) => failure.startsWith(`${name}:`))) {
    input.status = "ready";
    fs.writeFileSync(file, `${JSON.stringify(input, null, 2)}\n`);
  }
}

if (failures.length) {
  console.error("Skill inputs are not ready:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Skill inputs finalized: all structured project evidence passed.");
