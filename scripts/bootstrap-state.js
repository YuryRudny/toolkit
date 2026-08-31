#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = path.resolve(process.argv[3] || process.argv[2] || process.cwd());
const command = process.argv[2] && !process.argv[2].startsWith(".") && !process.argv[2].startsWith("/") ? process.argv[2] : "status";

const phases = [
  "install-wizard",
  "enterprise-setup",
  "deep-scan-decision",
  "existing-rules-merge",
  "discovery",
  "research-tasks",
  "deep-research",
  "docs-rag",
  "seed-selection",
  "skill-inputs",
  "skill-render",
  "quality-report",
  "validation",
  "repository-hygiene",
  "complete",
];

const statePath = path.join(root, "docs", "agent-system", "bootstrap-state.json");

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function now() {
  return new Date().toISOString();
}

function defaultState() {
  return {
    schemaVersion: 1,
    toolkit: "reusable-agent-system-toolkit",
    currentPhase: "install-wizard",
    completedPhases: [],
    blocked: false,
    blockers: [],
    nextAction: "run install wizard",
    activeTargetSkill: null,
    createdAt: now(),
    updatedAt: now(),
    phases: Object.fromEntries(phases.map((phase) => [phase, { status: "pending", updatedAt: null, notes: [] }])),
  };
}

function readState() {
  if (!fs.existsSync(statePath)) return defaultState();
  return JSON.parse(fs.readFileSync(statePath, "utf8"));
}

function writeState(state) {
  state.updatedAt = now();
  ensureDir(statePath);
  fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`);
}

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

function nonEmpty(rel) {
  try {
    return fs.statSync(path.join(root, rel)).size > 20;
  } catch {
    return false;
  }
}

function phaseFailures(phase) {
  const failures = [];
  const requireFiles = (files) => files.forEach((file) => {
    if (!nonEmpty(file)) failures.push(`missing or empty ${file}`);
  });

  if (phase === "enterprise-setup") {
    requireFiles(["docs/agent-system/enterprise-integrations.md"]);
  }
  if (phase === "deep-scan-decision") {
    const decision = readJson("docs/agent-system/bootstrap-state.json")?.installMode;
    if (!decision || !["full", "degraded"].includes(decision)) {
      failures.push("bootstrap-state.json must contain installMode: full|degraded");
    }
  }
  if (phase === "existing-rules-merge") {
    requireFiles(["docs/agent-system/existing-rules-merge.md", "docs/agent-system/authority-map.json"]);
    const authority = readJson("docs/agent-system/authority-map.json");
    const unresolved = (authority?.conflicts || []).filter((item) => item.status !== "resolved");
    if (unresolved.length) failures.push(`unresolved authority conflicts: ${unresolved.map((item) => item.name || item.type).join(", ")}`);
  }
  if (phase === "discovery") {
    const model = readJson("docs/agent-system/project-model.json");
    if (!model) failures.push("missing docs/agent-system/project-model.json");
    else {
      if (!Array.isArray(model.modules) || model.modules.length === 0) failures.push("project model has no modules");
      if (!model.capabilities || Object.keys(model.capabilities).length === 0) failures.push("project model has no capabilities");
    }
  }
  if (phase === "research-tasks") {
    const tasks = readJson("docs/agent-system/research-workspace/research-tasks.json");
    if (!tasks || !Array.isArray(tasks.tasks) || tasks.tasks.length === 0) failures.push("research task graph is missing or empty");
    requireFiles(["docs/agent-system/research-workspace/research-tasks.md"]);
  }
  if (phase === "deep-research") {
    const tasks = readJson("docs/agent-system/research-workspace/research-tasks.json");
    const unfinished = (tasks?.tasks || []).filter((task) => !["complete", "not-applicable"].includes(task.status));
    if (!tasks) failures.push("research task graph is missing");
    else if (unfinished.length) failures.push(`unfinished research tasks: ${unfinished.map((task) => task.id).join(", ")}`);
    requireFiles([
      "docs/agent-system/research-workspace/evidence-log.md",
      "docs/agent-system/research-workspace/research-notes.md",
      "docs/agent-system/research-workspace/decisions.md",
    ]);
  }
  if (phase === "docs-rag") {
    requireFiles([
      "docs/agent-system/full-project-research-report.md",
      "docs/agent-system/research-evidence-pack.md",
      "docs/agent-system/knowledge-base.md",
      "docs/agent-system/knowledge-index.md",
      "docs/agent-system/project-map.md",
      "docs/agent-system/architecture-map.md",
      "docs/agent-system/risk-register.md",
      "docs/agent-system/refactor-plan.md",
      "docs/agent-system/smoke-checklist.md",
    ]);
  }
  if (phase === "seed-selection") requireFiles(["docs/agent-system/seed-selection.md"]);
  if (phase === "skill-inputs") {
    const index = readJson("docs/agent-system/skill-inputs/index.json");
    if (!index || !Array.isArray(index.targetSkills) || index.targetSkills.length === 0) failures.push("skill input index is missing or empty");
    for (const skill of index?.targetSkills || []) {
      const input = readJson(`docs/agent-system/skill-inputs/${skill}.json`);
      if (!input || input.status !== "ready") failures.push(`${skill} input is not ready`);
    }
  }
  if (phase === "skill-render") {
    const registry = readJson("docs/agent-system/skill-registry.json");
    if (!registry || !Array.isArray(registry.skills) || registry.skills.length === 0) failures.push("skill registry is missing or empty");
    for (const skill of registry?.skills || []) {
      if (skill.status === "active" && !exists(skill.path)) failures.push(`registered skill is missing: ${skill.path}`);
    }
  }
  if (phase === "quality-report") requireFiles(["docs/agent-system/bootstrap-quality-report.md"]);
  if (phase === "validation") {
    const result = readJson("docs/agent-system/validation-result.json");
    if (!result || result.status !== "passed") failures.push("deterministic validation has not produced a passed validation-result.json");
  }
  if (phase === "repository-hygiene") {
    if (exists("workspace.json")) {
      const boundary = readJson("docs/agent-system/source-boundary-result.json");
      if (!boundary || boundary.status !== "passed") failures.push("customer source boundary has not produced a passed source-boundary-result.json");
      if (!exists("bin/agentctl.js")) failures.push("missing bin/agentctl.js workspace runtime");
    } else {
      const ignore = exists(".gitignore") ? fs.readFileSync(path.join(root, ".gitignore"), "utf8") : "";
      if (!/^reusable-agent-system-toolkit\/$/m.test(ignore)) failures.push(".gitignore does not ignore reusable-agent-system-toolkit/");
    }
  }
  if (phase === "complete") {
    const previous = phases.slice(0, -1).filter((item) => item !== "complete");
    for (const item of previous) {
      if (!state.completedPhases.includes(item)) failures.push(`phase is not complete: ${item}`);
    }
  }
  return failures;
}

function usage() {
  console.log("Usage: node reusable-agent-system-toolkit/scripts/bootstrap-state.js <init|status|set-phase|complete-phase|block|unblock> <project-root> [value]");
}

const state = readState();

if (command === "init") {
  writeState(state);
  console.log(`Bootstrap state initialized: ${path.relative(root, statePath)}`);
} else if (command === "status") {
  console.log(JSON.stringify(state, null, 2));
} else if (command === "set-phase") {
  const phase = process.argv[4];
  if (!phases.includes(phase)) {
    console.error(`Unknown phase: ${phase}`);
    process.exit(1);
  }
  if (phase !== state.currentPhase) {
    console.error(`Out-of-order phase transition: expected ${state.currentPhase}, got ${phase}`);
    process.exit(1);
  }
  state.phases[phase].status = "in-progress";
  state.phases[phase].updatedAt = now();
  state.nextAction = `complete ${phase}`;
  writeState(state);
  console.log(`Current phase: ${phase}`);
} else if (command === "complete-phase") {
  const phase = process.argv[4] || state.currentPhase;
  if (!phases.includes(phase)) {
    console.error(`Unknown phase: ${phase}`);
    process.exit(1);
  }
  if (phase !== state.currentPhase) {
    console.error(`Out-of-order phase completion: expected ${state.currentPhase}, got ${phase}`);
    process.exit(1);
  }
  const failures = phaseFailures(phase);
  if (failures.length) {
    console.error(`Cannot complete phase ${phase}:`);
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }
  if (!state.completedPhases.includes(phase)) state.completedPhases.push(phase);
  state.phases[phase].status = "complete";
  state.phases[phase].updatedAt = now();
  const next = phases[phases.indexOf(phase) + 1] || "complete";
  state.currentPhase = next;
  state.nextAction = next === "complete" ? "bootstrap complete" : `start ${next}`;
  writeState(state);
  console.log(`Completed phase: ${phase}. Next: ${next}`);
} else if (command === "block") {
  const reason = process.argv.slice(4).join(" ") || "blocked without reason";
  state.blocked = true;
  state.blockers.push({ reason, phase: state.currentPhase, createdAt: now() });
  state.nextAction = "resolve blocker";
  if (state.phases[state.currentPhase]) state.phases[state.currentPhase].status = "blocked";
  writeState(state);
  console.log(`Blocked: ${reason}`);
} else if (command === "unblock") {
  state.blocked = false;
  state.nextAction = `continue ${state.currentPhase}`;
  if (state.phases[state.currentPhase]) state.phases[state.currentPhase].status = "in-progress";
  writeState(state);
  console.log(`Unblocked. Current phase: ${state.currentPhase}`);
} else if (command === "set-install-mode") {
  const mode = process.argv[4];
  if (!["full", "degraded"].includes(mode)) {
    console.error("Install mode must be full or degraded");
    process.exit(1);
  }
  state.installMode = mode;
  writeState(state);
  console.log(`Install mode: ${mode}`);
} else {
  usage();
  process.exit(1);
}
