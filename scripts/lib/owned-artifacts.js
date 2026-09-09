"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { resolveInside } = require("./path-safety");
const { resolveSourcePath } = require("./workspace");

const ownershipFile = "docs/agent-system/generated-ownership.json";
const digest = (text) => crypto.createHash("sha256").update(text).digest("hex");

function managedText(text) {
  const start = "<!-- reusable-agent-system-toolkit:start -->";
  const end = "<!-- reusable-agent-system-toolkit:end -->";
  const a = text.indexOf(start), b = text.indexOf(end);
  if (a < 0 && b < 0) return "";
  if (a < 0 || b < a || text.indexOf(start, a + start.length) >= 0 || text.indexOf(end, b + end.length) >= 0) throw new Error("Malformed or duplicate AGENTS.md managed block");
  return text.slice(a, b + end.length);
}

function writeOwnedArtifacts(root, entries) {
  const manifestPath = resolveInside(root, ownershipFile, "ownership manifest");
  const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) : { schemaVersion: 1, files: {} };
  if (manifest.schemaVersion !== 1 || !manifest.files) throw new Error("Invalid generated ownership manifest");
  const targets = new Set();
  const rules = [];
  const modelPath = resolveInside(root, "docs/agent-system/project-model.json", "model");
  if (fs.existsSync(modelPath)) rules.push(...(JSON.parse(fs.readFileSync(modelPath, "utf8")).existingRules || []).filter((rule) => rule.kind === "skill"));
  for (const base of [".codex/skills", ".agents/skills"]) {
    const dir = resolveInside(root, base, "local skill inventory");
    if (!fs.existsSync(dir)) continue;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) if (entry.isDirectory()) rules.push({ path: `${base}/${entry.name}/SKILL.md` });
  }
  const plan = entries.map(({ relativePath, text, mergeEntry = false }) => {
    const file = resolveInside(root, relativePath, "generated output");
    if (targets.has(file)) throw new Error(`Duplicate output in render plan: ${relativePath}`);
    targets.add(file);
    if (relativePath.endsWith("/SKILL.md")) {
      const name = text.match(/^name:\s*([a-z0-9-]+)\s*$/m)?.[1];
      for (const rule of rules) {
        const source = resolveSourcePath(root, rule.path);
        if (source === file || !fs.existsSync(source)) continue;
        if (fs.readFileSync(source, "utf8").match(/^name:\s*([a-z0-9-]+)\s*$/m)?.[1] === name) throw new Error(`Existing skill authority ${name} at ${rule.path}; resolve routing before generation. No writes made.`);
      }
    }
    const nextDigest = digest(mergeEntry ? managedText(text) : text);
    if (fs.existsSync(file)) {
      const existing = fs.readFileSync(file, "utf8");
      const currentDigest = digest(mergeEntry ? managedText(existing) : existing);
      const saved = manifest.files[relativePath];
      const unownedEntry = mergeEntry && !managedText(existing);
      if (!unownedEntry && currentDigest !== nextDigest && currentDigest !== saved?.digest) {
        throw new Error(`Preserved existing/local edits: ${relativePath}. Resolve authority explicitly; generation made no writes.`);
      }
    }
    return { file, relativePath, text, nextDigest };
  });
  // All path/ownership checks happen before the first write. Individual replacements are atomic.
  for (const item of plan) {
    fs.mkdirSync(path.dirname(item.file), { recursive: true });
    const temporary = `${item.file}.${process.pid}.tmp`;
    let created = false;
    try {
      const fd = fs.openSync(temporary, "wx");
      created = true;
      try { fs.writeFileSync(fd, item.text); } finally { fs.closeSync(fd); }
      fs.renameSync(temporary, item.file);
    } finally { if (created && fs.existsSync(temporary)) fs.unlinkSync(temporary); }
    manifest.files[item.relativePath] = { ...manifest.files[item.relativePath], digest: item.nextDigest };
  }
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

function adoptGeneratedOutput(root, relativePath, reason) {
  if (!reason?.trim()) throw new Error("Adoption requires an explicit merge/ownership reason");
  if (!/^(?:codex-skills\/(?:skills\/[a-z0-9-]+\/SKILL\.md|references\/[a-z0-9-]+\.md)|docs\/agent-system\/skill-assembly\/[a-z0-9-]+\.md|bin\/(?:lib\/)?[a-z0-9-]+\.js|AGENTS\.md)$/.test(relativePath)) throw new Error("Not an adoptable generated output path");
  const file = resolveInside(root, relativePath, "adopted output", { mustExist: true });
  const manifestPath = resolveInside(root, ownershipFile, "ownership manifest");
  const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) : { schemaVersion: 1, files: {} };
  const text = fs.readFileSync(file, "utf8");
  manifest.files[relativePath] = { digest: digest(relativePath === "AGENTS.md" ? managedText(text) : text), decision: reason.trim(), adoptedAt: new Date().toISOString() };
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}
module.exports = { writeOwnedArtifacts, managedText, adoptGeneratedOutput };
