#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execFileSync, spawnSync } = require("child_process");

const artifactRoot = path.resolve(__dirname, "..");
const manifestPath = path.join(artifactRoot, "workspace.json");
const forbiddenAgentArtifact = /(^|\/)(AGENTS(?:\.override)?\.md|\.agents|\.codex|codex-skills|docs\/agent-system|reusable-agent-system-toolkit)(\/|$)/;

function fail(message) {
  console.error(message);
  process.exit(1);
}

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); }
  catch (error) { fail(`Cannot read ${file}: ${error.message}`); }
}

function git(cwd, args, fallback = null) {
  try {
    return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  } catch (error) {
    if (fallback !== null) return fallback;
    fail(`git ${args.join(" ")} failed in ${cwd}: ${String(error.stderr || error.message).trim()}`);
  }
}

function normalizeRemote(value) {
  return String(value || "").replace(/\.git$/, "").replace(/\/$/, "");
}

function resolveWorkspace() {
  const manifest = readJson(manifestPath);
  const local = manifest.localIntegration || {};
  const workspaceRoot = path.resolve(artifactRoot, local.workspaceRoot || "..");
  const artifactRemote = git(artifactRoot, ["remote", "get-url", "origin"], "");
  if (normalizeRemote(artifactRemote) !== normalizeRemote(manifest.artifactRepository.remote)) {
    fail(`Artifact remote mismatch: expected ${manifest.artifactRepository.remote}, got ${artifactRemote || "<none>"}`);
  }
  const repositories = manifest.repositories.map((repo) => {
    const root = path.resolve(artifactRoot, repo.path);
    if (!fs.existsSync(root)) fail(`Missing customer repository ${repo.id}: ${root}`);
    const gitRoot = path.resolve(git(root, ["rev-parse", "--show-toplevel"]));
    if (gitRoot !== root) fail(`${repo.id} path is not its Git root: ${root}`);
    const remote = git(root, ["remote", "get-url", "origin"], "");
    if (normalizeRemote(remote) !== normalizeRemote(repo.remote)) {
      fail(`Remote mismatch for ${repo.id}: expected ${repo.remote}, got ${remote || "<none>"}`);
    }
    return { ...repo, root, remote };
  });
  return { manifest, local, workspaceRoot, repositories };
}

function relativeTarget(linkPath, targetPath) {
  return path.relative(path.dirname(linkPath), targetPath) || ".";
}

function ensureLink(linkPath, targetPath) {
  fs.mkdirSync(path.dirname(linkPath), { recursive: true });
  const desired = relativeTarget(linkPath, targetPath);
  try {
    const stat = fs.lstatSync(linkPath);
    if (!stat.isSymbolicLink()) fail(`Refusing to replace local path: ${linkPath}`);
    if (fs.readlinkSync(linkPath) === desired) return "unchanged";
    fail(`Refusing to replace foreign symlink: ${linkPath}`);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  fs.symlinkSync(desired, linkPath);
  return "created";
}

function install() {
  const workspace = resolveWorkspace();
  const agentsFile = path.resolve(workspace.workspaceRoot, workspace.local.agentsFile || "AGENTS.md");
  const skillsDirectory = path.resolve(workspace.workspaceRoot, workspace.local.skillsDirectory || ".agents/skills");
  const agentsResult = ensureLink(agentsFile, path.join(artifactRoot, "AGENTS.md"));
  const skillsResult = ensureLink(skillsDirectory, path.join(artifactRoot, "codex-skills", "skills"));
  console.log(`Local integration ready: AGENTS.md ${agentsResult}; skills ${skillsResult}`);
}

function doctor() {
  const workspace = resolveWorkspace();
  const problems = [];
  for (const repo of workspace.repositories) {
    const status = git(repo.root, ["status", "--porcelain=v1", "-uall"], "");
    problems.push(...status.split(/\r?\n/).filter(Boolean).map((line) => ({ repository: repo.id, change: line })));
  }
  console.log(JSON.stringify({
    status: "passed",
    workspaceId: workspace.manifest.workspaceId,
    artifactRoot,
    workspaceRoot: workspace.workspaceRoot,
    customerWorktreeChanges: problems,
  }, null, 2));
}

function sync() {
  resolveWorkspace();
  const result = spawnSync("git", ["pull", "--ff-only"], { cwd: artifactRoot, encoding: "utf8", stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status || 1);
  const fresh = spawnSync(process.execPath, [__filename, "install"], { cwd: artifactRoot, stdio: "inherit" });
  if (fresh.status !== 0) process.exit(fresh.status || 1);
  console.log("Agent system synchronized from Rocketfirm GitLab over SSH.");
}

function status() {
  const workspace = resolveWorkspace();
  const baselinePath = path.join(artifactRoot, "docs/agent-system/source-snapshot.json");
  const baseline = fs.existsSync(baselinePath) ? readJson(baselinePath) : { repositories: [] };
  const expected = new Map((baseline.repositories || []).map((repo) => [repo.id, repo]));
  const repositories = workspace.repositories.map((repo) => {
    const head = git(repo.root, ["rev-parse", "HEAD"], "");
    const saved = expected.get(repo.id);
    return {
      id: repo.id,
      branch: git(repo.root, ["branch", "--show-current"], ""),
      head,
      knowledgeHead: saved?.head || null,
      knowledgeStatus: saved ? (saved.head === head ? "current" : "stale") : "unknown",
      worktreeClean: !git(repo.root, ["status", "--porcelain=v1", "-uall"], ""),
    };
  });
  console.log(JSON.stringify({
    workspaceId: workspace.manifest.workspaceId,
    agentSystemHead: git(artifactRoot, ["rev-parse", "HEAD"], ""),
    agentSystemBranch: git(artifactRoot, ["branch", "--show-current"], ""),
    agentSystemClean: !git(artifactRoot, ["status", "--porcelain=v1", "-uall"], ""),
    knowledgeStatus: repositories.some((repo) => repo.knowledgeStatus === "stale") ? "stale" : "current",
    repositories,
  }, null, 2));
}

function commitPlan() {
  const workspace = resolveWorkspace();
  const violations = [];
  const customerRepositories = workspace.repositories.map((repo) => {
    const changes = git(repo.root, ["status", "--porcelain=v1", "-uall"], "").split(/\r?\n/).filter(Boolean);
    for (const change of changes) {
      const file = change.slice(3).replace(/^"|"$/g, "");
      if (forbiddenAgentArtifact.test(file)) violations.push({ repository: repo.id, file });
    }
    return { id: repo.id, destination: repo.remote, changes };
  });
  console.log(JSON.stringify({
    status: violations.length ? "blocked" : "ready",
    agentSystem: {
      destination: workspace.manifest.artifactRepository.remote,
      changes: git(artifactRoot, ["status", "--porcelain=v1", "-uall"], "").split(/\r?\n/).filter(Boolean),
    },
    customerRepositories,
    violations,
  }, null, 2));
  if (violations.length) process.exit(1);
}

const command = process.argv[2] || "status";
if (command === "install") install();
else if (command === "doctor") doctor();
else if (command === "sync") sync();
else if (command === "status") status();
else if (command === "commit-plan") commitPlan();
else fail("Usage: agentctl.js <install|doctor|sync|status|commit-plan>");
