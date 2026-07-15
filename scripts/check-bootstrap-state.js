#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = path.resolve(process.argv[2] || process.cwd());

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

function readJson(rel) {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
  } catch {
    return null;
  }
}

function listJson(rel) {
  const dir = path.join(root, rel);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((file) => file.endsWith(".json") && file !== "index.json");
}

const failures = [];

if (!exists("AGENTS.md")) {
  failures.push("missing AGENTS.md project entrypoint");
} else {
  const entry = fs.readFileSync(path.join(root, "AGENTS.md"), "utf8");
  if (!entry.includes("codex-skills/skills/workflow-router/SKILL.md")) {
    failures.push("AGENTS.md does not require workflow-router as the first task read");
  }
}

if (!exists("docs/agent-system/bootstrap-state.json")) {
  failures.push("missing docs/agent-system/bootstrap-state.json");
}

const researchTasks = readJson("docs/agent-system/research-workspace/research-tasks.json");
if (!researchTasks) {
  failures.push("missing docs/agent-system/research-workspace/research-tasks.json");
} else {
  const unfinished = (researchTasks.tasks || []).filter((task) => task.status !== "complete" && task.status !== "not-applicable");
  if (unfinished.length) failures.push(`research tasks not complete: ${unfinished.map((task) => task.id).join(", ")}`);
}

const inputFiles = listJson("docs/agent-system/skill-inputs");
if (!inputFiles.length) {
  failures.push("missing docs/agent-system/skill-inputs/*.json");
}

for (const file of inputFiles) {
  const rel = `docs/agent-system/skill-inputs/${file}`;
  const input = readJson(rel);
  if (!input) {
    failures.push(`${rel}: invalid json`);
    continue;
  }
  if (input.status !== "ready") failures.push(`${rel}: status is not ready`);
  if (input.schemaVersion !== 2) failures.push(`${rel}: schemaVersion is not 2`);
  if (!input.profileId || !input.profileTitle) failures.push(`${rel}: profileId/profileTitle missing`);
  if (input.seedExtractionStatus !== "extracted") failures.push(`${rel}: seedExtractionStatus is not extracted`);
  if (!input.seedExtractionFile || !exists(input.seedExtractionFile)) failures.push(`${rel}: missing seedExtractionFile`);
  const typedArrays = {
    seedExtractions: ["seedId", "sourcePath", "sectionsUsed", "rulesTaken", "rulesRejected", "projectAdaptation", "extractedSections"],
    profileRoles: ["id", "title", "purpose", "seedHints", "projectEvidence"],
    ragRoutes: ["label", "path", "when"],
    projectHooks: ["name", "paths", "why"],
    criticalFlows: ["name", "entry", "chain", "risk"],
    localRisks: ["id", "title", "severity", "evidence", "action"],
    workflowSteps: ["step", "action", "evidence", "output"],
    layerChecks: ["layer", "check", "evidence", "verification"],
    gates: ["gate", "trigger", "action"],
    stopConditions: ["condition", "why", "nextAction"],
    resultFormat: ["field", "content"],
  };
  for (const [key, fields] of Object.entries(typedArrays)) {
    if (!Array.isArray(input[key]) || input[key].length === 0) {
      failures.push(`${rel}: ${key} is empty`);
      continue;
    }
    input[key].forEach((item, index) => {
      const ok = item && typeof item === "object" && !Array.isArray(item)
        && fields.every((field) => {
          const value = item[field];
          return Array.isArray(value) ? value.length > 0 : String(value || "").trim().length > 0;
        });
      if (!ok) failures.push(`${rel}: ${key}[${index}] is not a complete v2 object`);
    });
  }
  const skill = input.skillName || file.replace(/\.json$/, "");
  if (!exists(`codex-skills/skills/${skill}/SKILL.md`)) failures.push(`missing rendered skill for ${skill}`);
  if (!exists(`docs/agent-system/skill-assembly/${skill}.md`)) failures.push(`missing rendered assembly sheet for ${skill}`);
  const assemblyRel = `docs/agent-system/skill-assembly/${skill}.md`;
  if (exists(assemblyRel)) {
    const assemblyText = fs.readFileSync(path.join(root, assemblyRel), "utf8");
    if (/Final text for SKILL\.md:\s*\n\s*```markdown\s*\nНе заполнено\s*\n```/m.test(assemblyText)) {
      failures.push(`${assemblyRel}: contains empty Section Render final text`);
    }
  }
}

const requiredDocs = [
  "docs/agent-system/full-project-research-report.md",
  "docs/agent-system/research-evidence-pack.md",
  "docs/agent-system/knowledge-base.md",
  "docs/agent-system/knowledge-index.md",
  "docs/agent-system/risk-register.md",
  "docs/agent-system/refactor-plan.md",
  "docs/agent-system/bootstrap-quality-report.md",
];

for (const rel of requiredDocs) {
  if (!exists(rel)) failures.push(`missing ${rel}`);
}

if (failures.length) {
  console.error("Bootstrap build pipeline is incomplete:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Bootstrap build pipeline state passed.");
