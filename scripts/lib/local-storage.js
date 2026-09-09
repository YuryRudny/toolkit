"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync, execFileSync } = require("child_process");
const { resolveInside } = require("./path-safety");

const LOCAL_MANIFEST = "agent-storage.json";
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
function overlaps(a, b) {
  const inside = (parent, child) => { const rel = path.relative(parent, child); return !rel || (rel !== ".." && !rel.startsWith(`..${path.sep}`) && !path.isAbsolute(rel)); };
  return inside(a, b) || inside(b, a);
}
function git(root, args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}
function loadLocalStorage(rootArg) {
  const root = fs.realpathSync(rootArg);
  const file = resolveInside(root, LOCAL_MANIFEST, "local storage manifest", { mustExist: true });
  const manifest = JSON.parse(fs.readFileSync(file, "utf8"));
  if (manifest.schemaVersion !== 1 || manifest.mode !== "local" || manifest.publication !== "never" || !ID.test(manifest.id || "")) throw new Error("Local storage requires schemaVersion=1, mode=local, publication=never and a valid id");
  if (Object.hasOwn(manifest, "remote") || Object.hasOwn(manifest, "artifactRepository") || fs.existsSync(path.join(root, "workspace.json"))) throw new Error("Local storage cannot contain Git artifact configuration or workspace.json");
  const probe = spawnSync("git", ["rev-parse", "--absolute-git-dir"], { cwd: root, encoding: "utf8", env: { ...process.env, LC_ALL: "C" } });
  if (probe.error) throw probe.error;
  if (probe.status === 0) throw new Error("Local storage must be outside every Git repository; do not initialize Git or use a Git checkout");
  if (probe.status !== 128 || !/not a git repository/i.test(probe.stderr)) throw new Error("Cannot establish that local storage is outside Git; check Git configuration/permissions");
  const ignoreFile = resolveInside(root, ".gitignore", "local storage gitignore", { mustExist: true });
  const rules = fs.readFileSync(ignoreFile, "utf8").split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith("#"));
  if (rules.length !== 1 || rules[0] !== "*") throw new Error("Local storage .gitignore must ignore everything with a single * rule, without exceptions");
  if (!Array.isArray(manifest.repositories) || !manifest.repositories.length) throw new Error("Local storage requires explicit customer repositories");
  const seen = new Set([manifest.id]);
  const repositories = manifest.repositories.map((repo) => {
    if (!ID.test(repo.id || "") || seen.has(repo.id) || repo.role !== "customer-code" || typeof repo.path !== "string" || !path.isAbsolute(repo.path)) throw new Error("Invalid local storage customer repository id/role/absolute path");
    seen.add(repo.id);
    const repoRoot = fs.realpathSync(repo.path);
    if (overlaps(root, repoRoot)) throw new Error("Local storage and customer roots must not overlap");
    if (fs.realpathSync(git(repoRoot, ["rev-parse", "--show-toplevel"])) !== repoRoot) throw new Error("Customer path must be its explicit Git root");
    return { ...repo, root: repoRoot };
  });
  for (let i = 0; i < repositories.length; i++) for (let j = i + 1; j < repositories.length; j++) {
    if (overlaps(repositories[i].root, repositories[j].root)) throw new Error("Customer roots must not overlap");
  }
  if (typeof manifest.toolkit?.path !== "string" || !path.isAbsolute(manifest.toolkit.path)) throw new Error("Local storage requires an explicit absolute toolkit.path");
  const toolkitRoot = fs.realpathSync(manifest.toolkit.path);
  if ([root, ...repositories.map((repo) => repo.root)].some((other) => overlaps(other, toolkitRoot))) throw new Error("Local storage toolkit must be outside storage and customer roots");
  for (const rel of ["scripts/bootstrap.js", "skills/project-agent-update/SKILL.md"]) resolveInside(toolkitRoot, rel, "local toolkit entrypoint", { mustExist: true });
  return { root, manifest, id: manifest.id, repositories, toolkit: { root: toolkitRoot } };
}

function runLocalCommand(root, args) {
  const local = loadLocalStorage(root);
  const command = args[0] || "status";
  if (command === "update") {
    const { parseUpdateOptions } = require("./update-policy");
    const options = parseUpdateOptions(args.slice(1));
    const result = spawnSync(process.execPath, [path.join(local.toolkit.root, "scripts/bootstrap.js"), "update", local.root, "--check", ...(options.mode ? ["--mode", options.mode] : [])], { cwd: local.root, stdio: "inherit" });
    if (result.error) throw result.error;
    return result.status ?? 1;
  }
  if (!["status", "doctor", "commit-plan"].includes(command) || args.length > 1) throw new Error("Local storage is non-publishing: install/sync/integrations/commit/push are disabled. Use status, doctor, commit-plan or update --check.");
  const violations = [], reviewCandidates = [];
  if (command === "commit-plan") {
    const { inspectRepository } = require("./repository-separation");
    for (const repo of local.repositories) {
      const inventory = inspectRepository(repo.root, { includeIgnored: false });
      for (const item of inventory.artifacts) violations.push({ repository: repo.id, file: item.path, reason: item.reason });
      for (const item of inventory.reviewCandidates) reviewCandidates.push({ repository: repo.id, file: item.path, reason: item.reason });
    }
  }
  console.log(JSON.stringify({
    status: violations.length ? "blocked" : "local-only", storageMode: "local", root: local.root,
    agentSystem: { commit: false, push: false, mergeRequest: false, reason: "publication=never" },
    customerRepositories: local.repositories.map((repo) => ({ id: repo.id, changes: git(repo.root, ["status", "--porcelain=v1", "-uall"]), publication: "only by a separate explicit user request and customer policy" })),
    violations, reviewCandidates,
    limitation: "Read-only local storage status; not a migration, ownership or RAG quality verdict.",
  }, null, 2));
  return violations.length ? 1 : 0;
}

module.exports = { LOCAL_MANIFEST, loadLocalStorage, runLocalCommand };
