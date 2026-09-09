"use strict";

const fs = require("fs");
const path = require("path");
const { resolveInside } = require("./path-safety");

const MODES = ["incremental", "full"];
const INTENT = ".agent-state/project-intent.md";
const HISTORY = ".agent-history";
const PROTECTED_DIRS = new Set([".git", ".local", ".tmp", ".github", ".gitlab", ".circleci", ".mcp", "bin", "integrations"]);
const PROTECTED_FILES = new Set(["AGENTS.md", "AGENTS.override.md", "CLAUDE.md", ".cursorrules", ".gitignore", "workspace.json", "agent-storage.json", "enterprise-integrations.md", "existing-rules-merge.md", "authority-map.json", "project-intent.md"]);
const RAG_FILES = new Set([
  "project-model.json", "full-project-research-report.md", "research-evidence-pack.md", "knowledge-base.md", "knowledge-index.md", "project-map.md", "architecture-map.md", "risk-register.md", "refactor-plan.md", "smoke-checklist.md", "current-state.md", "stack-profile.md", "project-overview.md", "agent-operating-model.md", "skill-registry.json", "seed-selection.md", "bootstrap-quality-report.md", "bootstrap-quality-report.json", "validation-result.json", "bootstrap-state.json", "source-snapshot.json", "source-boundary-result.json", "generated-ownership.json",
]);
const RAG_DIRS = new Set(["research-workspace", "skill-inputs", "skill-assembly", "seed-extractions", "rag", "knowledge", "vector-index"]);

function parseUpdateOptions(args) {
  let mode = null, checked = false;
  for (let i = 0; i < args.length; i++) {
    const value = args[i];
    if (value === "--check" && !checked) { checked = true; continue; }
    if ((value === "--mode" || value.startsWith("--mode=")) && mode === null) {
      mode = value === "--mode" ? args[++i] : value.slice("--mode=".length);
      if (!MODES.includes(mode)) throw new Error("Update mode must be incremental or full");
      continue;
    }
    throw new Error("Usage: bootstrap.js update <root> [--mode incremental|full] [--check]. Automatic --apply is not implemented; follow project-agent-update/SKILL.md.");
  }
  return { mode };
}

function classifyFullUpdatePath(rel) {
  if (typeof rel !== "string" || !rel || rel.includes("\\") || rel.startsWith("/") || rel.split("/").some((part) => part === ".." || part === "." || !part) || rel.includes("\0")) throw new Error("Unsafe full-update path");
  const parts = rel.split("/"), name = parts.at(-1);
  if (parts[0] === HISTORY) return { action: "preserve", reason: "rollback-checkpoint-not-active-context", activeKnowledge: false };
  if (parts[0] === ".agent-state") return { action: "preserve", reason: "core-intent-and-update-control" };
  if (parts.some((part) => PROTECTED_DIRS.has(part)) || PROTECTED_FILES.has(name) || /^\.env(?:\.|$)/i.test(name) || /(?:^|[-_.])(?:mcp|cpi|credentials?|secrets?|integrations?|ci)(?:[-_.]|$)/i.test(name) || /^(?:(?:config|settings(?:\.local)?)\.(?:toml|json|ya?ml)|mcpServers\.json|Jenkinsfile|\.gitlab-ci\.yml)$/i.test(name)) {
    return { action: "preserve", reason: "configuration-access-or-authority" };
  }
  if (/^(?:codex-skills\/(?:skills|references)|\.(?:codex|agents|claude)\/skills)(?:\/|$)/.test(rel)) return { action: "rebuild", reason: "agent-skills-and-references", needsOwnershipReview: true };
  if (rel.startsWith("docs/agent-system/")) {
    const tail = parts.slice(2);
    if (tail.some((part) => /^(?:history|worklogs?|research-workspace|decisions)(?:[.-]|$)/i.test(part)) || /(?:worklog|history|decisions|research-notes|evidence-log|error-log)/i.test(name)) return { action: "retire", reason: "old-working-history-not-active-context", needsOwnershipReview: true };
    if (RAG_FILES.has(name) || RAG_DIRS.has(tail[0])) return { action: "rebuild", reason: "agent-knowledge-and-derived-state", needsOwnershipReview: true };
  }
  return { action: "review", reason: "unknown-ownership-preserve-until-classified" };
}

function planFullUpdate(root) {
  const entries = [];
  const roots = ["codex-skills", "docs/agent-system", ".codex/skills", ".agents/skills", ".claude/skills", ".codex/config.toml", ".claude/settings.json", ".agent-state", HISTORY, "bin", ".local", ".tmp", ".github", ".gitlab", ".circleci", ".mcp", "integrations", "AGENTS.md", "workspace.json", "agent-storage.json", ".gitignore", ".env", ".env.local", ".gitlab-ci.yml"];
  for (const name of fs.readdirSync(root)) if (!roots.includes(name) && classifyFullUpdatePath(name).action === "preserve") roots.push(name);
  function visit(rel) {
    const file = path.join(root, rel);
    const stat = fs.lstatSync(file, { throwIfNoEntry: false });
    if (!stat) return;
    const policy = classifyFullUpdatePath(rel);
    if (stat.isSymbolicLink()) { entries.push({ path: rel, action: "review", reason: "symlink-not-followed" }); return; }
    // Config/credential directories are opaque: do not read their secret contents for planning.
    if (policy.action === "preserve") { entries.push({ path: rel, ...policy }); return; }
    resolveInside(root, rel, "full update inventory", { mustExist: true });
    if (stat.isDirectory()) {
      for (const name of fs.readdirSync(file).sort()) visit(`${rel}/${name}`);
    } else entries.push({ path: rel, ...policy });
  }
  for (const rel of roots) visit(rel);
  entries.sort((a, b) => a.path.localeCompare(b.path));
  return {
    readOnly: true, automaticDeletion: false,
    intentPath: INTENT, rollbackRoot: HISTORY,
    historyPolicy: "Retire old working history from active context; keep core project intent and a separate non-RAG rollback checkpoint.",
    mcpPolicy: "Preserve existing servers, credentials sources, configuration and runtime; do not reinstall or reconfigure.",
    activationGate: "Verified backup, fresh deep research and rebuilt skills/RAG, preserved settings, ownership review and successful validation before replacement.",
    counts: Object.fromEntries(["rebuild", "retire", "preserve", "review"].map((action) => [action, entries.filter((entry) => entry.action === action).length])),
    entries,
    limitation: "Path-based candidate plan, not authority to delete. Unknown files and configuration embedded in RAG/skills require agent review. External MCP settings are preserved without discovery or reads by this command.",
  };
}

module.exports = { MODES, INTENT, HISTORY, parseUpdateOptions, classifyFullUpdatePath, planFullUpdate };
