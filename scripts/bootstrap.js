#!/usr/bin/env node

const { spawnSync } = require("child_process");
const path = require("path");

const toolkitRoot = path.resolve(__dirname, "..");
const projectRoot = path.resolve(process.argv[3] || process.cwd());
const command = process.argv[2] || "status";
const extra = process.argv.slice(4);

function run(script, args = []) {
  const result = spawnSync(process.execPath, [path.join(toolkitRoot, "scripts", script), ...args], {
    cwd: projectRoot,
    encoding: "utf8",
    stdio: "inherit",
  });
  if (result.status !== 0) process.exit(result.status || 1);
}

const commands = {
  init: () => run("bootstrap-state.js", ["init", projectRoot]),
  status: () => run("bootstrap-state.js", ["status", projectRoot]),
  "set-install-mode": () => run("bootstrap-state.js", ["set-install-mode", projectRoot, extra[0]]),
  "complete-phase": () => run("bootstrap-state.js", ["complete-phase", projectRoot, extra[0]]),
  "create-model": () => run("create-project-model.js", [projectRoot]),
  "create-research": () => run("create-research-tasks.js", [projectRoot, "init"]),
  "sync-research": () => run("create-research-tasks.js", [projectRoot, "sync"]),
  "complete-research-task": () => run("create-research-tasks.js", [projectRoot, "complete", extra[0], ...extra.slice(1)]),
  "skip-research-task": () => run("create-research-tasks.js", [projectRoot, "not-applicable", extra[0], ...extra.slice(1)]),
  "render-operational": () => run("render-operational-skills.js", [projectRoot]),
  "create-skill-inputs": () => run("create-skill-inputs.js", [projectRoot]),
  "extract-seeds": () => run("extract-seed-playbooks.js", [projectRoot, ...extra]),
  "verify-seeds": () => run("seed-integrity.js", ["verify"]),
  "security-audit": () => run("audit-toolkit-security.js", []),
  "render-skills": () => run("render-skills.js", [projectRoot, ...extra]),
  "build-registry": () => run("create-skill-registry.js", [projectRoot]),
  "build-authority": () => run("create-authority-map.js", [projectRoot]),
  "quality-report": () => run("generate-quality-report.js", [projectRoot]),
  validate: () => run("validate-generated-agent-system.js", [projectRoot]),
  test: () => run(path.join("..", "tests", "run-tests.js"), []),
};

if (!commands[command]) {
  console.error(`Unknown bootstrap command: ${command}`);
  console.error(`Available: ${Object.keys(commands).join(", ")}`);
  process.exit(1);
}

commands[command]();
