#!/usr/bin/env node

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const root = path.resolve(process.argv[2] || process.cwd());
const outPath = path.join(root, "docs", "agent-system", "project-model.json");
const skipDirs = new Set([
  ".git", "node_modules", ".nuxt", ".next", ".output", "dist", "build",
  "coverage", "vendor", ".venv", "venv", "target", "bin", "obj",
  ".yarn", ".tmp", ".idea", "reusable-agent-system-toolkit",
]);

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skipDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    const rel = path.relative(root, full);
    if (entry.isDirectory() && (rel === "docs/agent-system" || rel === "codex-skills")) continue;
    if (entry.isDirectory()) walk(full, acc);
    else acc.push(path.relative(root, full));
  }
  return acc;
}

function readJson(rel) {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
  } catch {
    return null;
  }
}

function readExisting() {
  try {
    return JSON.parse(fs.readFileSync(outPath, "utf8"));
  } catch {
    return null;
  }
}

function command(args) {
  try {
    return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
}

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

function uniq(values) {
  return [...new Set(values.filter(Boolean))];
}

function stableId(prefix, value) {
  const slug = String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 72);
  const suffix = crypto.createHash("sha1").update(String(value)).digest("hex").slice(0, 8);
  return `${prefix}-${slug || "item"}-${suffix}`;
}

function extensionLanguage(file) {
  const ext = path.extname(file).toLowerCase();
  return ({
    ".ts": "typescript", ".tsx": "typescript", ".js": "javascript", ".jsx": "javascript",
    ".vue": "vue", ".py": "python", ".java": "java", ".kt": "kotlin", ".kts": "kotlin",
    ".go": "go", ".rs": "rust", ".cs": "csharp", ".php": "php", ".rb": "ruby",
    ".sql": "sql", ".tf": "terraform", ".swift": "swift", ".m": "objective-c",
  })[ext] || null;
}

function kindForEntry(file) {
  if (/(^|\/)pages\//.test(file)) return "page";
  if (/(^|\/)(routes|controllers|handlers|api)\//.test(file)) return "request-handler";
  if (/(^|\/)(jobs|workers|consumers|commands)\//.test(file)) return "background-entry";
  if (/(^|\/)(migrations|db\/migrate)\//.test(file)) return "migration";
  if (/(^|\/)(main|index|server|app)\.(ts|js|tsx|jsx|py|go|rs|java|kt|cs|php|rb)$/.test(file)) return "runtime-entry";
  if (/Dockerfile$|docker-compose|\.gitlab-ci|\.github\/workflows/.test(file)) return "delivery-entry";
  return null;
}

function mergeById(discovered, previous) {
  const old = new Map((previous || []).map((item) => [item.id, item]));
  return discovered.map((item) => ({ ...item, ...(old.get(item.id) || {}), ...item }));
}

const files = walk(root).sort();
const packageJson = readJson("package.json") || {};
const deps = { ...(packageJson.dependencies || {}), ...(packageJson.devDependencies || {}) };
const pyproject = files.includes("pyproject.toml") || files.some((file) => /^requirements.*\.txt$/.test(file));
const gradle = files.some((file) => /(^|\/)(build\.gradle(?:\.kts)?|settings\.gradle(?:\.kts)?)$/.test(file));
const maven = files.some((file) => /(^|\/)pom\.xml$/.test(file));
const dotnet = files.some((file) => /\.(csproj|sln)$/.test(file));

const capabilities = {
  javascript: files.some((file) => /\.(js|jsx|mjs|cjs)$/.test(file)),
  typescript: files.some((file) => /\.(ts|tsx)$/.test(file)),
  node: Boolean(packageJson.name) || files.includes("package.json"),
  frontend: files.some((file) => /\.(vue|tsx|jsx|html)$/.test(file)) || exists("src/pages") || exists("app"),
  vue: Boolean(deps.vue) || files.some((file) => file.endsWith(".vue")),
  react: Boolean(deps.react) || files.some((file) => file.endsWith(".tsx") || file.endsWith(".jsx")),
  nuxt: Boolean(deps.nuxt) || files.some((file) => /^nuxt\.config\./.test(file)),
  next: Boolean(deps.next) || files.some((file) => /^next\.config\./.test(file)),
  python: pyproject || files.some((file) => file.endsWith(".py")),
  django: Boolean(deps.django) || files.some((file) => /(^|\/)manage\.py$/.test(file)),
  fastapi: files.some((file) => file.endsWith(".py")) && files.some((file) => /fastapi/i.test(file)),
  java: maven || gradle || files.some((file) => file.endsWith(".java")),
  spring: files.some((file) => /application\.(yml|yaml|properties)$/.test(file)) && (maven || gradle),
  kotlin: files.some((file) => /\.kts?$/.test(file)),
  go: files.includes("go.mod") || files.some((file) => file.endsWith(".go")),
  rust: files.includes("Cargo.toml") || files.some((file) => file.endsWith(".rs")),
  dotnet,
  php: files.includes("composer.json") || files.some((file) => file.endsWith(".php")),
  ruby: files.includes("Gemfile") || files.some((file) => file.endsWith(".rb")),
  server: files.some((file) => /(^|\/)(server|api|routes|controllers|handlers)\//.test(file)),
  database: files.some((file) => /(^|\/)(migrations|schema|entities|models|prisma|db)\//.test(file)) || files.some((file) => /\.sql$/.test(file)),
  workers: files.some((file) => /(^|\/)(jobs|workers|consumers|queues)\//.test(file)),
  tests: files.some((file) => /(\.spec\.|\.test\.|__tests__\/|(^|\/)tests?\/|e2e\/)/.test(file)),
  docker: files.some((file) => /(^|\/)Dockerfile$|docker-compose/.test(file)),
  kubernetes: files.some((file) => /(^|\/)(k8s|kubernetes|helm|charts)\//.test(file)),
  terraform: files.some((file) => file.endsWith(".tf")),
  ci: files.some((file) => /^\.github\/workflows\/|^\.gitlab-ci|^azure-pipelines|(^|\/)Jenkinsfile$/.test(file)),
  capacitor: Boolean(deps["@capacitor/core"]) || exists("capacitor.config.ts") || exists("capacitor.config.json"),
  monorepo: exists("packages") || exists("apps") || Boolean(packageJson.workspaces) || exists("pnpm-workspace.yaml"),
};

const manifestPatterns = [
  /^package\.json$/, /^yarn\.lock$/, /^pnpm-lock\.yaml$/, /^package-lock\.json$/,
  /^pyproject\.toml$/, /^poetry\.lock$/, /^requirements.*\.txt$/, /^Pipfile(?:\.lock)?$/,
  /(^|\/)pom\.xml$/, /(^|\/)build\.gradle(?:\.kts)?$/, /^go\.mod$/, /^Cargo\.toml$/,
  /\.(csproj|sln)$/, /^composer\.json$/, /^Gemfile(?:\.lock)?$/,
];
const manifests = files
  .filter((file) => manifestPatterns.some((pattern) => pattern.test(file)))
  .map((file) => ({ path: file, kind: "manifest" }));

const knownRoots = ["src", "app", "pages", "server", "api", "packages", "apps", "lib", "shared", "cmd", "internal", "services"];
const sourceRoots = uniq(knownRoots.filter(exists));
if (!sourceRoots.length) {
  for (const file of files) {
    if (extensionLanguage(file)) sourceRoots.push(file.split("/")[0]);
  }
}

const modulePaths = [];
for (const sourceRoot of uniq(sourceRoots)) {
  const absolute = path.join(root, sourceRoot);
  if (!fs.existsSync(absolute) || !fs.statSync(absolute).isDirectory()) continue;
  const children = fs.readdirSync(absolute, { withFileTypes: true }).filter((entry) => entry.isDirectory());
  if (children.length) children.forEach((entry) => modulePaths.push(path.join(sourceRoot, entry.name)));
  else modulePaths.push(sourceRoot);
}

const discoveredModules = uniq(modulePaths).map((modulePath) => {
  const owned = files.filter((file) => file === modulePath || file.startsWith(`${modulePath}/`));
  return {
    id: stableId("module", modulePath),
    path: modulePath,
    fileCount: owned.length,
    languages: uniq(owned.map(extensionLanguage)).sort(),
    status: "discovered",
    responsibility: "",
    evidence: [],
  };
}).filter((item) => item.fileCount > 0);

const discoveredEntries = files
  .map((file) => ({ file, kind: kindForEntry(file) }))
  .filter((item) => item.kind)
  .slice(0, 300)
  .map(({ file, kind }) => ({
    id: stableId("entry", file),
    path: file,
    kind,
    status: "discovered",
    flowIds: [],
  }));

const rulePatterns = [
  /^AGENTS\.md$/, /(^|\/)CLAUDE\.md$/, /^\.cursorrules$/,
  /^\.github\/copilot-instructions\.md$/,
  /(^|\/)(\.codex|codex-skills|\.cursor|\.claude)\//,
];
const separateRuleFiles = [];
for (const rel of ["AGENTS.md", ".codex", "codex-skills", ".cursor", ".claude", ".github/copilot-instructions.md", "CLAUDE.md", ".cursorrules"]) {
  const absolute = path.join(root, rel);
  if (!fs.existsSync(absolute)) continue;
  if (fs.statSync(absolute).isDirectory()) walk(absolute, separateRuleFiles);
  else separateRuleFiles.push(rel);
}
const existingRules = uniq([...files, ...separateRuleFiles])
  .filter((file) => rulePatterns.some((pattern) => pattern.test(file)))
  .map((file) => ({ path: file, kind: file.endsWith("SKILL.md") ? "skill" : "agent-rule" }));

const fingerprintFiles = files.filter((file) => !rulePatterns.some((pattern) => pattern.test(file)));
const fingerprint = crypto.createHash("sha256")
  .update(fingerprintFiles.map((file) => {
    const stat = fs.statSync(path.join(root, file));
    return `${file}:${stat.size}:${Math.floor(stat.mtimeMs)}`;
  }).join("\n"))
  .digest("hex");

const previous = readExisting();
const now = new Date().toISOString();
const model = {
  schemaVersion: 1,
  projectRoot: root,
  generatedAt: previous?.generatedAt || now,
  updatedAt: now,
  fingerprint,
  capabilities,
  manifests,
  sourceRoots: uniq(sourceRoots),
  modules: mergeById(discoveredModules, previous?.modules),
  entryPoints: mergeById(discoveredEntries, previous?.entryPoints),
  existingRules,
  criticalFlows: previous?.criticalFlows || [],
  boundaries: previous?.boundaries || [],
  findings: previous?.findings || [],
  gaps: previous?.gaps || [],
  integrations: {
    git: {
      remote: command(["config", "--get", "remote.origin.url"]),
      branch: command(["branch", "--show-current"]),
    },
    ...(previous?.integrations || {}),
  },
  research: previous?.research || { status: "pending", completedTaskIds: [], stale: false },
  skillPlan: previous?.skillPlan || { selectedSeeds: [], targetSkills: [] },
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, `${JSON.stringify(model, null, 2)}\n`);
console.log(`Project model created: ${path.relative(root, outPath)} (${model.modules.length} modules, ${model.entryPoints.length} entry points)`);
