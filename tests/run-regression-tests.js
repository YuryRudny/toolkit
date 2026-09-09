#!/usr/bin/env node
"use strict";
const assert = require("assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");
const { write, read, run, evidence, toolkit } = require("./helpers");
const { writeArtifact } = require("../scripts/lib/workspace");
const { gitSourceState, contentFingerprint } = require("../scripts/lib/source-state");
const { writeOwnedArtifacts, adoptGeneratedOutput } = require("../scripts/lib/owned-artifacts");
const { resolveInside } = require("../scripts/lib/path-safety");
const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "toolkit-regressions-")));
let passed = 0;
function test(name, fn) { fn(); passed++; console.log(`PASS ${name}`); }
try {
  const project = path.join(root, "project");
  write(project, "package.json", { name: "fixture" });
  write(project, "src/main.js", "module.exports = 1;\n");
  run("create-project-model.js", [project]);
  test("model rerun preserves authored research", () => {
    const model = read(project, "docs/agent-system/project-model.json");
    model.modules[0].status = "researched";
    model.modules[0].responsibility = "Custom ownership";
    model.modules[0].evidence = ["Authored evidence"];
    model.entryPoints[0].status = "traced";
    model.entryPoints[0].flowIds = ["flow-custom"];
    write(project, "docs/agent-system/project-model.json", model);
    run("create-project-model.js", [project]);
    const next = read(project, "docs/agent-system/project-model.json");
    assert.equal(next.modules[0].responsibility, "Custom ownership");
    assert.equal(next.modules[0].status, "researched");
    assert.deepEqual(next.entryPoints[0].flowIds, ["flow-custom"]);
    assert.equal(next.fingerprint, model.fingerprint);
  });
  test("root-level programs are not omitted from module discovery", () => {
    const flat = path.join(root, "flat");
    write(flat, "main.py", "print('fixture')\n");
    run("create-project-model.js", [flat]);
    const model = read(flat, "docs/agent-system/project-model.json");
    assert.equal(model.modules.length, 1);
    assert.equal(model.modules[0].path, ".");
    assert.equal(model.capabilities.python, true);
  });
  test("same-size content changes invalidate completed research", () => {
    run("create-research-tasks.js", [project, "init"]);
    const graph = read(project, "docs/agent-system/research-workspace/research-tasks.json");
    for (const task of graph.tasks) run("create-research-tasks.js", [project, "complete", task.id, evidence(task, "src/main.js")]);
    const file = path.join(project, "src/main.js"), stat = fs.statSync(file);
    write(project, "src/main.js", "module.exports = 2;\n");
    fs.utimesSync(file, stat.atime, stat.mtime);
    run("create-project-model.js", [project]);
    run("create-research-tasks.js", [project, "sync"]);
    const model = read(project, "docs/agent-system/project-model.json");
    assert.notEqual(model.fingerprint, graph.projectFingerprint);
    assert.notEqual(model.research.status, "complete");
    assert.equal(model.research.stale, true);
    assert.equal(model.modules[0].responsibility, "Custom ownership");
  });
  test("bulk completion cannot manufacture research", () => {
    assert.match(run("create-research-tasks.js", [project, "complete-evidenced"], 1).stderr, /structured evidence/);
    run("create-research-tasks.js", [project, "complete", "R-001"], 1);
    run("create-research-tasks.js", [project, "not-applicable", "R-001"], 1);
  });
  test("empty install fails validation and rendering gate", () => {
    const empty = path.join(root, "empty"); fs.mkdirSync(empty);
    run("validate-generated-agent-system.js", [empty], 1);
    assert.equal(read(empty, "docs/agent-system/validation-result.json").status, "failed");
    run("render-operational-skills.js", [empty], 1);
    assert.equal(fs.existsSync(path.join(empty, "codex-skills")), false);
  });
  test("ownership preflight preserves local edits and avoids partial writes", () => {
    const owner = path.join(root, "owner"); fs.mkdirSync(owner);
    writeOwnedArtifacts(owner, [{ relativePath: "skills/a.md", text: "generated" }]);
    write(owner, "skills/a.md", "manual rule");
    assert.throws(() => writeOwnedArtifacts(owner, [{ relativePath: "skills/new.md", text: "new" }, { relativePath: "skills/a.md", text: "replace" }]), /Preserved/);
    assert.equal(fs.readFileSync(path.join(owner, "skills/a.md"), "utf8"), "manual rule");
    assert.equal(fs.existsSync(path.join(owner, "skills/new.md")), false);
    write(owner, `skills/b.md.${process.pid}.tmp`, "unrelated temporary file");
    assert.throws(() => writeOwnedArtifacts(owner, [{ relativePath: "skills/b.md", text: "new" }]), /EEXIST/);
    assert.equal(fs.readFileSync(path.join(owner, `skills/b.md.${process.pid}.tmp`), "utf8"), "unrelated temporary file");
  });
  test("nonexistent output cannot escape through a symlink ancestor", () => {
    const artifact = path.join(root, "artifact"); fs.mkdirSync(artifact);
    fs.symlinkSync(project, path.join(artifact, "docs"));
    assert.throws(() => writeArtifact({ artifactRoot: artifact }, "docs/new/sub/file.md", "bad"), /escapes/);
    assert.equal(fs.existsSync(path.join(project, "new")), false);
    assert.throws(() => resolveInside(path.join(artifact, "docs"), "x.md"), /symbolic link/);
    assert.throws(() => writeOwnedArtifacts(artifact, [{ relativePath: "docs/x.md", text: "bad" }]), /symbolic link/);
  });
  test("Git fingerprint sees already-dirty content and staged-only changes", () => {
    const repo = path.join(root, "git"); fs.mkdirSync(repo);
    const git = (...args) => execFileSync("git", args, { cwd: repo, stdio: "pipe" });
    git("init", "-b", "main");
    write(repo, "space name.js", "one"); git("add", ".");
    const first = gitSourceState(repo);
    write(repo, "space name.js", "two");
    const second = gitSourceState(repo);
    write(repo, "space name.js", "six");
    const third = gitSourceState(repo);
    assert.equal(second.status, third.status);
    assert.notEqual(second.digest, third.digest);
    git("add", ".");
    assert.notEqual(third.digest, gitSourceState(repo).digest);
    assert.notEqual(first.digest, third.digest);
  });
  test("blocked state cannot complete a phase", () => {
    const state = path.join(root, "state"); fs.mkdirSync(state);
    run("bootstrap-state.js", ["init", state]);
    run("bootstrap-state.js", ["block", state, "test blocker"]);
    assert.match(run("bootstrap-state.js", ["complete-phase", state, "install-wizard"], 1).stderr, /blocked/);
  });
  test("adoption is explicit and leaves content intact until a later render", () => {
    const project = path.join(root, "adoption");
    const rel = "codex-skills/skills/review-checklist/SKILL.md";
    write(project, rel, "original local text");
    assert.throws(() => adoptGeneratedOutput(project, rel, ""), /explicit/);
    adoptGeneratedOutput(project, rel, "Test owner explicitly approved regeneration after reviewing the old rule");
    assert.equal(fs.readFileSync(path.join(project, rel), "utf8"), "original local text");
    writeOwnedArtifacts(project, [{ relativePath: rel, text: "updated managed text" }]);
    assert.equal(fs.readFileSync(path.join(project, rel), "utf8"), "updated managed text");
  });
  test("existing local skill names block generation before writes", () => {
    const project = path.join(root, "authority");
    write(project, ".codex/skills/team-review/SKILL.md", "---\nname: review-checklist\ndescription: Team authority\n---\n");
    assert.throws(() => writeOwnedArtifacts(project, [{ relativePath: "codex-skills/skills/review-checklist/SKILL.md", text: "---\nname: review-checklist\n---\n" }]), /Existing skill authority/);
    assert(!fs.existsSync(path.join(project, "codex-skills")));
    run("create-skill-registry.js", [project]);
    assert.equal(read(project, "docs/agent-system/skill-registry.json").skills[0].path, ".codex/skills/team-review/SKILL.md");
  });
  test("degraded install has a reachable truthful completion path", () => {
    const degraded = path.join(root, "degraded"); fs.mkdirSync(degraded);
    run("bootstrap-state.js", ["init", degraded]);
    run("bootstrap-state.js", ["set-install-mode", degraded, "degraded"]);
    for (const name of ["enterprise-integrations.md", "current-state.md", "stack-profile.md", "existing-rules-merge.md"]) write(degraded, `docs/agent-system/${name}`, "# Degraded fixture\n\nEnterprise skipped; full research unavailable.\n");
    write(degraded, ".gitignore", "reusable-agent-system-toolkit/\n");
    run("create-authority-map.js", [degraded]);
    for (const phase of ["install-wizard", "enterprise-setup", "deep-scan-decision", "existing-rules-merge"]) run("bootstrap-state.js", ["complete-phase", degraded, phase]);
    run("render-operational-skills.js", [degraded]);
    run("bootstrap-state.js", ["complete-phase", degraded, "skill-render"]);
    run("validate-generated-agent-system.js", [degraded]);
    for (const phase of ["validation", "repository-hygiene", "complete"]) run("bootstrap-state.js", ["complete-phase", degraded, phase]);
    assert(read(degraded, "docs/agent-system/bootstrap-state.json").completedPhases.includes("complete"));
    assert(!fs.existsSync(path.join(degraded, "codex-skills/skills/code-review-and-quality")));
    run("render-skills.js", [degraded], 1);
  });
  console.log(`${passed} regression groups passed.`);
} finally { fs.rmSync(root, { recursive: true, force: true }); }
