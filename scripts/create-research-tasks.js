#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = path.resolve(process.argv[2] || process.cwd());
const command = process.argv[3] || "init";
const taskId = process.argv[4] || null;
const note = process.argv.slice(5).join(" ").trim();
const outDir = path.join(root, "docs", "agent-system", "research-workspace");
const jsonPath = path.join(outDir, "research-tasks.json");
const mdPath = path.join(outDir, "research-tasks.md");
const modelPath = path.join(root, "docs", "agent-system", "project-model.json");

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function slug(value) {
  return String(value).toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 54) || "ITEM";
}

function task(id, category, title, scope, requiredEvidence, dependsOn = []) {
  return {
    id,
    category,
    title,
    scope: Array.isArray(scope) ? scope : [scope],
    status: "pending",
    requiredEvidence,
    evidence: [],
    findings: [],
    gaps: [],
    dependsOn,
    updatedAt: null,
  };
}

function baseTasks(model) {
  const roots = model.sourceRoots || [];
  return [
    task("R-001", "inventory", "Подтвердить module inventory и ownership", roots, ["module responsibilities", "ownership boundaries", "deeper reads"]),
    task("R-002", "runtime", "Проверить stack/runtime/manifests/lockfiles", (model.manifests || []).map((item) => item.path), ["versions", "scripts", "runtime/deploy model"]),
    task("R-003", "hot-spots", "Построить очередь hot spots и blast radius", roots, ["large/shared files", "consumer evidence", "unsafe markers", "next reads"], ["R-001"]),
    task("R-004", "boundaries", "Проверить architecture и contract boundaries", roots, ["dependency direction", "contracts", "error/auth/cache behavior"], ["R-001"]),
    task("R-005", "security", "Провести security/privacy/trust-boundary hunt", roots, ["auth/authz", "input/output validation", "secrets/logging", "confirmed/gaps"], ["R-003"]),
    task("R-006", "performance", "Провести performance/resource/concurrency hunt", roots, ["hot paths", "cache/concurrency", "resource lifecycle", "runtime gaps"], ["R-003"]),
    task("R-007", "dependencies", "Проверить dependency usage и supply-chain gaps", (model.manifests || []).map((item) => item.path), ["direct dependency usage", "heavy/rare candidates", "audit freshness"]),
    task("R-008", "testing-ci", "Проверить tests/CI/local verification", roots, ["real commands", "blocking behavior", "missing coverage", "smoke"]),
    task("R-009", "rag-payload", "Собрать evidence graph для RAG/docs/skills", ["project-model", "research forms"], ["risk rows", "refactor slices", "skill hooks", "retrieval routes"], ["R-004", "R-005", "R-006", "R-007", "R-008"]),
  ];
}

function capabilityTasks(model) {
  const c = model.capabilities || {};
  const tasks = [];
  if (c.frontend) tasks.push(task("R-CAP-FRONTEND", "frontend", "Проверить UI states, accessibility, responsive и runtime boundaries", model.sourceRoots, ["state matrix", "a11y", "responsive", "SSR/client lifecycle"]));
  if (c.server) tasks.push(task("R-CAP-SERVER", "server", "Проверить request handlers, validation, auth, errors и observability", model.sourceRoots, ["handler traces", "validation", "safe errors", "idempotency/cache"]));
  if (c.database) tasks.push(task("R-CAP-DATABASE", "database", "Проверить persistence, migrations и transactional boundaries", model.sourceRoots, ["schemas/migrations", "transactions", "indexes", "data-loss risks"]));
  if (c.workers) tasks.push(task("R-CAP-WORKERS", "workers", "Проверить jobs, queues, retries и idempotency", model.sourceRoots, ["job entries", "retry/dead-letter", "idempotency", "observability"]));
  if (c.capacitor) tasks.push(task("R-CAP-MOBILE", "mobile", "Проверить mobile shell, native bridge, permissions и build sync", ["capacitor.config.ts", "ios", "android"], ["native config", "permissions", "bridge calls", "build gaps"]));
  if (c.kubernetes || c.terraform) tasks.push(task("R-CAP-INFRA", "infrastructure", "Проверить deployment, secrets, availability и rollback", model.sourceRoots, ["environment boundaries", "secrets", "health/rollback", "drift"]));
  return tasks;
}

function topologyTasks(model) {
  const tasks = [];
  for (const module of model.modules || []) {
    tasks.push(task(
      `R-MOD-${slug(module.id.replace(/^module-/, ""))}`,
      "module",
      `Исследовать модуль ${module.path}`,
      [module.path],
      ["responsibility", "entry points", "dependencies/consumers", "risks", "evidence paths"],
      ["R-001"],
    ));
  }

  const entries = model.entryPoints || [];
  const directEntries = entries.slice(0, 60);
  for (const entry of directEntries) {
    tasks.push(task(
      `R-FLOW-${slug(entry.id.replace(/^entry-/, ""))}`,
      "flow",
      `Протрассировать entry point ${entry.path}`,
      [entry.path],
      ["entry", "downstream chain", "contract", "error/auth/cache behavior", "checks"],
      ["R-003"],
    ));
  }

  if (entries.length > directEntries.length) {
    const grouped = new Map();
    for (const entry of entries.slice(directEntries.length)) {
      const owner = (model.modules || []).find((module) => entry.path.startsWith(`${module.path}/`))?.path || entry.path.split("/").slice(0, 2).join("/");
      if (!grouped.has(owner)) grouped.set(owner, []);
      grouped.get(owner).push(entry.path);
    }
    for (const [owner, paths] of grouped) {
      tasks.push(task(
        `R-FLOW-GROUP-${slug(owner)}`,
        "flow-group",
        `Классифицировать и протрассировать оставшиеся entry points в ${owner}`,
        paths,
        ["entry-point classification", "representative traces by distinct boundary", "coverage explanation", "untraced gaps"],
        ["R-003"],
      ));
    }
  }
  return tasks;
}

function mergeTasks(next, previous) {
  const old = new Map((previous?.tasks || []).map((item) => [item.id, item]));
  return next.map((item) => {
    const saved = old.get(item.id);
    if (!saved) return item;
    return {
      ...item,
      status: saved.status,
      evidence: saved.evidence || [],
      findings: saved.findings || [],
      gaps: saved.gaps || [],
      updatedAt: saved.updatedAt || null,
    };
  });
}

function write(payload) {
  payload.updatedAt = new Date().toISOString();
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`);
  const summary = payload.tasks.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {});
  const lines = [
    "# Research Task Graph",
    "",
    `Project fingerprint: \`${payload.projectFingerprint}\``,
    "",
    `Статусы: pending ${summary.pending || 0}; in-progress ${summary["in-progress"] || 0}; complete ${summary.complete || 0}; not-applicable ${summary["not-applicable"] || 0}.`,
    "",
    "| ID | Category | Title | Status | Scope | Required evidence | Depends on |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    ...payload.tasks.map((item) => `| ${item.id} | ${item.category} | ${item.title} | ${item.status} | ${item.scope.slice(0, 4).join("<br>")}${item.scope.length > 4 ? `<br>+${item.scope.length - 4}` : ""} | ${item.requiredEvidence.join("; ")} | ${(item.dependsOn || []).join(", ")} |`),
    "",
  ];
  fs.writeFileSync(mdPath, `${lines.join("\n")}\n`);
}

function fieldLine(block, labels) {
  for (const label of labels) {
    const escaped = label.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
    const match = block.match(new RegExp(`^\\s*[-*]\\s*${escaped}\\s*:\\s*(.+)$`, "im"));
    if (match) return match[1].trim().replace(/`/g, "");
  }
  return "";
}

function syncProjectModel(model, payload) {
  const completed = payload.tasks.filter((item) => ["complete", "not-applicable"].includes(item.status));
  for (const module of model.modules || []) {
    const task = completed.find((item) => item.category === "module" && item.scope.includes(module.path));
    if (task) {
      module.status = task.status === "complete" ? "researched" : "not-applicable";
      module.evidence = [...new Set([...(module.evidence || []), ...(task.evidence || [])])];
    }
  }
  for (const entry of model.entryPoints || []) {
    const task = completed.find((item) => ["flow", "flow-group"].includes(item.category) && item.scope.includes(entry.path));
    if (task) entry.status = task.status === "complete" ? "traced" : "not-applicable";
  }

  const flowsPath = path.join(root, "docs", "agent-system", "research-workspace", "forms", "critical-flows.form.md");
  if (fs.existsSync(flowsPath)) {
    const text = fs.readFileSync(flowsPath, "utf8");
    const blocks = text.split(/\n(?=###\s+)/).filter((block) => /^###\s+/.test(block.trim()));
    const parsed = blocks.map((block) => {
      const name = block.match(/^###\s+(.+)\s*$/m)?.[1]?.trim();
      const entry = fieldLine(block, ["Entry", "Вход"]);
      const trace = fieldLine(block, ["Trace", "Цепочка"]);
      const risks = fieldLine(block, ["Risks/refactor links", "Risk/refactor links", "Risks", "Риски"]);
      const verification = fieldLine(block, ["Tests/smoke", "Smoke", "Проверка"]);
      if (!name || !(trace || entry)) return null;
      return {
        id: `flow-${slug(name).toLowerCase()}`,
        name,
        entry,
        chain: (trace || entry).split(/\s*(?:->|→)\s*/).filter(Boolean),
        riskIds: risks.match(/\bR-[A-Z0-9-]+\b/g) || [],
        verification,
        status: "traced",
      };
    }).filter(Boolean);
    if (parsed.length) model.criticalFlows = parsed;
  }

  const unfinished = payload.tasks.filter((item) => !["complete", "not-applicable"].includes(item.status));
  model.research = {
    status: unfinished.length ? "in-progress" : "complete",
    completedTaskIds: completed.map((item) => item.id),
    unfinishedTaskIds: unfinished.map((item) => item.id),
    taskGraphFingerprint: payload.projectFingerprint,
    stale: payload.projectFingerprint !== model.fingerprint,
    updatedAt: new Date().toISOString(),
  };
  model.updatedAt = new Date().toISOString();
  fs.writeFileSync(modelPath, `${JSON.stringify(model, null, 2)}\n`);
}

const model = readJson(modelPath);
if (!model) {
  console.error("Missing docs/agent-system/project-model.json. Run create-project-model.js first.");
  process.exit(1);
}

const previous = readJson(jsonPath);
const generated = [
  ...baseTasks(model),
  ...capabilityTasks(model),
  ...topologyTasks(model),
];
const payload = {
  schemaVersion: 2,
  generatedAt: previous?.generatedAt || new Date().toISOString(),
  updatedAt: null,
  projectRoot: root,
  projectFingerprint: model.fingerprint,
  tasks: mergeTasks(generated, previous),
};

if (["complete", "not-applicable", "start"].includes(command)) {
  if (!taskId) {
    console.error(`${command} requires a task id`);
    process.exit(1);
  }
  const selected = payload.tasks.find((item) => item.id === taskId);
  if (!selected) {
    console.error(`Unknown research task: ${taskId}`);
    process.exit(1);
  }
  const blockedBy = (selected.dependsOn || []).filter((id) => {
    const dependency = payload.tasks.find((item) => item.id === id);
    return dependency && !["complete", "not-applicable"].includes(dependency.status);
  });
  if (command === "complete" && blockedBy.length) {
    console.error(`Cannot complete ${taskId}; unfinished dependencies: ${blockedBy.join(", ")}`);
    process.exit(1);
  }
  selected.status = command === "start" ? "in-progress" : command;
  selected.updatedAt = new Date().toISOString();
  if (note) {
    const target = command === "not-applicable" ? selected.gaps : selected.evidence;
    target.push(note);
  }
}

if (!["init", "sync", "complete", "not-applicable", "start"].includes(command)) {
  console.error(`Unknown research task command: ${command}`);
  process.exit(1);
}

write(payload);
syncProjectModel(model, payload);
const pending = payload.tasks.filter((item) => !["complete", "not-applicable"].includes(item.status)).length;
console.log(`Research task graph synced: ${path.relative(root, jsonPath)} (${payload.tasks.length} tasks, ${pending} unfinished)`);
