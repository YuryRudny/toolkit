#!/usr/bin/env node

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const toolkitRoot = path.resolve(__dirname, "..");
const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), "agent-sidecar-fixture-"));
const artifactRoot = path.join(workspaceRoot, "team-agent-system");
const apiRoot = path.join(workspaceRoot, "api-service");
const uiRoot = path.join(workspaceRoot, "web-client");

function write(root, rel, text) {
  const file = path.join(root, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}

function command(commandName, args, cwd, expectedStatus = 0) {
  const result = spawnSync(commandName, args, { cwd, encoding: "utf8" });
  if (result.status !== expectedStatus) {
    throw new Error(`${commandName} ${args.join(" ")} returned ${result.status}\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`);
  }
  return result;
}

function git(cwd, ...args) {
  return command("git", args, cwd);
}

function initRepo(root, remote, files) {
  fs.mkdirSync(root, { recursive: true });
  git(root, "init", "-b", "main");
  git(root, "config", "user.email", "fixture@example.test");
  git(root, "config", "user.name", "Fixture");
  git(root, "remote", "add", "origin", remote);
  for (const [rel, text] of Object.entries(files)) write(root, rel, text);
  git(root, "add", ".");
  git(root, "commit", "-m", "fixture");
}

function runToolkit(script, args = [], expectedStatus = 0) {
  return command(process.execPath, [path.join(toolkitRoot, "scripts", script), ...args], artifactRoot, expectedStatus);
}

function readArtifactJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(artifactRoot, rel), "utf8"));
}

try {
  const artifactRemote = "ssh://git@git.example.test:9111/team/agent-system.git";
  const apiRemote = "https://customer.example.test/group/api-service.git";
  const uiRemote = "https://customer.example.test/group/web-client.git";
  initRepo(artifactRoot, artifactRemote, { "README.md": "# Team agent system\n" });
  initRepo(apiRoot, apiRemote, {
    "pom.xml": "<project><artifactId>api-service</artifactId></project>\n",
    "src/main/java/example/Application.java": "class Application {}\n",
    "src/main/java/example/controllers/HealthController.java": "class HealthController {}\n",
  });
  initRepo(uiRoot, uiRemote, {
    "package.json": `${JSON.stringify({ name: "web-client", dependencies: { vue: "3.5.0" } }, null, 2)}\n`,
    "src/pages/index.vue": "<template><main>Home</main></template>\n",
  });

  write(artifactRoot, "workspace.json", `${JSON.stringify({
    schemaVersion: 1,
    workspaceId: "fixture-workspace",
    artifactRepository: { id: "team-agent-system", remote: artifactRemote },
    toolkit: { path: "../toolkit", remote: "git@example.test:team/toolkit.git" },
    localIntegration: { workspaceRoot: "..", agentsFile: "AGENTS.md", skillsDirectory: ".agents/skills" },
    repositories: [
      { id: "api-service", role: "customer-code", path: "../api-service", remote: apiRemote, defaultBranch: "main" },
      { id: "web-client", role: "customer-code", path: "../web-client", remote: uiRemote, defaultBranch: "main" },
    ],
  }, null, 2)}\n`);
  write(artifactRoot, "AGENTS.md", "# Workspace rules\n");
  write(artifactRoot, "codex-skills/skills/workflow-router/SKILL.md", "---\nname: workflow-router\ndescription: Fixture router.\n---\n");

  runToolkit("workspace-guard.js", ["snapshot", artifactRoot]);
  const baselineApiStatus = command("git", ["status", "--porcelain=v1", "-uall"], apiRoot).stdout;
  const baselineUiStatus = command("git", ["status", "--porcelain=v1", "-uall"], uiRoot).stdout;

  runToolkit("create-workspace-model.js", [artifactRoot]);
  const model = readArtifactJson("docs/agent-system/project-model.json");
  assert.equal(model.schemaVersion, 2);
  assert.equal(model.mode, "sidecar-workspace");
  assert.equal(model.projectRoot, "repo://team-agent-system");
  assert.deepEqual(model.workspace.repositories.map((repo) => repo.id), ["api-service", "web-client"]);
  assert(model.modules.some((item) => item.path.startsWith("repo://api-service/")));
  assert(model.entryPoints.some((item) => item.path.startsWith("repo://web-client/")));
  assert(!JSON.stringify(model).includes(workspaceRoot));
  assert.equal(command("git", ["status", "--porcelain=v1", "-uall"], apiRoot).stdout, baselineApiStatus);
  assert.equal(command("git", ["status", "--porcelain=v1", "-uall"], uiRoot).stdout, baselineUiStatus);

  runToolkit("create-skill-registry.js", [artifactRoot]);
  const registry = readArtifactJson("docs/agent-system/skill-registry.json");
  assert.equal(registry.projectRoot, "repo://team-agent-system");
  assert(!JSON.stringify(registry).includes(workspaceRoot));

  runToolkit("workspace-guard.js", ["verify", artifactRoot]);
  assert.equal(readArtifactJson("docs/agent-system/source-boundary-result.json").status, "passed");

  runToolkit("render-workspace-runtime.js", [artifactRoot]);
  const agentctl = path.join(artifactRoot, "bin", "agentctl.js");
  command(process.execPath, [agentctl, "install"], artifactRoot);
  assert.equal(fs.realpathSync(path.join(workspaceRoot, "AGENTS.md")), fs.realpathSync(path.join(artifactRoot, "AGENTS.md")));
  assert.equal(fs.realpathSync(path.join(workspaceRoot, ".agents", "skills")), fs.realpathSync(path.join(artifactRoot, "codex-skills", "skills")));
  command(process.execPath, [agentctl, "doctor"], artifactRoot);
  const status = JSON.parse(command(process.execPath, [agentctl, "status"], artifactRoot).stdout);
  assert.equal(status.knowledgeStatus, "current");

  write(apiRoot, "AGENTS.md", "forbidden\n");
  const plan = command(process.execPath, [agentctl, "commit-plan"], artifactRoot, 1);
  assert(plan.stdout.includes('"status": "blocked"'));
  assert(plan.stdout.includes('"file": "AGENTS.md"'));
  const verify = runToolkit("workspace-guard.js", ["verify", artifactRoot], 1);
  assert(verify.stderr.includes('"status": "failed"'));

  console.log("Toolkit sidecar workspace tests passed.");
} finally {
  fs.rmSync(workspaceRoot, { recursive: true, force: true });
}
