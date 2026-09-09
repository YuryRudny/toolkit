"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const SOURCE_SKIP = new Set([".git", "node_modules", ".nuxt", ".next", ".output", "dist", "build", "coverage", "vendor", ".venv", "venv", "target", "obj", ".yarn", ".tmp", ".idea", ".gradle", "reusable-agent-system-toolkit"]);
const RULE_PATH = /(^|\/)(AGENTS(?:\.override)?\.md|CLAUDE\.md|\.cursorrules)$|(^|\/)(\.agents|\.codex|codex-skills|\.cursor|\.claude)\/|^\.github\/copilot-instructions\.md$/;
function discoverSourceFiles(root, sidecar = false) {
  const files = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (SOURCE_SKIP.has(entry.name) || entry.isSymbolicLink()) continue;
      const file = path.join(dir, entry.name), rel = path.relative(root, file).replace(/\\/g, "/");
      if (!sidecar && (rel === "docs/agent-system" || rel === "codex-skills")) continue;
      if (entry.isDirectory()) walk(file);
      else if (sidecar || !RULE_PATH.test(rel)) files.push(rel);
    }
  }
  walk(root);
  return files.sort();
}

function contentFingerprint(root, files) {
  const hash = crypto.createHash("sha256");
  for (const file of [...new Set(files)].sort()) {
    const target = path.join(root, file);
    hash.update(JSON.stringify(file));
    try {
      const stat = fs.lstatSync(target);
      hash.update(`${stat.mode}:`);
      if (stat.isSymbolicLink()) hash.update(`link:${fs.readlinkSync(target)}`);
      else if (stat.isFile()) hash.update(crypto.createHash("sha256").update(fs.readFileSync(target)).digest());
      else hash.update("non-file");
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      hash.update("missing");
    }
    hash.update("\0");
  }
  return hash.digest("hex");
}

function gitSourceState(root) {
  const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  const files = git("ls-files", "--cached", "--others", "--exclude-standard", "-z").split("\0").filter(Boolean);
  const status = git("status", "--porcelain=v1", "-uall").trimEnd();
  let head = "";
  try { head = git("rev-parse", "HEAD").trim(); } catch { /* An unborn repository has no HEAD. */ }
  const digest = crypto.createHash("sha256")
    .update(head).update("\0").update(git("ls-files", "--stage", "-z"))
    .update("\0").update(contentFingerprint(root, files)).digest("hex");
  return { head, status, digest, files: [...new Set(files)] };
}

function mergeDiscovered(discovered, previous = []) {
  const old = new Map(previous.map((item) => [item.id, item]));
  return discovered.map((item) => {
    const saved = old.get(item.id);
    if (!saved) return item;
    const unchanged = Boolean(item.contentFingerprint) && saved.contentFingerprint === item.contentFingerprint;
    return {
      ...saved, ...item,
      responsibility: saved.responsibility || item.responsibility,
      evidence: saved.evidence || item.evidence,
      flowIds: saved.flowIds || item.flowIds,
      status: unchanged ? saved.status : "stale",
    };
  });
}

module.exports = { contentFingerprint, gitSourceState, mergeDiscovered, discoverSourceFiles };
