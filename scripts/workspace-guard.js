#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { loadWorkspace, readJson, sourceSnapshot, sourceStatus, writeArtifact, git } = require("./lib/workspace");

const workspace = loadWorkspace(process.argv[3] || process.argv[2] || process.cwd());
const command = process.argv[2] || "status";
const snapshotRel = "docs/agent-system/source-snapshot.json";
const resultRel = "docs/agent-system/source-boundary-result.json";
const forbidden = /(^|\/)(AGENTS(?:\.override)?\.md|\.agents|\.codex|codex-skills|docs\/agent-system|reusable-agent-system-toolkit)(\/|$)/;

function snapshot() {
  const value = sourceSnapshot(workspace);
  writeArtifact(workspace, snapshotRel, `${JSON.stringify(value, null, 2)}\n`);
  console.log(`Source snapshot created: ${snapshotRel}`);
}

function verify() {
  const baselinePath = path.join(workspace.artifactRoot, snapshotRel);
  if (!fs.existsSync(baselinePath)) throw new Error(`Missing ${snapshotRel}; run workspace-guard.js snapshot first`);
  const baseline = readJson(baselinePath);
  const before = new Map((baseline.repositories || []).map((item) => [item.id, item]));
  const changes = [];
  for (const repo of workspace.repositories) {
    const current = sourceStatus(repo);
    const saved = before.get(repo.id);
    if (!saved) changes.push({ id: repo.id, reason: "missing baseline" });
    else {
      if (saved.head !== current.head) changes.push({ id: repo.id, reason: "HEAD changed", before: saved.head, after: current.head });
      if (saved.status !== current.status) changes.push({ id: repo.id, reason: "worktree changed", before: saved.status, after: current.status });
    }
  }
  const result = {
    schemaVersion: 1,
    workspaceId: workspace.manifest.workspaceId,
    checkedAt: new Date().toISOString(),
    status: changes.length ? "failed" : "passed",
    changes,
  };
  writeArtifact(workspace, resultRel, `${JSON.stringify(result, null, 2)}\n`);
  if (changes.length) {
    console.error(JSON.stringify(result, null, 2));
    process.exit(1);
  }
  console.log(`Source boundary verified: ${workspace.repositories.length} customer repositories unchanged`);
}

function status() {
  const rows = workspace.repositories.map((repo) => sourceStatus(repo));
  console.log(JSON.stringify({ workspaceId: workspace.manifest.workspaceId, repositories: rows }, null, 2));
}

function commitPlan() {
  const violations = [];
  const repositories = workspace.repositories.map((repo) => {
    const lines = git(repo.root, ["status", "--porcelain=v1", "-uall"], "").split(/\r?\n/).filter(Boolean);
    for (const line of lines) {
      const file = line.slice(3).replace(/^"|"$/g, "");
      if (forbidden.test(file)) violations.push({ repository: repo.id, file, reason: "agent artifact in customer Git" });
    }
    return { id: repo.id, role: repo.role, remote: repo.actualRemote, changes: lines };
  });
  const artifactChanges = git(workspace.artifactRoot, ["status", "--porcelain=v1", "-uall"], "").split(/\r?\n/).filter(Boolean);
  const plan = {
    workspaceId: workspace.manifest.workspaceId,
    artifactRepository: { id: workspace.artifact.id, role: "internal-knowledge", remote: workspace.artifact.actualRemote, changes: artifactChanges },
    repositories,
    violations,
    status: violations.length ? "blocked" : "ready",
  };
  console.log(JSON.stringify(plan, null, 2));
  if (violations.length) process.exit(1);
}

if (command === "snapshot") snapshot();
else if (command === "verify") verify();
else if (command === "status") status();
else if (command === "commit-plan") commitPlan();
else {
  console.error("Usage: workspace-guard.js <snapshot|verify|status|commit-plan> <artifact-root>");
  process.exit(1);
}
