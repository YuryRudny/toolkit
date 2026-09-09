#!/usr/bin/env node
"use strict";
const assert = require("assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync, spawnSync } = require("child_process");
const { inspectRepository } = require("../scripts/lib/repository-separation");
const { gitSourceState, contentFingerprint } = require("../scripts/lib/source-state");
const { loadLocalStorage } = require("../scripts/lib/local-storage");
const { resolveSourcePath } = require("../scripts/lib/workspace");
const { parseUpdateOptions, classifyFullUpdatePath, planFullUpdate } = require("../scripts/lib/update-policy");
const { write } = require("./helpers");
const toolkit = path.resolve(__dirname, "..");
const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "toolkit-update-tests-")));
let count = 0;
const git = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
function repo(name) {
  const cwd = path.join(root, name);
  fs.mkdirSync(cwd);
  git(cwd, "init", "-b", "main");
  git(cwd, "config", "user.name", "Fixture");
  git(cwd, "config", "user.email", "fixture@example.test");
  write(cwd, "src/main.js", "module.exports = 1;\n");
  return cwd;
}
function check(cwd, expected, flags = ["--mode", "incremental", "--check"]) {
  const before = gitSourceState(cwd).digest;
  const result = spawnSync(process.execPath, [path.join(toolkit, "scripts/bootstrap.js"), "update", cwd, ...flags], { encoding: "utf8" });
  assert.equal(result.status, expected, result.stderr + result.stdout);
  assert.equal(gitSourceState(cwd).digest, before, "preflight changed source/index");
  return result;
}
function test(name, fn) { fn(); count++; console.log(`PASS ${name}`); }
function localStore(name) {
  const cwd = path.join(root, name), customer = repo(`${name}-customer`);
  fs.mkdirSync(cwd);
  write(cwd, ".gitignore", "# Local only\n*\n");
  write(cwd, "agent-storage.json", { schemaVersion: 1, mode: "local", id: name, publication: "never", toolkit: { path: toolkit }, repositories: [{ id: "product", role: "customer-code", path: customer }] });
  write(cwd, "docs/agent-system/knowledge-base.md", "# Preserved local RAG\n");
  return { cwd, customer };
}
function storageDigest(cwd) {
  const files = [];
  function walk(dir) { for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file); else files.push(path.relative(cwd, file));
  } }
  walk(cwd);
  return contentFingerprint(cwd, files);
}
function localCommand(store, args, expected = 0, runtime = false) {
  const before = storageDigest(store.cwd), sourceBefore = gitSourceState(store.customer).digest;
  const result = spawnSync(process.execPath, runtime ? [path.join(store.cwd, "bin/agentctl.js"), ...args] : [path.join(toolkit, "scripts/bootstrap.js"), "update", store.cwd, ...args], { encoding: "utf8" });
  assert.equal(result.status, expected, result.stderr + result.stdout);
  assert.equal(storageDigest(store.cwd), before, "read-only local command changed storage");
  assert.equal(gitSourceState(store.customer).digest, sourceBefore, "read-only local command changed customer source/index");
  assert(!fs.existsSync(path.join(store.cwd, ".git")), "local storage was initialized as Git");
  return result;
}
try {
  test("native customer rules are preserved and preflight is repeatable", () => {
    const cwd = repo("native");
    write(cwd, "AGENTS.md", "# Customer conventions\nDo not modify unrelated source.\n");
    const first = check(cwd, 0);
    assert.equal(check(cwd, 0).stdout, first.stdout);
    const report = JSON.parse(first.stdout);
    assert.equal(report.readOnly, true);
    assert.equal(report.repositories[0].preservedRules[0].path, "AGENTS.md");
    assert.equal(fs.existsSync(path.join(cwd, "docs")), false);
  });
  test("known ignored RAG is found without traversing dependencies", () => {
    const cwd = repo("ignored");
    write(cwd, ".gitignore", "docs/agent-system/\nnode_modules/\n");
    write(cwd, "docs/agent-system/knowledge-base.md", "# Existing authored knowledge\n");
    write(cwd, "node_modules/package/SKILL.md", "Do not inspect dependency skills\n");
    const report = JSON.parse(check(cwd, 2).stdout);
    assert.equal(report.status, "needs-storage-choice");
    assert.deepEqual(report.storage.choices, ["git", "local"]);
    assert.equal(report.repositories[0].artifacts.length, 1);
    assert.equal(report.repositories[0].artifacts[0].ignored, true);
    assert.equal(report.repositories[0].reviewCandidates.length, 0);
    assert(!fs.existsSync(path.join(cwd, "workspace.json")));
  });
  test("staged toolkit block cannot hide behind a cleaned worktree", () => {
    const cwd = repo("staged");
    write(cwd, "AGENTS.md", "Client rules\n<!-- reusable-agent-system-toolkit:start -->\nAgent rules\n<!-- reusable-agent-system-toolkit:end -->\n");
    git(cwd, "add", "AGENTS.md");
    write(cwd, "AGENTS.md", "Client rules\n");
    const report = JSON.parse(check(cwd, 2).stdout);
    assert.equal(report.repositories[0].artifacts[0].reason, "toolkit-managed-block");
    assert.notEqual(report.repositories[0].artifacts[0].digest, report.repositories[0].artifacts[0].indexDigest);
  });
  test("staged cleanup is allowed, unstaged deletion is still a Git candidate", () => {
    const cwd = repo("cleanup");
    write(cwd, "codex-skills/skills/ours/SKILL.md", "# Existing skill\n");
    git(cwd, "add", "."); git(cwd, "commit", "-m", "fixture");
    fs.unlinkSync(path.join(cwd, "codex-skills/skills/ours/SKILL.md"));
    assert.equal(inspectRepository(cwd, { includeIgnored: false }).artifacts.length, 1);
    git(cwd, "add", "--", "codex-skills/skills/ours/SKILL.md");
    assert.equal(inspectRepository(cwd, { includeIgnored: false }).artifacts.length, 0);
    check(cwd, 0);
  });
  test("unknown skill origins require review, not automatic ownership", () => {
    const cwd = repo("unknown");
    write(cwd, ".codex/skills/customer/SKILL.md", "---\nname: customer\ndescription: Native customer skill\n---\n");
    const report = JSON.parse(check(cwd, 2).stdout);
    assert.equal(report.status, "review-required");
    assert.equal(report.repositories[0].artifacts.length, 0);
    assert.equal(report.repositories[0].reviewCandidates.length, 1);
  });
  test("external symlinks are reported without reading their contents", () => {
    const cwd = repo("links");
    write(root, "external-secret/SKILL.md", "secret-marker-never-print\n");
    fs.mkdirSync(path.join(cwd, ".codex/skills"), { recursive: true });
    fs.symlinkSync(path.join(root, "external-secret"), path.join(cwd, ".codex/skills/external"));
    const result = check(cwd, 2);
    assert(!result.stdout.includes("secret-marker-never-print"));
    assert.equal(JSON.parse(result.stdout).repositories[0].reviewCandidates[0].worktreeState, "symlink");
  });
  test("unsupported apply is rejected without writes", () => {
    const cwd = repo("no-apply");
    assert.match(check(cwd, 1, ["--apply"]).stderr, /not implemented/);
  });
  test("subdirectory does not implicitly widen the target root", () => {
    const cwd = repo("subdirectory");
    assert.throws(() => inspectRepository(path.join(cwd, "src")), /explicit repository root/);
  });
  test("sidecar checks only manifest-listed customer roots", () => {
    const artifact = repo("artifact"), customer = repo("customer"), source = repo("toolkit-source");
    for (const [cwd, remote] of [[artifact, "git@example.test:team/agents.git"], [customer, "git@example.test:client/product.git"], [source, "git@example.test:team/toolkit.git"]]) git(cwd, "remote", "add", "origin", remote);
    write(source, "skills/project-agent-bootstrap/SKILL.md", "# Fixture\n");
    write(artifact, "workspace.json", { schemaVersion: 1, workspaceId: "fixture", artifactRepository: { id: "agents", remote: "git@example.test:team/agents.git" }, toolkit: { path: "../toolkit-source", remote: "git@example.test:team/toolkit.git" }, repositories: [{ id: "product", role: "customer-code", path: "../customer", remote: "git@example.test:client/product.git" }] });
    write(artifact, "docs/agent-system/knowledge-base.md", "Already separated\n");
    const clean = JSON.parse(check(artifact, 0).stdout);
    assert.equal(clean.mode, "sidecar-workspace");
    assert.equal(clean.repositories.length, 1);
    write(customer, "docs/agent-system/knowledge-base.md", "Needs migration\n");
    const before = gitSourceState(customer).digest;
    assert.equal(JSON.parse(check(artifact, 2).stdout).status, "migration-required");
    assert.equal(gitSourceState(customer).digest, before);
  });
  test("local storage succeeds without a Git repository or remote", () => {
    const store = localStore("local-success");
    const result = localCommand(store, ["--mode", "incremental", "--check"]);
    const report = JSON.parse(result.stdout);
    assert.equal(report.mode, "local-storage");
    assert.equal(report.status, "clear");
    assert.equal(report.storage.publication, "never");
    assert.equal(report.artifactRepository, null);
    assert.equal(localCommand(store, ["--mode", "incremental", "--check"]).stdout, result.stdout);
    assert.equal(resolveSourcePath(store.cwd, "repo://product/src/main.js"), path.join(store.customer, "src/main.js"));
    assert.throws(() => resolveSourcePath(store.cwd, "repo://product/../../escape"), /escapes/);
  });
  test("local runtime blocks Git-backed workflows and publication", () => {
    const store = localStore("local-runtime");
    const before = gitSourceState(store.customer).digest;
    const rendered = spawnSync(process.execPath, [path.join(toolkit, "scripts/render-workspace-runtime.js"), store.cwd], { encoding: "utf8" });
    assert.equal(rendered.status, 0, rendered.stderr);
    assert.equal(gitSourceState(store.customer).digest, before);
    for (const command of ["status", "doctor", "commit-plan"]) {
      const report = JSON.parse(localCommand(store, [command], 0, true).stdout);
      assert.deepEqual(report.agentSystem, { commit: false, push: false, mergeRequest: false, reason: "publication=never" });
    }
    assert.equal(JSON.parse(localCommand(store, ["update", "--mode", "incremental", "--check"], 0, true).stdout).mode, "local-storage");
    assert.equal(JSON.parse(localCommand(store, ["update", "--check"], 2, true).stdout).status, "needs-update-mode");
    for (const command of ["install", "sync", "integrations", "commit", "push"]) assert.match(localCommand(store, [command], 1, true).stderr, /non-publishing/);
    write(store.customer, "docs/agent-system/knowledge-base.md", "Agent material must not go to customer Git\n");
    const blocked = JSON.parse(localCommand(store, ["commit-plan"], 1, true).stdout);
    assert.equal(blocked.status, "blocked");
    assert.equal(blocked.violations[0].file, "docs/agent-system/knowledge-base.md");
  });
  test("local cleanup remains uncommitted and is not mistaken for another copy request", () => {
    const store = localStore("local-cleanup");
    const rel = "codex-skills/skills/ours/SKILL.md";
    write(store.customer, rel, "# Authored skill\n");
    git(store.customer, "add", "."); git(store.customer, "commit", "-m", "fixture");
    write(store.cwd, rel, fs.readFileSync(path.join(store.customer, rel), "utf8"));
    fs.unlinkSync(path.join(store.customer, rel));
    const report = JSON.parse(localCommand(store, ["--mode", "incremental", "--check"], 2).stdout);
    assert.equal(report.status, "cleanup-pending");
    assert.equal(report.repositories[0].artifacts[0].indexOnly, true);
    assert.match(git(store.customer, "status", "--porcelain=v1"), /^ D /);
  });
  test("local storage cannot sit inside customer Git or become a repository", () => {
    const store = localStore("local-no-git");
    const nested = path.join(store.customer, "personal-store");
    write(nested, ".gitignore", "*\n");
    write(nested, "agent-storage.json", fs.readFileSync(path.join(store.cwd, "agent-storage.json"), "utf8"));
    assert.throws(() => loadLocalStorage(nested), /outside every Git/);
    git(store.cwd, "init", "-b", "main");
    assert.throws(() => loadLocalStorage(store.cwd), /outside every Git/);
  });
  test("local storage enforces ignore-all and never-publish configuration", () => {
    const store = localStore("local-policy");
    write(store.cwd, ".gitignore", "*\n!knowledge-base.md\n");
    assert.throws(() => loadLocalStorage(store.cwd), /without exceptions/);
    write(store.cwd, ".gitignore", "*\n");
    const manifest = JSON.parse(fs.readFileSync(path.join(store.cwd, "agent-storage.json"), "utf8"));
    write(store.cwd, "agent-storage.json", { ...manifest, publication: "allowed" });
    assert.throws(() => loadLocalStorage(store.cwd), /publication=never/);
    write(store.cwd, "agent-storage.json", { ...manifest, remote: "" });
    assert.throws(() => loadLocalStorage(store.cwd), /Git artifact configuration/);
    write(store.cwd, "agent-storage.json", manifest);
    write(store.cwd, "workspace.json", {});
    assert.throws(() => loadLocalStorage(store.cwd), /workspace.json/);
  });
  test("local storage rejects unsafe manifest paths and duplicate identities", () => {
    const store = localStore("local-boundaries");
    const manifest = JSON.parse(fs.readFileSync(path.join(store.cwd, "agent-storage.json"), "utf8"));
    write(store.cwd, "agent-storage.json", { ...manifest, toolkit: { path: store.customer } });
    assert.throws(() => loadLocalStorage(store.cwd), /outside storage and customer roots/);
    write(store.cwd, "agent-storage.json", { ...manifest, repositories: [manifest.repositories[0], manifest.repositories[0]] });
    assert.throws(() => loadLocalStorage(store.cwd), /Invalid local storage/);
    write(store.cwd, "agent-storage.json", manifest);
    fs.unlinkSync(path.join(store.cwd, ".gitignore"));
    fs.symlinkSync(path.join(root, "nonexistent-ignore"), path.join(store.cwd, ".gitignore"));
    assert.throws(() => loadLocalStorage(store.cwd), /symbolic link/);
  });
  test("update requires an explicit full or incremental choice", () => {
    const cwd = repo("mode-choice");
    const report = JSON.parse(check(cwd, 2, ["--check"]).stdout);
    assert.equal(report.status, "needs-update-mode");
    assert.deepEqual(report.updateMode.choices, ["incremental", "full"]);
    assert.equal(report.updateMode.selected, null);
    assert.equal(report.updateMode.deletionAllowed, false);
    assert.equal(report.fullPlan, null);
    for (const mode of ["full", "incremental"]) assert.equal(parseUpdateOptions([`--mode=${mode}`, "--check"]).mode, mode);
    assert.throws(() => parseUpdateOptions(["--mode"]), /must be/);
    assert.throws(() => parseUpdateOptions(["--mode", "quick"]), /must be/);
    assert.throws(() => parseUpdateOptions(["--mode", "full", "--mode", "incremental"]), /Usage/);
    assert.throws(() => parseUpdateOptions(["--check", "--check"]), /Usage/);
    check(cwd, 1, ["--mode", "full", "--apply"]);
  });
  test("full plan protects MCP, access, runtime, intent and Git configuration", () => {
    const store = localStore("full-preserves-mcp");
    const protectedFiles = [".local/integrations.json", ".tmp/integration-env.sh", ".env.production", ".codex/config.toml", ".claude/settings.json", "mcpServers.json", "bin/enterprise-mcp.js", ".github/workflows/ci.yml", ".agent-state/project-intent.md", "docs/agent-system/enterprise-integrations.md", "codex-skills/skills/custom/scripts/mcp-server.js"];
    for (const rel of protectedFiles) write(store.cwd, rel, "secret-or-configuration-marker\n");
    write(store.cwd, "codex-skills/skills/custom/SKILL.md", "# Rebuild this skill\n");
    write(store.cwd, "docs/agent-system/research-workspace/research-notes.md", "Old working history\n");
    write(store.cwd, "docs/agent-system/history/old-task.md", "Old task context\n");
    write(store.cwd, ".agent-history/previous-run/knowledge-base.md", "Old rollback data\n");
    write(store.cwd, "docs/agent-system/customer-database.sqlite", "Unknown data: do not delete\n");
    for (const rel of protectedFiles) assert.equal(classifyFullUpdatePath(rel).action, "preserve", rel);
    const result = localCommand(store, ["--mode", "full", "--check"]);
    assert(!result.stdout.includes("secret-or-configuration-marker"));
    const plan = JSON.parse(result.stdout).fullPlan;
    assert.equal(plan.automaticDeletion, false);
    assert.equal(plan.intentPath, ".agent-state/project-intent.md");
    const byPath = new Map(plan.entries.map((entry) => [entry.path, entry]));
    assert.equal(byPath.get("codex-skills/skills/custom/SKILL.md").action, "rebuild");
    assert.equal(byPath.get("docs/agent-system/knowledge-base.md").action, "rebuild");
    assert.equal(byPath.get("docs/agent-system/history/old-task.md").action, "retire");
    assert.equal(byPath.get("docs/agent-system/research-workspace/research-notes.md").action, "retire");
    assert.equal(byPath.get("docs/agent-system/customer-database.sqlite").action, "review");
    assert.equal(byPath.get(".agent-history").activeKnowledge, false);
    assert(!byPath.has(".agent-history/previous-run/knowledge-base.md"));
    assert.equal(byPath.get(".codex/config.toml").action, "preserve");
  });
  test("incremental does not produce a reset plan or alter skills/history/settings", () => {
    const store = localStore("incremental-preserves-all");
    write(store.cwd, "codex-skills/skills/good/SKILL.md", "Keep this authored skill\n");
    write(store.cwd, "docs/agent-system/history/task.md", "Keep history\n");
    write(store.cwd, ".local/integrations.json", "Do not reconfigure MCP\n");
    const report = JSON.parse(localCommand(store, ["--mode", "incremental", "--check"]).stdout);
    assert.equal(report.fullPlan, null);
    assert.equal(report.updateMode.selected, "incremental");
    assert.equal(report.updateMode.deletionAllowed, false);
  });
  test("full plan never follows symlinks or traverses rollback history", () => {
    const store = localStore("full-no-symlink");
    write(root, "outside-private/private.md", "external-secret\n");
    fs.mkdirSync(path.join(store.cwd, "codex-skills/skills"), { recursive: true });
    fs.symlinkSync(path.join(root, "outside-private"), path.join(store.cwd, "codex-skills/skills/external"));
    const plan = planFullUpdate(store.cwd);
    assert.equal(plan.entries.find((entry) => entry.path.endsWith("/external")).action, "review");
    assert(!JSON.stringify(plan).includes("private.md"));
    for (const rel of ["../outside", "/absolute", "docs/../file", "a\\b"]) assert.throws(() => classifyFullUpdatePath(rel), /Unsafe/);
  });
  console.log(`${count} update preflight groups passed.`);
} finally { fs.rmSync(root, { recursive: true, force: true }); }
