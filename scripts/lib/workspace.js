const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { gitSourceState } = require("./source-state");

const MANIFEST_NAME = "workspace.json";
const REPO_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    fail(`Cannot read JSON ${file}: ${error.message}`);
  }
}

function realOrResolved(value) {
  const resolved = path.resolve(value);
  try { return fs.realpathSync(resolved); } catch (error) {
    if (error.code !== "ENOENT") throw error;
    // Resolve the existing ancestor, including symlinks, before appending a new leaf.
    if (fs.existsSync(path.dirname(resolved)) && fs.lstatSync(resolved, { throwIfNoEntry: false })?.isSymbolicLink()) {
      fail(`Dangling symbolic link: ${resolved}`);
    }
    const parent = path.dirname(resolved);
    if (parent === resolved) throw error;
    return path.join(realOrResolved(parent), path.basename(resolved));
  }
}

function isInside(parent, child) {
  const rel = path.relative(realOrResolved(parent), realOrResolved(child));
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

function assertInside(parent, child, label = "path") {
  if (!isInside(parent, child)) fail(`${label} escapes artifact root: ${child}`);
  return path.resolve(child);
}

function git(cwd, args, fallback = "") {
  try {
    return execFileSync("git", args, {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trimEnd();
  } catch (error) {
    if (fallback !== null) return fallback;
    const detail = String(error.stderr || error.message).trim();
    fail(`git ${args.join(" ")} failed in ${cwd}: ${detail}`);
  }
}

function normalizeRemote(value) {
  return String(value || "").replace(/\.git$/, "").replace(/\/$/, "");
}

function loadWorkspace(artifactRootArg) {
  const artifactRoot = realOrResolved(artifactRootArg || process.cwd());
  const manifestPath = path.join(artifactRoot, MANIFEST_NAME);
  if (!fs.existsSync(manifestPath)) fail(`Missing ${MANIFEST_NAME} in artifact root: ${artifactRoot}`);
  const manifest = readJson(manifestPath);
  if (manifest.schemaVersion !== 1) fail(`Unsupported workspace schemaVersion: ${manifest.schemaVersion}`);
  if (!REPO_ID.test(manifest.workspaceId || "")) fail("workspaceId must be lowercase kebab-case");
  if (!Array.isArray(manifest.repositories) || manifest.repositories.length === 0) {
    fail("workspace.json must contain repositories");
  }
  if (manifest.integrations) {
    const settings = manifest.integrations;
    if (settings.mcpServerName !== undefined && !REPO_ID.test(settings.mcpServerName)) fail("Invalid integrations.mcpServerName");
    if (settings.requiredServices !== undefined && (!Array.isArray(settings.requiredServices) || settings.requiredServices.some((name) => !["jira", "confluence", "gitlab", "figma"].includes(name)) || new Set(settings.requiredServices).size !== settings.requiredServices.length)) fail("Invalid integrations.requiredServices");
    if (settings.localConfig !== undefined && (typeof settings.localConfig !== "string" || !/^\.local\/[a-z0-9-]+\.json$/.test(settings.localConfig))) fail("integrations.localConfig must be a JSON file directly under .local/");
  }

  const artifact = manifest.artifactRepository || {};
  if (!REPO_ID.test(artifact.id || "")) fail("artifactRepository.id must be lowercase kebab-case");
  if (typeof artifact.remote !== "string" || !artifact.remote.trim()) fail("artifactRepository.remote is required");
  const artifactGitRoot = git(artifactRoot, ["rev-parse", "--show-toplevel"], null);
  if (realOrResolved(artifactGitRoot) !== artifactRoot) {
    fail(`Artifact root must be its Git root: ${artifactRoot}`);
  }
  const actualArtifactRemote = git(artifactRoot, ["remote", "get-url", "origin"], "");
  if (artifact.remote && normalizeRemote(actualArtifactRemote) !== normalizeRemote(artifact.remote)) {
    fail(`Artifact remote mismatch: expected ${artifact.remote}, got ${actualArtifactRemote || "<none>"}`);
  }

  const seen = new Set([artifact.id]);
  const sourceRoots = new Set();
  const repositories = manifest.repositories.map((repo) => {
    if (!REPO_ID.test(repo.id || "")) fail(`Invalid repository id: ${repo.id}`);
    if (seen.has(repo.id)) fail(`Duplicate repository id: ${repo.id}`);
    seen.add(repo.id);
    if (repo.role !== "customer-code") fail(`Repository ${repo.id} must have role customer-code`);
    if (!repo.path) fail(`Repository ${repo.id} is missing path`);
    if (typeof repo.remote !== "string" || !repo.remote.trim()) fail(`Repository ${repo.id} is missing remote`);
    const repoRoot = realOrResolved(path.resolve(artifactRoot, repo.path));
    if (!fs.existsSync(repoRoot)) fail(`Repository ${repo.id} does not exist: ${repoRoot}`);
    const actualRoot = realOrResolved(git(repoRoot, ["rev-parse", "--show-toplevel"], null));
    if (actualRoot !== repoRoot) fail(`Repository ${repo.id} path is not its Git root: ${repoRoot}`);
    if (isInside(repoRoot, artifactRoot) || isInside(artifactRoot, repoRoot)) {
      fail(`Artifact and source repositories must be siblings: ${repo.id}`);
    }
    for (const other of sourceRoots) if (isInside(other, repoRoot) || isInside(repoRoot, other)) fail(`Source repositories overlap: ${repo.id}`);
    sourceRoots.add(repoRoot);
    const actualRemote = git(repoRoot, ["remote", "get-url", "origin"], "");
    if (repo.remote && normalizeRemote(actualRemote) !== normalizeRemote(repo.remote)) {
      fail(`Remote mismatch for ${repo.id}: expected ${repo.remote}, got ${actualRemote || "<none>"}`);
    }
    return { ...repo, root: repoRoot, actualRemote };
  });

  const toolkit = manifest.toolkit;
  if (!toolkit || typeof toolkit.path !== "string" || !toolkit.path || typeof toolkit.remote !== "string" || !toolkit.remote) fail("workspace toolkit.path and toolkit.remote are required");
  const toolkitRoot = realOrResolved(path.resolve(artifactRoot, toolkit.path));
  if (!fs.existsSync(path.join(toolkitRoot, "skills/project-agent-bootstrap/SKILL.md"))) fail("Manifest toolkit path does not contain bootstrap SKILL.md");
  if (realOrResolved(git(toolkitRoot, ["rev-parse", "--show-toplevel"], null)) !== toolkitRoot) fail("Toolkit path must be its Git root");
  if (normalizeRemote(git(toolkitRoot, ["remote", "get-url", "origin"], null)) !== normalizeRemote(toolkit.remote)) fail("Toolkit remote mismatch");
  for (const other of [artifactRoot, ...sourceRoots]) if (isInside(other, toolkitRoot) || isInside(toolkitRoot, other)) fail("Toolkit must be separate from artifact and source repositories");

  return {
    artifactRoot,
    manifestPath,
    manifest,
    artifact: { ...artifact, root: artifactRoot, actualRemote: actualArtifactRemote },
    repositories,
    toolkit: { ...toolkit, root: toolkitRoot },
  };
}

function sourceStatus(repo) {
  const { status, head, digest } = gitSourceState(repo.root);
  const branch = git(repo.root, ["branch", "--show-current"], "");
  return {
    id: repo.id,
    role: repo.role,
    head,
    branch,
    remote: repo.actualRemote,
    status,
    digest,
  };
}

function sourceSnapshot(workspace) {
  return {
    schemaVersion: 1,
    workspaceId: workspace.manifest.workspaceId,
    capturedAt: new Date().toISOString(),
    repositories: workspace.repositories.map(sourceStatus),
  };
}

function writeArtifact(workspace, relativePath, content) {
  const target = assertInside(workspace.artifactRoot, path.join(workspace.artifactRoot, relativePath), "write target");
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
  return target;
}

function resolveSourcePath(root, value) {
  if (!value.startsWith("repo://")) return assertInside(root, path.resolve(root, value), "source path");
  const match = /^repo:\/\/([a-z0-9-]+)(?:\/(.*))?$/.exec(value);
  if (!match) fail(`Invalid repository URI: ${value}`);
  const local = fs.existsSync(path.join(root, "agent-storage.json")) ? require("./local-storage").loadLocalStorage(root) : null;
  const workspace = local ? { artifact: { id: local.id, root: local.root }, repositories: local.repositories } : loadWorkspace(root);
  const repo = [workspace.artifact, ...workspace.repositories].find((item) => item.id === match[1]);
  if (!repo) fail(`Unknown repository in URI: ${value}`);
  return assertInside(repo.root, path.resolve(repo.root, match[2] || "."), "source URI");
}

function repoUri(repoId, relativePath = "") {
  const clean = String(relativePath).replace(/^\/+/, "").replace(/\\/g, "/");
  return `repo://${repoId}${clean ? `/${clean}` : ""}`;
}

module.exports = {
  MANIFEST_NAME,
  assertInside,
  git,
  isInside,
  loadWorkspace,
  readJson,
  repoUri,
  realOrResolved,
  resolveSourcePath,
  sourceSnapshot,
  sourceStatus,
  writeArtifact,
};
