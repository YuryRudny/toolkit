#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = path.resolve(process.argv[2] || process.cwd());
const outPath = path.join(root, "docs", "agent-system", "authority-map.json");

function readJson(rel) {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
  } catch {
    return null;
  }
}

function readText(rel) {
  try {
    return fs.readFileSync(path.join(root, rel), "utf8");
  } catch {
    return "";
  }
}

function skillName(rel) {
  const text = readText(rel);
  return text.match(/^name:\s*([a-z0-9-]+)\s*$/m)?.[1] || null;
}

const model = readJson("docs/agent-system/project-model.json") || {};
const registry = readJson("docs/agent-system/skill-registry.json") || { skills: [] };
const previous = readJson("docs/agent-system/authority-map.json") || {};
const previousRules = new Map((previous.rules || []).map((item) => [item.path, item]));
const generatedPaths = new Set((registry.skills || []).map((item) => item.path));

const rules = (model.existingRules || []).map((item) => {
  const saved = previousRules.get(item.path) || {};
  const generated = generatedPaths.has(item.path);
  return {
    path: item.path,
    name: item.kind === "skill" ? skillName(item.path) : null,
    kind: item.kind,
    origin: generated ? "generated" : "existing-project",
    authority: saved.authority || (generated ? "generated" : "existing"),
    decision: saved.decision || (generated ? "managed-by-toolkit" : "preserve"),
    status: saved.status || "resolved",
  };
});

const byName = new Map();
for (const rule of rules.filter((item) => item.name)) {
  if (!byName.has(rule.name)) byName.set(rule.name, []);
  byName.get(rule.name).push(rule.path);
}
const conflicts = [...byName.entries()]
  .filter(([, paths]) => paths.length > 1)
  .map(([name, paths]) => ({ type: "duplicate-skill-name", name, paths, status: "unresolved" }));

const routes = {};
for (const skill of registry.skills || []) {
  if (skill.status !== "active") continue;
  if (!routes[skill.category]) routes[skill.category] = [];
  routes[skill.category].push(skill.name);
}

const authorityMap = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  projectFingerprint: model.fingerprint || null,
  rules,
  routes,
  conflicts,
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, `${JSON.stringify(authorityMap, null, 2)}\n`);
if (conflicts.length) {
  console.error(`Authority map created with ${conflicts.length} unresolved conflicts: ${path.relative(root, outPath)}`);
  process.exit(2);
}
console.log(`Authority map created: ${path.relative(root, outPath)} (${rules.length} rules)`);
