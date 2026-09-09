#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { resolveInside } = require("./lib/path-safety");
const { resolveSourcePath } = require("./lib/workspace");

const root = path.resolve(process.argv[2] || process.cwd());
const skillsRoot = path.join(root, "codex-skills", "skills");
const inputsIndex = path.join(root, "docs", "agent-system", "skill-inputs", "index.json");
const projectModelPath = path.join(root, "docs", "agent-system", "project-model.json");
const outPath = resolveInside(root, "docs/agent-system/skill-registry.json", "registry output");

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function parseSkill(file, name, sourcePath = `codex-skills/skills/${name}/SKILL.md`) {
  const text = fs.readFileSync(file, "utf8");
  const frontmatter = text.match(/^---\s*\n([\s\S]*?)\n---/m)?.[1] || "";
  const description = frontmatter.match(/^description:\s*(.+)$/m)?.[1]?.trim() || "";
  const references = [...text.matchAll(/`(codex-skills\/references\/[^`]+)`/g)].map((match) => match[1]);
  return {
    name: frontmatter.match(/^name:\s*([a-z0-9-]+)\s*$/m)?.[1] || name,
    path: sourcePath,
    status: "active",
    description,
    references: [...new Set(references)],
    origin: "generated-or-existing-project-local",
  };
}

const byName = new Map();
function register(skill) {
  if (byName.has(skill.name) && byName.get(skill.name).path !== skill.path) throw new Error(`Duplicate skill authority for ${skill.name}: ${byName.get(skill.name).path}, ${skill.path}`);
  byName.set(skill.name, skill);
}
if (fs.existsSync(skillsRoot)) {
  for (const entry of fs.readdirSync(skillsRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const skillPath = path.join(skillsRoot, entry.name, "SKILL.md");
    if (fs.existsSync(skillPath)) register(parseSkill(skillPath, entry.name));
  }
}
const projectModel = readJson(projectModelPath);
const rulePaths = new Set((projectModel?.existingRules || []).filter((item) => item.kind === "skill").map((item) => item.path));
for (const base of [".codex/skills", ".agents/skills"]) {
  const dir = resolveInside(root, base, "local skills");
  if (!fs.existsSync(dir)) continue;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) if (entry.isDirectory()) rulePaths.add(`${base}/${entry.name}/SKILL.md`);
}
for (const rel of rulePaths) {
  const file = resolveSourcePath(root, rel);
  if (!fs.existsSync(file)) continue;
  const skill = parseSkill(file, path.basename(path.dirname(file)), rel);
  skill.origin = "existing-project";
  register(skill);
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

const registryRoot = projectModel?.mode === "sidecar-workspace"
  ? projectModel.projectRoot
  : root;

const registry = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  projectRoot: registryRoot,
  skills,
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, `${JSON.stringify(registry, null, 2)}\n`);
console.log(`Skill registry created: ${path.relative(root, outPath)} (${skills.length} skills)`);
