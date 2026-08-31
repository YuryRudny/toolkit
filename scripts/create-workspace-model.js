#!/usr/bin/env node

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { loadWorkspace, repoUri, writeArtifact, git } = require("./lib/workspace");

const workspace = loadWorkspace(process.argv[2] || process.cwd());
const outRel = "docs/agent-system/project-model.json";
const outPath = path.join(workspace.artifactRoot, outRel);
const skipDirs = new Set([
  ".git", "node_modules", ".nuxt", ".next", ".output", "dist", "build", "coverage",
  "vendor", ".venv", "venv", "target", "bin", "obj", ".yarn", ".tmp", ".idea", ".gradle",
]);

function walk(repoRoot, dir = repoRoot, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skipDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) walk(repoRoot, full, acc);
    else acc.push(path.relative(repoRoot, full).replace(/\\/g, "/"));
  }
  return acc;
}

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return null; }
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

function entryKind(file) {
  if (/(^|\/)pages\/(?:[^/]+\.(ts|tsx|js|jsx|vue)|.*\/(index|route|router)\.(ts|tsx|js|jsx|vue))$/i.test(file)) return "page";
  if (/(Controller\.java$|(^|\/)(routes?|controllers?|handlers?)\/)/i.test(file)) return "request-handler";
  if (/(^|\/)(jobs?|workers?|consumers?|listeners?|commands?|schedulers?|polling)\//i.test(file)) return "background-entry";
  if (/(^|\/)(migrations|db\/migrate)\//i.test(file)) return "migration";
  if (/(^|\/)(main|index|server|app|application)\.(ts|js|tsx|jsx|py|go|rs|java|kt|cs|php|rb)$/i.test(file)) return "runtime-entry";
  if (/Dockerfile$|docker-compose|\.gitlab-ci|\.github\/workflows/i.test(file)) return "delivery-entry";
  return null;
}

function stableId(prefix, value) {
  const slug = String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 62);
  const suffix = crypto.createHash("sha1").update(String(value)).digest("hex").slice(0, 8);
  return `${prefix}-${slug || "item"}-${suffix}`;
}

function uniq(values) { return [...new Set(values.filter(Boolean))]; }

function discover(repo) {
  const files = walk(repo.root).sort();
  const exists = (rel) => fs.existsSync(path.join(repo.root, rel));
  const packageJson = readJson(path.join(repo.root, "package.json")) || {};
  const deps = { ...(packageJson.dependencies || {}), ...(packageJson.devDependencies || {}) };
  const gradle = files.some((file) => /(^|\/)(build\.gradle(?:\.kts)?|settings\.gradle(?:\.kts)?)$/.test(file));
  const maven = files.some((file) => /(^|\/)pom\.xml$/.test(file));
  const capabilities = {
    javascript: files.some((file) => /\.(js|jsx|mjs|cjs)$/.test(file)),
    typescript: files.some((file) => /\.(ts|tsx)$/.test(file)),
    node: Boolean(packageJson.name),
    frontend: files.some((file) => /\.(vue|tsx|jsx|html)$/.test(file)),
    vue: Boolean(deps.vue) || files.some((file) => file.endsWith(".vue")),
    react: Boolean(deps.react) || files.some((file) => /\.(tsx|jsx)$/.test(file)),
    java: maven || gradle || files.some((file) => file.endsWith(".java")),
    spring: (maven || gradle) && files.some((file) => /application\.(yml|yaml|properties)$/.test(file)),
    kotlin: files.some((file) => /\.kts?$/.test(file)),
    server: files.some((file) => /(^|\/)(server|api|routes|controllers|handlers)\//i.test(file)) || maven || gradle,
    database: files.some((file) => /(^|\/)(migrations|schema|entities|models|repositories|db)\//i.test(file)) || files.some((file) => file.endsWith(".sql")),
    workers: files.some((file) => /(^|\/)(jobs?|workers?|consumers?|listeners?|queues?|schedulers?|polling)\//i.test(file)),
    tests: files.some((file) => /(\.spec\.|\.test\.|__tests__\/|(^|\/)tests?\/)/.test(file)),
    docker: files.some((file) => /(^|\/)Dockerfile$|docker-compose/.test(file)),
    kubernetes: files.some((file) => /(^|\/)(k8s|kubernetes|helm|charts)\//.test(file)),
    ci: files.some((file) => /^\.github\/workflows\/|^\.gitlab-ci|(^|\/)Jenkinsfile$/.test(file)),
  };
  const manifestPatterns = [
    /^package\.json$/, /^yarn\.lock$/, /^pnpm-lock\.yaml$/, /^package-lock\.json$/,
    /(^|\/)pom\.xml$/, /(^|\/)build\.gradle(?:\.kts)?$/, /(^|\/)settings\.gradle(?:\.kts)?$/,
  ];
  const manifests = files.filter((file) => manifestPatterns.some((pattern) => pattern.test(file)))
    .map((file) => ({ path: repoUri(repo.id, file), kind: "manifest", repoId: repo.id }));
  const knownRoots = ["src", "app", "pages", "server", "api", "packages", "apps", "lib", "shared", "services"];
  const sourceRoots = uniq(knownRoots.filter(exists));
  if (!sourceRoots.length) {
    for (const file of files) if (extensionLanguage(file)) sourceRoots.push(file.split("/")[0]);
  }
  const modulePaths = [];
  for (const sourceRoot of uniq(sourceRoots)) {
    const absolute = path.join(repo.root, sourceRoot);
    if (!fs.existsSync(absolute) || !fs.statSync(absolute).isDirectory()) continue;
    const children = fs.readdirSync(absolute, { withFileTypes: true }).filter((entry) => entry.isDirectory() && !skipDirs.has(entry.name));
    if (children.length) children.forEach((entry) => modulePaths.push(path.join(sourceRoot, entry.name).replace(/\\/g, "/")));
    else modulePaths.push(sourceRoot);
  }
  const modules = uniq(modulePaths).map((modulePath) => {
    const owned = files.filter((file) => file === modulePath || file.startsWith(`${modulePath}/`));
    const uri = repoUri(repo.id, modulePath);
    return {
      id: stableId("module", uri), repoId: repo.id, path: uri, relativePath: modulePath,
      fileCount: owned.length, languages: uniq(owned.map(extensionLanguage)).sort(),
      status: "discovered", responsibility: "", evidence: [],
    };
  }).filter((item) => item.fileCount > 0);
  const entryPoints = files.map((file) => ({ file, kind: entryKind(file) })).filter((item) => item.kind).slice(0, 500)
    .map(({ file, kind }) => {
      const uri = repoUri(repo.id, file);
      return { id: stableId("entry", uri), repoId: repo.id, path: uri, relativePath: file, kind, status: "discovered", flowIds: [] };
    });
  const rulePattern = /(^|\/)(AGENTS(?:\.override)?\.md|CLAUDE\.md|\.cursorrules)$|(^|\/)(\.codex|codex-skills|\.cursor|\.claude)\//;
  const existingRules = files.filter((file) => rulePattern.test(file))
    .map((file) => ({ path: repoUri(repo.id, file), kind: file.endsWith("SKILL.md") ? "skill" : "agent-rule", repoId: repo.id }));
  return {
    id: repo.id, role: repo.role, root: repo.root, remote: repo.actualRemote,
    head: git(repo.root, ["rev-parse", "HEAD"], ""), branch: git(repo.root, ["branch", "--show-current"], ""),
    files, capabilities, manifests, sourceRoots: sourceRoots.map((root) => repoUri(repo.id, root)),
    modules, entryPoints, existingRules,
  };
}

const previous = readJson(outPath);
const repositories = workspace.repositories.map(discover);
const capabilityNames = uniq(repositories.flatMap((repo) => Object.keys(repo.capabilities)));
const capabilities = Object.fromEntries(capabilityNames.map((name) => [name, repositories.some((repo) => repo.capabilities[name])]));
const fingerprint = crypto.createHash("sha256")
  .update(repositories.map((repo) => `${repo.id}:${repo.head}:${repo.files.length}`).join("\n"))
  .digest("hex");
const previousModules = new Map((previous?.modules || []).map((item) => [item.id, item]));
const previousEntries = new Map((previous?.entryPoints || []).map((item) => [item.id, item]));
const now = new Date().toISOString();
const model = {
  schemaVersion: 2,
  mode: "sidecar-workspace",
  projectRoot: repoUri(workspace.artifact.id),
  workspace: {
    id: workspace.manifest.workspaceId,
    artifactRepository: { id: workspace.artifact.id, remote: workspace.artifact.actualRemote },
    repositories: repositories.map(({ root, files, modules, entryPoints, manifests, existingRules, capabilities, sourceRoots, ...repo }) => repo),
  },
  generatedAt: previous?.generatedAt || now,
  updatedAt: now,
  fingerprint,
  capabilities,
  manifests: repositories.flatMap((repo) => repo.manifests),
  sourceRoots: repositories.flatMap((repo) => repo.sourceRoots),
  modules: repositories.flatMap((repo) => repo.modules).map((item) => ({ ...item, ...(previousModules.get(item.id) || {}), ...item })),
  entryPoints: repositories.flatMap((repo) => repo.entryPoints).map((item) => ({ ...item, ...(previousEntries.get(item.id) || {}), ...item })),
  existingRules: repositories.flatMap((repo) => repo.existingRules),
  criticalFlows: previous?.criticalFlows || [],
  boundaries: previous?.boundaries || [],
  findings: previous?.findings || [],
  gaps: previous?.gaps || [],
  integrations: {
    git: { remote: workspace.artifact.actualRemote, branch: git(workspace.artifactRoot, ["branch", "--show-current"], "") },
    sources: repositories.map((repo) => ({ id: repo.id, remote: repo.remote, branch: repo.branch, head: repo.head })),
    ...(previous?.integrations || {}),
    enterprise: workspace.manifest.integrations
      ? {
          enabled: true,
          mcpServerName: workspace.manifest.integrations.mcpServerName || `${workspace.manifest.workspaceId}-enterprise`,
      requiredServices: workspace.manifest.integrations.requiredServices || ["jira", "confluence", "gitlab", "figma"],
      insecureTlsOrigins: workspace.manifest.integrations.insecureTlsOrigins || [],
      credentialSource: "machine-local-env",
          secretValuesStored: false,
        }
      : { enabled: false },
  },
  research: previous?.research
    ? { ...previous.research, stale: previous.fingerprint !== fingerprint }
    : { status: "pending", completedTaskIds: [], stale: false },
  skillPlan: previous?.skillPlan || { selectedSeeds: [], targetSkills: [] },
};

writeArtifact(workspace, outRel, `${JSON.stringify(model, null, 2)}\n`);
console.log(`Workspace model created: ${outRel} (${repositories.length} repositories, ${model.modules.length} modules, ${model.entryPoints.length} entry points)`);
