#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { inspectRepository } = require("./lib/repository-separation");
const { loadWorkspace } = require("./lib/workspace");
const { LOCAL_MANIFEST, loadLocalStorage } = require("./lib/local-storage");
const { MODES, parseUpdateOptions, planFullUpdate } = require("./lib/update-policy");

try {
  const root = path.resolve(process.argv[2] || process.cwd());
  const options = parseUpdateOptions(process.argv.slice(3));
  if (fs.existsSync(path.join(root, "skills/project-agent-bootstrap/SKILL.md")) && fs.existsSync(path.join(root, "scripts/bootstrap.js")) && fs.existsSync(path.join(root, "MANIFEST.md"))) {
    throw new Error("This is the toolkit source repository, not an installed project. Do not self-install or migrate the toolkit sources.");
  }
  const manifestPath = path.join(root, "workspace.json");
  const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) : null;
  const local = fs.existsSync(path.join(root, LOCAL_MANIFEST)) ? loadLocalStorage(root) : null;
  const workspace = !local && manifest?.artifactRepository ? loadWorkspace(root) : null;
  const sources = local || workspace;
  const repositories = sources
    ? sources.repositories.map((repo) => ({ id: repo.id, ...inspectRepository(repo.root) }))
    : [{ id: "current-project", ...inspectRepository(root) }];
  const migration = repositories.some((repo) => repo.artifacts.length);
  const cleanupOnly = Boolean(local) && migration && repositories.every((repo) => repo.artifacts.every((item) => item.indexOnly));
  const review = repositories.some((repo) => repo.reviewCandidates.length);
  const separationStatus = cleanupOnly ? "cleanup-pending" : migration ? (sources ? "migration-required" : "needs-storage-choice") : review ? "review-required" : "clear";
  const report = {
    schemaVersion: 3,
    check: "update-preflight",
    toolkitVersion: require("../package.json").version,
    readOnly: true,
    mode: local ? "local-storage" : workspace ? "sidecar-workspace" : "project-local-or-legacy",
    status: options.mode ? separationStatus : "needs-update-mode",
    separationStatus,
    updateMode: { selected: options.mode, choices: MODES, requiresUserChoice: !options.mode, deletionAllowed: false },
    fullPlan: options.mode === "full" && sources && (!migration || cleanupOnly) ? planFullUpdate(root) : null,
    storage: local ? { mode: "local", configured: true, publication: "never", root: local.root } : workspace ? { mode: "git", configured: true, publication: "only-when-requested" } : { mode: null, configured: false, choices: ["git", "local"] },
    artifactRepository: workspace ? { id: workspace.artifact.id, configured: true } : null,
    repositories,
    nextAction: !options.mode ? "Ask: Full update (fresh deep scan, rebuild skills/RAG, retire old working history) or incremental update (critical fixes without deletion)? Warn about full scan time/tokens. Preserve MCP/settings and core project intent in both modes." : cleanupOnly ? "Verify local copies and the pending customer cleanup diff. Leave index/HEAD unchanged; do not stage/commit or repeat a completed copy merely to clear Git status. Review any other candidates separately." : migration ? (local ? "Prepare a verified copy-and-cleanup plan into the configured local folder. No staging, commits, push or merge requests during this migration." : workspace ? "Verify destination visibility/ownership, then prepare an explicit migration plan." : "Ask where to store agent materials: a separate Git repository or a local-only folder. Obtain its URL/checkout or local path. Do not move or delete files yet.") : review ? "Classify unknown-origin candidates before declaring separation complete." : options.mode === "full" ? "Follow full-update.md: preserve MCP/settings and core intent, verify rollback backup, fresh research/rebuild, then validated activation. This command did not execute a rebuild or deletion." : "Follow incremental-update.md: critical fixes and necessary compatibility updates only; no deletion or full scan.",
    limitations: ["No semantic RAG/skill review or installed-version migration performed.", "Unknown layouts require agent review; known ignored paths only, no symlink traversal.", "No files, Git configuration, index, commits or remotes modified."],
  };
  console.log(JSON.stringify(report, null, 2));
  if (report.status !== "clear") process.exitCode = 2;
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
