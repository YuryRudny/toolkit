#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = path.resolve(process.argv[2] || process.cwd());
const skillsRoot = path.join(root, "codex-skills", "skills");
const inputsIndex = path.join(root, "docs", "agent-system", "skill-inputs", "index.json");
const outPath = path.join(root, "docs", "agent-system", "skill-registry.json");

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function parseSkill(file, name) {
  const text = fs.readFileSync(file, "utf8");
  const frontmatter = text.match(/^---\s*\n([\s\S]*?)\n---/m)?.[1] || "";
  const description = frontmatter.match(/^description:\s*(.+)$/m)?.[1]?.trim() || "";
  const references = [...text.matchAll(/`(codex-skills\/references\/[^`]+)`/g)].map((match) => match[1]);
  return {
    name,
    path: `codex-skills/skills/${name}/SKILL.md`,
    status: "active",
    description,
    references: [...new Set(references)],
    origin: "generated-or-existing-project-local",
  };
}

const byName = new Map();
if (fs.existsSync(skillsRoot)) {
  for (const entry of fs.readdirSync(skillsRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const skillPath = path.join(skillsRoot, entry.name, "SKILL.md");
    if (fs.existsSync(skillPath)) byName.set(entry.name, parseSkill(skillPath, entry.name));
  }
}

const planned = readJson(inputsIndex)?.targetSkills || [];
for (const name of planned) {
  if (byName.has(name)) continue;
  byName.set(name, {
    name,
    path: `codex-skills/skills/${name}/SKILL.md`,
    status: "planned",
    description: "Будет скомпилирован из structured skill input",
    references: [],
    origin: "skill-input-plan",
  });
}

const categoryRules = [
  [/(router|authority|checklist)/, "operational"],
  [/(jira|confluence|git|enterprise)/, "enterprise"],
  [/(research|audit)/, "research"],
  [/(review|quality)/, "review"],
  [/(debug|error)/, "debugging"],
  [/(refactor)/, "refactor"],
  [/(testing|test)/, "testing"],
  [/(security|performance)/, "security-performance"],
  [/(frontend|ui|state)/, "frontend"],
  [/(backend|api|database|worker)/, "backend-data"],
  [/(mobile|capacitor)/, "mobile"],
];

const skills = [...byName.values()].map((skill) => ({
  ...skill,
  category: categoryRules.find(([pattern]) => pattern.test(skill.name))?.[1] || "domain",
})).sort((a, b) => a.name.localeCompare(b.name));

const registry = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  projectRoot: root,
  skills,
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, `${JSON.stringify(registry, null, 2)}\n`);
console.log(`Skill registry created: ${path.relative(root, outPath)} (${skills.length} skills)`);
