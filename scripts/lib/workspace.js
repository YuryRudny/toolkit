const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

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
  return fs.existsSync(resolved) ? fs.realpathSync(resolved) : resolved;
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
    }).trim();
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

  const artifact = manifest.artifactRepository || {};
  if (!REPO_ID.test(artifact.id || "")) fail("artifactRepository.id must be lowercase kebab-case");
  const artifactGitRoot = git(artifactRoot, ["rev-parse", "--show-toplevel"], null);
  if (realOrResolved(artifactGitRoot) !== artifactRoot) {
    fail(`Artifact root must be its Git root: ${artifactRoot}`);
  }
  const actualArtifactRemote = git(artifactRoot, ["remote", "get-url", "origin"], "");
  if (artifact.remote && normalizeRemote(actualArtifactRemote) !== normalizeRemote(artifact.remote)) {
    fail(`Artifact remote mismatch: expected ${artifact.remote}, got ${actualArtifactRemote || "<none>"}`);
  }

  const seen = new Set([artifact.id]);
  const repositories = manifest.repositories.map((repo) => {
    if (!REPO_ID.test(repo.id || "")) fail(`Invalid repository id: ${repo.id}`);
    if (seen.has(repo.id)) fail(`Duplicate repository id: ${repo.id}`);
    seen.add(repo.id);
    if (repo.role !== "customer-code") fail(`Repository ${repo.id} must have role customer-code`);
    if (!repo.path) fail(`Repository ${repo.id} is missing path`);
    const repoRoot = realOrResolved(path.resolve(artifactRoot, repo.path));
    if (!fs.existsSync(repoRoot)) fail(`Repository ${repo.id} does not exist: ${repoRoot}`);
    const actualRoot = realOrResolved(git(repoRoot, ["rev-parse", "--show-toplevel"], null));
    if (actualRoot !== repoRoot) fail(`Repository ${repo.id} path is not its Git root: ${repoRoot}`);
    if (isInside(repoRoot, artifactRoot) || isInside(artifactRoot, repoRoot)) {
      fail(`Artifact and source repositories must be siblings: ${repo.id}`);
    }
    const actualRemote = git(repoRoot, ["remote", "get-url", "origin"], "");
    if (repo.remote && normalizeRemote(actualRemote) !== normalizeRemote(repo.remote)) {
      fail(`Remote mismatch for ${repo.id}: expected ${repo.remote}, got ${actualRemote || "<none>"}`);
    }
    return { ...repo, root: repoRoot, actualRemote };
  });

  return {
    artifactRoot,
    manifestPath,
    manifest,
    artifact: { ...artifact, root: artifactRoot, actualRemote: actualArtifactRemote },
    repositories,
  };
}

function sourceStatus(repo) {
  const status = git(repo.root, ["status", "--porcelain=v1", "-uall"], null);
  const head = git(repo.root, ["rev-parse", "HEAD"], "");
  const branch = git(repo.root, ["branch", "--show-current"], "");
  const digest = crypto.createHash("sha256").update(`${head}\n${status}`).digest("hex");
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
  sourceSnapshot,
  sourceStatus,
  writeArtifact,
};
