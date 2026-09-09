"use strict";
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { DOCS } = require("../scripts/lib/build-contract");
const { resolveSourcePath } = require("../scripts/lib/workspace");
const { discoverSourceFiles } = require("../scripts/lib/source-state");
const toolkit = path.resolve(__dirname, "..");
function write(root, rel, value) {
  const file = path.join(root, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, typeof value === "string" ? value : `${JSON.stringify(value, null, 2)}\n`);
}
function read(root, rel) { return JSON.parse(fs.readFileSync(path.join(root, rel), "utf8")); }
function run(script, args, expectedStatus = 0) {
  const result = spawnSync(process.execPath, [path.join(toolkit, "scripts", script), ...args], { encoding: "utf8" });
  if (result.status !== expectedStatus) throw new Error(`${script} returned ${result.status}:\n${result.stdout}\n${result.stderr}`);
  return result;
}
function evidence(task, source, root) {
  let sources = [{ path: source }];
  if (root && ["module", "flow", "flow-group"].includes(task.category)) sources = task.scope.map((scope) => {
    const file = resolveSourcePath(root, scope);
    if (fs.statSync(file).isFile()) return { path: scope };
    const child = discoverSourceFiles(file, true)[0];
    if (!child) throw new Error(`Fixture has no evidence source in ${scope}`);
    return { path: scope === "." ? child : `${scope}/${child}` };
  });
  return JSON.stringify({ summary: "Synthetic test fixture: source read and checks represented for deterministic pipeline testing.", scope: task.scope, coverage: task.requiredEvidence, sources });
}
function prepareBuild(root) {
  run("bootstrap-state.js", ["init", root]);
  run("bootstrap-state.js", ["set-install-mode", root, "full"]);
  const model = read(root, "docs/agent-system/project-model.json");
  run("create-research-tasks.js", [root, "init"]);
  const graph = read(root, "docs/agent-system/research-workspace/research-tasks.json");
  const source = model.entryPoints[0]?.path || model.manifests[0]?.path;
  if (!source) throw new Error("Fixture needs an entry or manifest");
  for (const task of graph.tasks) run("create-research-tasks.js", [root, "complete", task.id, evidence(task, source, root)]);
  for (const name of [...DOCS, "existing-rules-merge.md", "enterprise-integrations.md", "research-workspace/evidence-log.md", "research-workspace/research-notes.md", "research-workspace/decisions.md"]) {
    const rel = `docs/agent-system/${name}`;
    if (!fs.existsSync(path.join(root, rel))) write(root, rel, `# Тестовый артефакт ${name}\n\nСинтетический fixture для проверки контура; не реальное исследование. Источник: ${source}. Enterprise: skipped.\n`);
  }
  run("create-authority-map.js", [root]);
  for (const phase of ["install-wizard", "enterprise-setup", "deep-scan-decision", "existing-rules-merge", "discovery", "research-tasks", "deep-research", "docs-rag"]) run("bootstrap-state.js", ["complete-phase", root, phase]);
}
module.exports = { write, read, run, evidence, prepareBuild, toolkit };
