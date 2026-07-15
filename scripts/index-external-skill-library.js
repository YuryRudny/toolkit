const fs = require("fs");
const path = require("path");

const sourceRoot = process.argv[2] || "skill-seeds/external/agent-skills-main";
const outputDir = process.argv[3] || "skill-seeds/external";
const importedAt = process.argv[4] || "2026-07-08";
const libraryId = process.argv[5] || path.basename(sourceRoot);

const skillBase = hasDirectory(sourceRoot, "skills") ? path.join(sourceRoot, "skills") : sourceRoot;

const categoryHints = {
  architecture: [
    "architect",
    "architecture",
    "api-design",
    "code-review",
    "quality",
    "mr-review",
    "spec-driven",
    "refactor",
    "debugging",
    "error-recovery",
    "design-system",
    "feature-sliced",
  ],
  frontend: [
    "react",
    "next",
    "tailwind",
    "shadcn",
    "chakra",
    "daisy",
    "ui",
    "frontend",
    "responsive",
    "motion",
    "web-component",
    "web-design",
    "zustand",
    "tanstack",
    "nuqs",
  ],
  backend: ["nestjs", "drizzle", "sqlite", "api-design"],
  mobile: [
    "capacitor",
    "capgo",
    "cordova",
    "ionic",
    "ios-android",
    "konsta",
    "safe-area",
    "cocoapods",
    "arkui",
  ],
  python: ["python", "uv"],
  testing: ["msw", "testing"],
  validation: ["zod", "react-hook-form"],
  devops: ["bash", "changelog", "ci-cd", "automation"],
  design: ["figma", "open-pencil", "suggest-lucide", "frontend-design", "ui-design"],
  gamedev: ["phaser"],
};

const highPriority = new Set([
  "code-review",
  "refactor",
  "typescript",
  "react-best-practices",
  "nextjs",
  "nestjs-best-practices",
  "msw",
  "zod",
  "tailwind",
  "shadcn",
]);

function categoryFor(folderName) {
  for (const [category, hints] of Object.entries(categoryHints)) {
    if (hints.some((hint) => folderName.includes(hint))) {
      return category;
    }
  }
  return "general";
}

function parseFrontmatter(text) {
  if (!text.startsWith("---")) return {};
  const end = text.indexOf("\n---", 3);
  if (end < 0) return {};

  const result = {};
  const lines = text.slice(3, end).trim().split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) continue;
    result[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
  return result;
}

function hasDirectory(root, name) {
  try {
    return fs.statSync(path.join(root, name)).isDirectory();
  } catch {
    return false;
  }
}

function listTopLevelSkillFolders(root) {
  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .filter((name) => fs.existsSync(path.join(root, name, "SKILL.md")));
}

function toToolkitPath(absolutePath) {
  return absolutePath.replace(/\\/g, "/");
}

function relativeFromWorkspace(absolutePath) {
  return toToolkitPath(path.relative(process.cwd(), absolutePath));
}

const folders = listTopLevelSkillFolders(skillBase);
const seeds = [];

for (const folderName of folders) {
  const skillPath = path.join(skillBase, folderName, "SKILL.md");
  const skillText = fs.readFileSync(skillPath, "utf8");
  const meta = parseFrontmatter(skillText);
  const folderPath = path.join(skillBase, folderName);
  const resources = ["references", "rules", "assets", "scripts", "examples", "templates", "agents"].filter((name) =>
    hasDirectory(folderPath, name),
  );

  seeds.push({
    id: `external-${folderName}`,
    source: libraryId,
    category: categoryFor(folderName),
    path: relativeFromWorkspace(skillPath),
    folder: relativeFromWorkspace(folderPath),
    originalName: meta.name || folderName,
    description: meta.description || "",
    resources,
    detect: {
      nameHints: folderName.split(/[-_]+/).filter(Boolean),
    },
    targets: [],
    priority: highPriority.has(folderName) ? "high" : "normal",
  });
}

const manifest = {
  version: 1,
  source: sourceRoot.startsWith("skill-seeds/external/")
    ? sourceRoot
    : path.resolve(sourceRoot),
  importedAt,
  libraryId,
  skillBase: relativeFromWorkspace(skillBase),
  libraryResources: ["agents", "docs", "prompts", "references"].filter((name) => hasDirectory(sourceRoot, name)).map((name) =>
    relativeFromWorkspace(path.join(sourceRoot, name)),
  ),
  policy: {
    language: "ru-generated-output",
    copyMode: "adapt-to-project",
    includeOriginalResources: true,
    excludeFixtures: true,
  },
  count: seeds.length,
  categories: {},
  seeds,
};

fs.mkdirSync(outputDir, { recursive: true });

const byCategory = {};
for (const seed of seeds) {
  if (!byCategory[seed.category]) byCategory[seed.category] = [];
  byCategory[seed.category].push(seed);
}

manifest.categories = Object.fromEntries(
  Object.entries(byCategory)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([category, items]) => [category, items.length]),
);
fs.writeFileSync(path.join(outputDir, `${libraryId}.manifest.json`), `${JSON.stringify(manifest, null, 2)}\n`);

let markdown = "# External Agent Skills Index\n\n";
markdown += `Library: \`${libraryId}\`.\n\n`;
markdown += `Источник: \`${manifest.source}\`.\n\n`;
markdown +=
  "Эта библиотека хранится как external seed source. Ее нельзя копировать в project-local skills без адаптации через RAG/project evidence.\n\n";
markdown += `Всего top-level skills: ${seeds.length}.\n\n`;

for (const category of Object.keys(byCategory).sort()) {
  markdown += `## ${category}\n\n`;
  for (const seed of byCategory[category]) {
    markdown += `- \`${seed.id}\` -> \`${seed.path}\``;
    if (seed.description) {
      markdown += ` - ${seed.description.replace(/\s+/g, " ").slice(0, 220)}`;
    }
    if (seed.resources.length) {
      markdown += ` Ресурсы: ${seed.resources.join(", ")}.`;
    }
    markdown += "\n";
  }
  markdown += "\n";
}

fs.writeFileSync(path.join(outputDir, `${libraryId}.index.md`), markdown);

console.log(JSON.stringify({ count: seeds.length, categories: manifest.categories }, null, 2));
