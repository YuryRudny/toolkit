#!/usr/bin/env node

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const toolkitRoot = path.resolve(__dirname, "..");
const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "agent-toolkit-fixture-"));

function write(rel, text) {
  const file = path.join(projectRoot, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}

function run(script, args = [], expectedStatus = 0) {
  const result = spawnSync(process.execPath, [path.join(toolkitRoot, "scripts", script), projectRoot, ...args], {
    cwd: projectRoot,
    encoding: "utf8",
  });
  if (result.status !== expectedStatus) {
    throw new Error(`${script} ${args.join(" ")} returned ${result.status}\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`);
  }
  return result;
}

function runState(args, expectedStatus = 0) {
  const result = spawnSync(process.execPath, [path.join(toolkitRoot, "scripts", "bootstrap-state.js"), args[0], projectRoot, ...args.slice(1)], {
    cwd: projectRoot,
    encoding: "utf8",
  });
  if (result.status !== expectedStatus) {
    throw new Error(`bootstrap-state.js ${args.join(" ")} returned ${result.status}\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`);
  }
  return result;
}

function runBash(source, expectedStatus = 0) {
  const result = spawnSync("bash", ["-c", source], { cwd: toolkitRoot, encoding: "utf8" });
  if (result.status !== expectedStatus) {
    throw new Error(`bash security fixture returned ${result.status}\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`);
  }
  return result;
}

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(projectRoot, rel), "utf8"));
}

try {
  write("package.json", JSON.stringify({
    name: "fixture-nuxt-project",
    scripts: { lint: "eslint .", build: "nuxt build" },
    dependencies: { nuxt: "3.12.0", vue: "3.4.0", pinia: "2.1.0" },
  }, null, 2));
  write("nuxt.config.ts", "export default defineNuxtConfig({ srcDir: 'src/' })\n");
  write("src/pages/index.vue", "<template><main>Home</main></template>\n");
  write("src/pages/admin.vue", "<template><main>Admin</main></template>\n");
  write("src/server/api/health.ts", "export default defineEventHandler(() => ({ ok: true }))\n");
  write("src/stores/session.ts", "export const useSession = defineStore('session', () => ({}))\n");
  write(".gitignore", "reusable-agent-system-toolkit/\n");

  run("create-project-model.js");
  let model = readJson("docs/agent-system/project-model.json");
  assert.equal(model.capabilities.nuxt, true);
  assert.equal(model.capabilities.frontend, true);
  assert.equal(model.capabilities.server, true);
  assert(model.modules.some((item) => item.path === "src/pages"));
  assert(model.entryPoints.some((item) => item.path === "src/server/api/health.ts"));

  run("create-research-tasks.js", ["init"]);
  let graph = readJson("docs/agent-system/research-workspace/research-tasks.json");
  assert(graph.tasks.some((item) => item.category === "module" && item.scope.includes("src/pages")));
  assert(graph.tasks.some((item) => item.category === "flow" && item.scope.includes("src/server/api/health.ts")));

  run("create-research-tasks.js", ["complete", "R-001", "module inventory evidence"]);
  graph = readJson("docs/agent-system/research-workspace/research-tasks.json");
  const pagesTask = graph.tasks.find((item) => item.category === "module" && item.scope.includes("src/pages"));
  run("create-research-tasks.js", ["complete", pagesTask.id, "pages ownership traced"]);
  const taskMarkdown = fs.readFileSync(path.join(projectRoot, "docs/agent-system/research-workspace/research-tasks.md"), "utf8");
  assert(new RegExp(`\\| ${pagesTask.id} \\|[^\\n]+\\| complete \\|`).test(taskMarkdown));
  model = readJson("docs/agent-system/project-model.json");
  assert.equal(model.modules.find((item) => item.path === "src/pages").status, "researched");

  write("docs/agent-system/seed-selection.md", `# Seed Selection

## Generated Skill Set

| Skill | Primary seeds | Required project evidence |
| --- | --- | --- |
| \`testing-strategy\` | \`external-ci-cd-and-automation\` | package scripts |
| \`frontend-ui-engineering\` | \`external-frontend-ui-engineering\` | Nuxt pages |
`);
  write("docs/agent-system/risk-register.md", "| ID | Severity | Problem | Evidence | Action |\n| --- | --- | --- | --- | --- |\n| R-TEST-1 | High | no tests | package.json | add checks |\n");
  write("docs/agent-system/refactor-plan.md", "| ID | Risk | Steps |\n| --- | --- | --- |\n| RF-1 | R-TEST-1 | add tests |\n");
  write("docs/agent-system/project-map.md", "# Project Map\n- src/pages\n- src/server\n");
  write("docs/agent-system/knowledge-index.md", "| Task | Source |\n| --- | --- |\n| UI | src/pages |\n");
  write("docs/agent-system/smoke-checklist.md", "# Smoke\n- open home page\n");
  write("docs/agent-system/research-workspace/forms/critical-flows.form.md", "### Home flow\n- Entry: src/pages/index.vue\n- Trace: src/pages/index.vue -> src/server/api/health.ts\n- Risks: R-TEST-1\n- Smoke: open home\n");

  run("create-skill-inputs.js");
  const testingInput = readJson("docs/agent-system/skill-inputs/testing-strategy.json");
  assert.deepEqual(testingInput.selectedSeeds, ["external-ci-cd-and-automation"]);
  const uiInput = readJson("docs/agent-system/skill-inputs/frontend-ui-engineering.json");
  assert.deepEqual(uiInput.selectedSeeds, ["external-frontend-ui-engineering"]);

  run("extract-seed-playbooks.js");
  const extraction = readJson("docs/agent-system/seed-extractions/testing-strategy.json");
  for (const seed of extraction.seedExtractions) {
    assert.equal(seed.contentTrust, "untrusted-advisory");
    const extractedText = [...seed.rulesTaken, ...seed.qualityGates, ...seed.resultFormat].join("\n");
    assert(!/https?:\/\/|\bnpx\s+|\b(?:token|password|secret|credential)\b/i.test(extractedText));
  }

  const testingInputPath = path.join(projectRoot, "docs/agent-system/skill-inputs/testing-strategy.json");
  const validExtractedInput = fs.readFileSync(testingInputPath, "utf8");
  const badSeedInput = JSON.parse(validExtractedInput);
  badSeedInput.seedExtractions[0].sourcePath = "../../outside/SKILL.md";
  fs.writeFileSync(testingInputPath, `${JSON.stringify(badSeedInput, null, 2)}\n`);
  const badSeedResult = run("extract-seed-playbooks.js", ["testing-strategy"], 1);
  assert(badSeedResult.stderr.includes("Seed must match toolkit manifest"));
  fs.writeFileSync(testingInputPath, validExtractedInput);
  run("extract-seed-playbooks.js", ["testing-strategy"]);

  const inputsDir = path.join(projectRoot, "docs/agent-system/skill-inputs");
  for (const file of fs.readdirSync(inputsDir).filter((name) => name.endsWith(".json") && name !== "index.json")) {
    const inputPath = path.join(inputsDir, file);
    const input = JSON.parse(fs.readFileSync(inputPath, "utf8"));
    input.status = "ready";
    fs.writeFileSync(inputPath, `${JSON.stringify(input, null, 2)}\n`);
  }

  const safeTestingInput = fs.readFileSync(testingInputPath, "utf8");
  const traversalNameInput = JSON.parse(safeTestingInput);
  traversalNameInput.skillName = "../../../owned";
  fs.writeFileSync(testingInputPath, `${JSON.stringify(traversalNameInput, null, 2)}\n`);
  const badNameResult = run("render-skills.js", [], 1);
  assert(badNameResult.stderr.includes("skillName must contain"));
  assert(!fs.existsSync(path.join(projectRoot, "owned")));

  const traversalReferenceInput = JSON.parse(safeTestingInput);
  traversalReferenceInput.references = ["codex-skills/references/../../../AGENTS.md"];
  fs.writeFileSync(testingInputPath, `${JSON.stringify(traversalReferenceInput, null, 2)}\n`);
  const badReferenceResult = run("render-skills.js", [], 1);
  assert(badReferenceResult.stderr.includes("Unsafe skill reference path"));
  fs.writeFileSync(testingInputPath, safeTestingInput);

  run("render-skills.js");
  assert(fs.existsSync(path.join(projectRoot, "codex-skills/skills/testing-strategy/SKILL.md")));
  assert(fs.existsSync(path.join(projectRoot, "docs/agent-system/skill-registry.json")));
  assert(fs.readFileSync(path.join(projectRoot, "codex-skills/skills/code-review-and-quality/SKILL.md"), "utf8").includes("## Severity И Verdict Protocol"));
  assert(fs.readFileSync(path.join(projectRoot, "codex-skills/skills/debugging-and-error-recovery/SKILL.md"), "utf8").includes("## Протокол Диагностики"));
  assert(fs.readFileSync(path.join(projectRoot, "codex-skills/skills/frontend-state-and-data/SKILL.md"), "utf8").includes("## Матрица Data Consistency"));

  write("AGENTS.md", "# Existing Project Rules\n\n- Keep this authoritative rule.\n");
  run("render-operational-skills.js");
  const registry = readJson("docs/agent-system/skill-registry.json");
  assert(fs.existsSync(path.join(projectRoot, "docs/agent-system/authority-map.json")));
  let projectEntry = fs.readFileSync(path.join(projectRoot, "AGENTS.md"), "utf8");
  assert(projectEntry.includes("# Existing Project Rules"));
  assert(projectEntry.includes("codex-skills/skills/workflow-router/SKILL.md"));
  assert(projectEntry.includes("даже если его skills не перечислены в системном списке `Available skills`"));
  assert.equal((projectEntry.match(/<!-- reusable-agent-system-toolkit:start -->/g) || []).length, 1);

  run("render-operational-skills.js");
  projectEntry = fs.readFileSync(path.join(projectRoot, "AGENTS.md"), "utf8");
  assert(projectEntry.includes("# Existing Project Rules"));
  assert.equal((projectEntry.match(/<!-- reusable-agent-system-toolkit:start -->/g) || []).length, 1);

  const activeNames = new Set(registry.skills.filter((item) => item.status === "active").map((item) => item.name));
  const router = fs.readFileSync(path.join(projectRoot, "codex-skills/skills/workflow-router/SKILL.md"), "utf8");
  assert(!router.includes("`general`"));
  assert(!router.includes("`refactor-mode`"));
  for (const line of router.split(/\r?\n/).filter((item) => item.startsWith("Обязательные skills:"))) {
    for (const match of line.matchAll(/`([a-z0-9-]+)`/g)) assert(activeNames.has(match[1]) || registry.skills.some((item) => item.name === match[1] && item.status === "planned"));
  }

  runState(["init"]);
  const outOfOrder = runState(["complete-phase", "discovery"], 1);
  assert(outOfOrder.stderr.includes("Out-of-order phase completion"));

  const integrationTemplate = path.join(toolkitRoot, "templates/enterprise-scripts/integration-env.template.sh");
  const safeRelative = runBash(`source "${integrationTemplate}"; resolve_enterprise_url "https://jira.example.com" "/rest/api/2/myself"`);
  assert.equal(safeRelative.stdout, "https://jira.example.com/rest/api/2/myself");
  const safeAbsolute = runBash(`source "${integrationTemplate}"; resolve_enterprise_url "https://jira.example.com" "https://jira.example.com/rest/api/2/myself"`);
  assert.equal(safeAbsolute.stdout, "https://jira.example.com/rest/api/2/myself");
  assert(runBash(`source "${integrationTemplate}"; resolve_enterprise_url "https://jira.example.com" "https://attacker.example/rest"`, 1).stderr.includes("different origin"));
  assert(runBash(`source "${integrationTemplate}"; resolve_enterprise_url "https://jira.example.com" "http://jira.example.com/rest"`, 1).stderr.includes("insecure HTTP"));

  run("seed-integrity.js");
  run("audit-toolkit-security.js");

  console.log("Toolkit end-to-end fixture tests passed.");
} finally {
  fs.rmSync(projectRoot, { recursive: true, force: true });
}
