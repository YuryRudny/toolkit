"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

const MARKER = /<!--\s*reusable-agent-system-toolkit:(?:start|end)\s*-->/;
const AGENT_PATH = /(^|\/)(?:codex-skills|docs\/agent-system|reusable-agent-system-toolkit)(?:\/|$)/;
const RULE_FILE = /(^|\/)(?:AGENTS(?:\.override)?\.md|CLAUDE\.md|\.cursorrules|SKILL\.md)$/;
const LEGACY_DOC = /(^|\/)(?:knowledge-index\.md|research-evidence-pack\.md|skill-registry\.json|project-model\.json)$/;
const CONTROL_PATH = /(^|\/)\.(?:agents|codex|claude)(?:\/skills(?:\/.*)?)?$/;
const SKIP = /(^|\/)(?:\.git|node_modules|vendor|\.venv|dist|build|coverage)(?:\/|$)/;
const MAX_TEXT = 512 * 1024;
const KNOWN_PATHS = ["codex-skills", "docs/agent-system", ".codex/skills", ".agents/skills", ".claude/skills", "AGENTS.md", "AGENTS.override.md", "CLAUDE.md", "reusable-agent-system-toolkit"];

function git(root, args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 32 * 1024 * 1024 });
}

function readWorktree(root, rel, readText = true) {
  const absolute = path.resolve(root, rel);
  const relative = path.relative(root, absolute);
  if (path.isAbsolute(relative) || relative === ".." || relative.startsWith(`..${path.sep}`)) throw new Error("Inventory path escapes repository");
  // Do not follow links, including ancestors; inventory never reads another checkout by accident.
  let current = root;
  for (const part of relative.split(path.sep)) {
    current = path.join(current, part);
    let stat;
    try { stat = fs.lstatSync(current); } catch (error) { if (error.code === "ENOENT") return { state: "missing" }; throw error; }
    if (stat.isSymbolicLink()) return { state: "symlink" };
  }
  const stat = fs.statSync(absolute);
  if (!stat.isFile()) return { state: "non-file" };
  if (!readText) return { state: "file" };
  if (stat.size > MAX_TEXT) return { state: "too-large" };
  const buffer = fs.readFileSync(absolute);
  return { state: "file", text: buffer.toString("utf8"), digest: crypto.createHash("sha256").update(buffer).digest("hex") };
}

function readIndex(root, rel) {
  try {
    const buffer = execFileSync("git", ["show", `:./${rel}`], { cwd: root, stdio: ["ignore", "pipe", "pipe"], maxBuffer: MAX_TEXT });
    return { state: "file", text: buffer.toString("utf8"), digest: crypto.createHash("sha256").update(buffer).digest("hex") };
  } catch { return { state: "unreadable-index" }; }
}

function inspectRepository(root, { includeIgnored = true } = {}) {
  root = fs.realpathSync(root);
  const gitRoot = fs.realpathSync(git(root, ["rev-parse", "--show-toplevel"]).trim());
  if (root !== gitRoot) throw new Error("Separation check must start at the explicit repository root");
  const tracked = new Set(git(root, ["ls-files", "--cached", "-z"]).split("\0").filter(Boolean));
  const untracked = git(root, ["ls-files", "--others", "--exclude-standard", "-z"]).split("\0").filter(Boolean);
  const ignored = includeIgnored ? git(root, ["ls-files", "--others", "--ignored", "--exclude-standard", "-z", "--", ...KNOWN_PATHS]).split("\0").filter(Boolean) : [];
  const ignoredSet = new Set(ignored);
  const artifacts = [], reviewCandidates = [], preservedRules = [];
  for (const rel of [...new Set([...tracked, ...untracked, ...ignored])].sort()) {
    if (SKIP.test(rel)) continue;
    const agentPath = AGENT_PATH.test(rel), rule = RULE_FILE.test(rel), legacy = LEGACY_DOC.test(rel), control = CONTROL_PATH.test(rel);
    if (!agentPath && !rule && !legacy && !control) continue;
    // Known artifact trees need no content scan; avoid reading env or private logs within them.
    const needsText = !agentPath && (rule || legacy);
    const worktree = readWorktree(root, rel, needsText);
    if (!agentPath && !rule && !legacy && worktree.state !== "symlink") continue;
    const index = tracked.has(rel) && needsText ? readIndex(root, rel) : null;
    const marked = MARKER.test(worktree.text || "") || MARKER.test(index?.text || "");
    const item = { path: rel, tracked: tracked.has(rel), ignored: ignoredSet.has(rel), worktreeState: worktree.state, digest: worktree.digest || null, indexDigest: index?.digest || null };
    if (agentPath || marked) artifacts.push({ ...item, reason: marked ? "toolkit-managed-block" : "toolkit-artifact-path", indexOnly: tracked.has(rel) && (worktree.state === "missing" || (!agentPath && !MARKER.test(worktree.text || "") && MARKER.test(index?.text || ""))), needsOwnershipReview: true });
    else if (/(^|\/)SKILL\.md$/.test(rel) || legacy || !["file", "missing"].includes(worktree.state) || index?.state === "unreadable-index") {
      reviewCandidates.push({ ...item, reason: "unknown-origin-or-unreadable" });
    } else if (rule) preservedRules.push({ ...item, reason: "unmarked-project-rule" });
  }
  return { artifacts, reviewCandidates, preservedRules, status: artifacts.length ? "migration-required" : reviewCandidates.length ? "review-required" : "clear" };
}

module.exports = { inspectRepository };
