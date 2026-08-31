#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execFileSync, spawnSync } = require("child_process");

const artifactRoot = path.resolve(__dirname, "..");
const manifestPath = path.join(artifactRoot, "workspace.json");
const forbiddenAgentArtifact = /(^|\/)(AGENTS(?:\.override)?\.md|\.agents|\.codex|codex-skills|docs\/agent-system|reusable-agent-system-toolkit)(\/|$)/;
const enterpriseServerPath = path.join(artifactRoot, "bin", "enterprise-mcp.js");
const gitCredentialHelperPath = path.join(artifactRoot, "bin", "git-credential-env.js");

function fail(message) {
  console.error(message);
  process.exit(1);
}

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); }
  catch (error) { fail(`Cannot read ${file}: ${error.message}`); }
}

function git(cwd, args, fallback = null) {
  try {
    return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  } catch (error) {
    if (fallback !== null) return fallback;
    fail(`git ${args.join(" ")} failed in ${cwd}: ${String(error.stderr || error.message).trim()}`);
  }
}

function normalizeRemote(value) {
  return String(value || "").replace(/\.git$/, "").replace(/\/$/, "");
}

function shellQuote(value) {
  return `'${String(value).replaceAll("'", `'"'"'`)}'`;
}

function remoteOrigin(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.origin : null;
  } catch {
    return null;
  }
}

function resolveWorkspace() {
  const manifest = readJson(manifestPath);
  const local = manifest.localIntegration || {};
  const workspaceRoot = path.resolve(artifactRoot, local.workspaceRoot || "..");
  const artifactRemote = git(artifactRoot, ["remote", "get-url", "origin"], "");
  if (normalizeRemote(artifactRemote) !== normalizeRemote(manifest.artifactRepository.remote)) {
    fail(`Artifact remote mismatch: expected ${manifest.artifactRepository.remote}, got ${artifactRemote || "<none>"}`);
  }
  const repositories = manifest.repositories.map((repo) => {
    const root = path.resolve(artifactRoot, repo.path);
    if (!fs.existsSync(root)) fail(`Missing customer repository ${repo.id}: ${root}`);
    const gitRoot = path.resolve(git(root, ["rev-parse", "--show-toplevel"]));
    if (gitRoot !== root) fail(`${repo.id} path is not its Git root: ${root}`);
    const remote = git(root, ["remote", "get-url", "origin"], "");
    if (normalizeRemote(remote) !== normalizeRemote(repo.remote)) {
      fail(`Remote mismatch for ${repo.id}: expected ${repo.remote}, got ${remote || "<none>"}`);
    }
    return { ...repo, root, remote };
  });
  return { manifest, local, workspaceRoot, repositories };
}

function relativeTarget(linkPath, targetPath) {
  return path.relative(path.dirname(linkPath), targetPath) || ".";
}

function ensureLink(linkPath, targetPath) {
  fs.mkdirSync(path.dirname(linkPath), { recursive: true });
  const desired = relativeTarget(linkPath, targetPath);
  try {
    const stat = fs.lstatSync(linkPath);
    if (!stat.isSymbolicLink()) fail(`Refusing to replace local path: ${linkPath}`);
    if (fs.readlinkSync(linkPath) === desired) return "unchanged";
    fail(`Refusing to replace foreign symlink: ${linkPath}`);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  fs.symlinkSync(desired, linkPath);
  return "created";
}

function install() {
  const workspace = resolveWorkspace();
  const agentsFile = path.resolve(workspace.workspaceRoot, workspace.local.agentsFile || "AGENTS.md");
  const skillsDirectory = path.resolve(workspace.workspaceRoot, workspace.local.skillsDirectory || ".agents/skills");
  const agentsResult = ensureLink(agentsFile, path.join(artifactRoot, "AGENTS.md"));
  const skillsResult = ensureLink(skillsDirectory, path.join(artifactRoot, "codex-skills", "skills"));
  console.log(`Local integration ready: AGENTS.md ${agentsResult}; skills ${skillsResult}`);
  if (workspace.manifest.integrations) {
    const localConfigPath = integrationConfigPath(workspace.manifest);
    if (!fs.existsSync(localConfigPath)) {
      console.log("Enterprise integrations are not configured on this machine. Run: agentctl.js integrations configure /absolute/path/to/.env");
    }
  }
}

function integrationSettings(manifest) {
  const settings = manifest.integrations || {};
  const mcpServerName = settings.mcpServerName || `${manifest.workspaceId}-enterprise`;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(mcpServerName)) fail(`Invalid integrations.mcpServerName: ${mcpServerName}`);
  const insecureTlsOrigins = (settings.insecureTlsOrigins || []).map((value) => {
    let url;
    try { url = new URL(value); }
    catch { fail(`Invalid integrations.insecureTlsOrigins value: ${value}`); }
    if (url.protocol !== "https:" || url.pathname !== "/" || url.search || url.hash || url.username || url.password) {
      fail(`integrations.insecureTlsOrigins must contain HTTPS origins without path: ${value}`);
    }
    return url.origin;
  });
  return {
    mcpServerName,
    localConfig: settings.localConfig || ".local/integrations.json",
    requiredServices: settings.requiredServices || ["jira", "confluence", "gitlab", "figma"],
    insecureTlsOrigins,
  };
}

function integrationConfigPath(manifest) {
  const output = path.resolve(artifactRoot, integrationSettings(manifest).localConfig);
  if (output !== artifactRoot && !output.startsWith(`${artifactRoot}${path.sep}`)) {
    fail("integrations.localConfig must stay inside the agent-system repository.");
  }
  return output;
}

function localIntegrationConfig(manifest) {
  const configFile = integrationConfigPath(manifest);
  if (!fs.existsSync(configFile)) {
    fail("Enterprise integrations are not configured. Run integrations configure with the user-provided env path.");
  }
  try { return JSON.parse(fs.readFileSync(configFile, "utf8")); }
  catch (error) { fail(`Cannot read local integration config: ${error.message}`); }
}

function readOptionalCaFile(envFile) {
  const lines = fs.readFileSync(envFile, "utf8").split(/\r?\n/);
  const line = lines.find((item) => /^(?:\s*export\s+)?ENTERPRISE_CA_FILE\s*=/.test(item));
  if (!line) return null;
  let value = line.replace(/^(?:\s*export\s+)?ENTERPRISE_CA_FILE\s*=\s*/, "").trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  } else {
    value = value.replace(/\s+#.*$/, "").trim();
  }
  if (!value) return null;
  if (!path.isAbsolute(value)) fail("ENTERPRISE_CA_FILE must be an absolute path.");
  let stat;
  try { stat = fs.statSync(value); }
  catch (error) { fail(`Cannot read ENTERPRISE_CA_FILE: ${error.message}`); }
  if (!stat.isFile()) fail("ENTERPRISE_CA_FILE must point to a regular PEM file.");
  fs.accessSync(value, fs.constants.R_OK);
  return path.resolve(value);
}

function enterpriseChildEnv(manifest) {
  const localConfig = localIntegrationConfig(manifest);
  return localConfig.caFile
    ? { ...process.env, NODE_EXTRA_CA_CERTS: localConfig.caFile }
    : process.env;
}

function runEnterprise(manifest, args, options = {}) {
  if (!fs.existsSync(enterpriseServerPath)) fail(`Missing enterprise MCP runtime: ${enterpriseServerPath}`);
  const localConfigPath = integrationConfigPath(manifest);
  localIntegrationConfig(manifest);
  const result = spawnSync(process.execPath, [enterpriseServerPath, "--config", localConfigPath, ...args], {
    cwd: artifactRoot,
    encoding: "utf8",
    env: enterpriseChildEnv(manifest),
    stdio: options.capture ? ["ignore", "pipe", "pipe"] : "inherit",
  });
  if (options.capture) return result;
  if (result.status !== 0) process.exit(result.status || 1);
  return result;
}

function parseChildJson(result, action) {
  if (result.status !== 0) fail(`${action} failed: ${String(result.stderr || result.stdout || "unknown error").trim()}`);
  try { return JSON.parse(result.stdout); }
  catch { fail(`${action} returned invalid JSON.`); }
}

function installEnterpriseMcp(manifest) {
  const settings = integrationSettings(manifest);
  const localConfigPath = integrationConfigPath(manifest);
  const localConfig = localIntegrationConfig(manifest);
  const codexBin = process.env.BSG_CODEX_BIN || "codex";
  const existing = spawnSync(codexBin, ["mcp", "get", settings.mcpServerName, "--json"], { encoding: "utf8" });
  if (existing.error?.code === "ENOENT") fail("Codex CLI is not available; cannot install the enterprise MCP server.");
  if (existing.status === 0) {
    const removed = spawnSync(codexBin, ["mcp", "remove", settings.mcpServerName], { encoding: "utf8", stdio: "inherit" });
    if (removed.status !== 0) fail(`Cannot replace existing MCP server ${settings.mcpServerName}.`);
  }
  const addArguments = ["mcp", "add"];
  if (localConfig.caFile) addArguments.push("--env", `NODE_EXTRA_CA_CERTS=${localConfig.caFile}`);
  addArguments.push(settings.mcpServerName, "--", process.execPath, enterpriseServerPath, "--config", localConfigPath);
  const added = spawnSync(codexBin, addArguments, { encoding: "utf8", stdio: "inherit" });
  if (added.status !== 0) fail(`Cannot install MCP server ${settings.mcpServerName}.`);
  console.log(`Codex MCP server installed: ${settings.mcpServerName}`);
}

function configureIntegrations() {
  const workspace = resolveWorkspace();
  const envArgument = process.argv[4];
  if (!envArgument || envArgument.startsWith("--")) {
    fail("Usage: agentctl.js integrations configure /absolute/path/to/.env [--skip-mcp-install] [--skip-probe]");
  }
  const envFile = path.resolve(envArgument);
  let stat;
  try { stat = fs.statSync(envFile); }
  catch (error) { fail(`Cannot read env file: ${error.message}`); }
  if (!stat.isFile()) fail(`Env path is not a regular file: ${envFile}`);
  fs.accessSync(envFile, fs.constants.R_OK);
  if ((stat.mode & 0o077) !== 0) {
    console.error("Warning: env file is readable by group or other users; chmod 600 is recommended.");
  }
  const caFile = readOptionalCaFile(envFile);
  const insecureTlsOrigins = integrationSettings(workspace.manifest).insecureTlsOrigins;
  const localConfigPath = integrationConfigPath(workspace.manifest);
  fs.mkdirSync(path.dirname(localConfigPath), { recursive: true, mode: 0o700 });
  fs.writeFileSync(localConfigPath, `${JSON.stringify({
    schemaVersion: 1,
    workspaceId: workspace.manifest.workspaceId,
    envFile,
    ...(caFile ? { caFile } : {}),
    ...(insecureTlsOrigins.length ? { insecureTlsOrigins } : {}),
    configuredAt: new Date().toISOString(),
  }, null, 2)}\n`, { mode: 0o600 });
  fs.chmodSync(localConfigPath, 0o600);

  configureGitTransport(workspace);

  const statusResult = runEnterprise(workspace.manifest, ["--status"], { capture: true });
  const status = parseChildJson(statusResult, "Enterprise configuration validation");
  const required = integrationSettings(workspace.manifest).requiredServices;
  const missing = required.filter((kind) => kind !== "gitlab" && !status.services.some((item) => item.kind === kind && item.configured));
  if (missing.length) {
    fail(`Env file is missing required integration configuration: ${missing.join(", ")}. Secret values were not printed.`);
  }
  console.log(`Local enterprise config created: ${localConfigPath} (secret values remain only in ${envFile})`);
  if (!process.argv.includes("--skip-mcp-install")) installEnterpriseMcp(workspace.manifest);
  if (!process.argv.includes("--skip-probe")) integrationDoctor();
}

function configureGitTransport(workspace) {
  if (!fs.existsSync(gitCredentialHelperPath)) fail(`Missing Git credential runtime: ${gitCredentialHelperPath}`);
  const settings = integrationSettings(workspace.manifest);
  const helper = `!${shellQuote(process.execPath)} ${shellQuote(gitCredentialHelperPath)} --config ${shellQuote(integrationConfigPath(workspace.manifest))}`;
  for (const repo of workspace.repositories) {
    const origin = remoteOrigin(repo.remote);
    if (!origin) continue;
    const helpers = git(repo.root, ["config", "--local", "--get-all", "credential.helper"], "").split(/\r?\n/).filter(Boolean);
    if (!helpers.includes(helper)) git(repo.root, ["config", "--local", "--add", "credential.helper", helper]);
    if (settings.insecureTlsOrigins.includes(origin)) {
      git(repo.root, ["config", "--local", `http.${origin}.sslVerify`, "false"]);
    }
  }
  console.log("Native Git transport configured: system credential helpers first, local env fallback second.");
}

function nativeGitDoctor(workspace) {
  const repositories = [
    { id: workspace.manifest.artifactRepository.id, root: artifactRoot, remote: workspace.manifest.artifactRepository.remote },
    ...workspace.repositories,
  ];
  const results = repositories.map((repo) => {
    const probe = spawnSync("git", ["ls-remote", "origin", "HEAD"], {
      cwd: repo.root,
      encoding: "utf8",
      env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
      timeout: 20000,
    });
    return {
      id: repo.id,
      remote: repo.remote,
      status: probe.status === 0 ? "passed" : "failed",
      ...(probe.status === 0 ? {} : { message: String(probe.stderr || probe.error?.message || "Git authentication failed").trim().slice(0, 500) }),
    };
  });
  return {
    status: results.every((item) => item.status === "passed") ? "passed" : "failed",
    authentication: "native-git-credential-chain",
    results,
  };
}

function integrationStatus() {
  const workspace = resolveWorkspace();
  runEnterprise(workspace.manifest, ["--status"]);
}

function integrationDoctor() {
  const workspace = resolveWorkspace();
  const enterpriseResult = runEnterprise(workspace.manifest, ["--doctor"], { capture: true });
  let enterprise;
  try { enterprise = JSON.parse(enterpriseResult.stdout); }
  catch { fail(`Enterprise integration doctor returned invalid JSON: ${String(enterpriseResult.stderr || "").trim()}`); }
  const nativeGit = nativeGitDoctor(workspace);
  const requiredApiFailures = (enterprise.results || []).filter((item) => item.status === "failed" && item.kind !== "gitlab");
  const gitlabApiFailures = (enterprise.results || []).filter((item) => item.status === "failed" && item.kind === "gitlab");
  const missingRequiredApis = (enterprise.missingKinds || []).filter((kind) => kind !== "gitlab");
  const gitlabApiMissing = (enterprise.missingKinds || []).includes("gitlab");
  const failed = requiredApiFailures.length > 0 || missingRequiredApis.length > 0 || nativeGit.status !== "passed";
  const warnings = gitlabApiFailures.map((item) => `${item.id}: GitLab API context is unavailable; native clone/fetch/push is verified separately.`);
  if (gitlabApiMissing) warnings.push("GitLab API context is not configured; native clone/fetch/push is verified separately.");
  const result = {
    status: failed ? "failed" : (warnings.length ? "passed-with-warnings" : "passed"),
    enterpriseApi: enterprise,
    nativeGit,
    warnings,
  };
  console.log(JSON.stringify(result, null, 2));
  if (failed) process.exit(1);
}

function integrationGitDoctor() {
  const workspace = resolveWorkspace();
  const result = nativeGitDoctor(workspace);
  console.log(JSON.stringify(result, null, 2));
  if (result.status !== "passed") process.exit(1);
}

function integrationResolve() {
  const workspace = resolveWorkspace();
  const issueKey = process.argv[4];
  if (!issueKey) fail("Usage: agentctl.js integrations resolve JIRA-123");
  runEnterprise(workspace.manifest, ["--resolve-issue", issueKey]);
}

function integrations() {
  const workspace = resolveWorkspace();
  if (!workspace.manifest.integrations) fail("Enterprise integrations are not enabled in workspace.json.");
  const action = process.argv[3] || "status";
  if (action === "configure") configureIntegrations();
  else if (action === "status") integrationStatus();
  else if (action === "doctor") integrationDoctor();
  else if (action === "git-doctor") integrationGitDoctor();
  else if (action === "install-mcp") installEnterpriseMcp(workspace.manifest);
  else if (action === "resolve") integrationResolve();
  else fail("Usage: agentctl.js integrations <configure|status|doctor|git-doctor|install-mcp|resolve>");
}

function doctor() {
  const workspace = resolveWorkspace();
  const problems = [];
  for (const repo of workspace.repositories) {
    const status = git(repo.root, ["status", "--porcelain=v1", "-uall"], "");
    problems.push(...status.split(/\r?\n/).filter(Boolean).map((line) => ({ repository: repo.id, change: line })));
  }
  console.log(JSON.stringify({
    status: "passed",
    workspaceId: workspace.manifest.workspaceId,
    artifactRoot,
    workspaceRoot: workspace.workspaceRoot,
    customerWorktreeChanges: problems,
  }, null, 2));
}

function sync() {
  resolveWorkspace();
  const result = spawnSync("git", ["pull", "--ff-only"], { cwd: artifactRoot, encoding: "utf8", stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status || 1);
  const fresh = spawnSync(process.execPath, [__filename, "install"], { cwd: artifactRoot, stdio: "inherit" });
  if (fresh.status !== 0) process.exit(fresh.status || 1);
  console.log("Agent system synchronized from Rocketfirm GitLab over SSH.");
}

function status() {
  const workspace = resolveWorkspace();
  const baselinePath = path.join(artifactRoot, "docs/agent-system/source-snapshot.json");
  const baseline = fs.existsSync(baselinePath) ? readJson(baselinePath) : { repositories: [] };
  const expected = new Map((baseline.repositories || []).map((repo) => [repo.id, repo]));
  const repositories = workspace.repositories.map((repo) => {
    const head = git(repo.root, ["rev-parse", "HEAD"], "");
    const saved = expected.get(repo.id);
    return {
      id: repo.id,
      branch: git(repo.root, ["branch", "--show-current"], ""),
      head,
      knowledgeHead: saved?.head || null,
      knowledgeStatus: saved ? (saved.head === head ? "current" : "stale") : "unknown",
      worktreeClean: !git(repo.root, ["status", "--porcelain=v1", "-uall"], ""),
    };
  });
  console.log(JSON.stringify({
    workspaceId: workspace.manifest.workspaceId,
    agentSystemHead: git(artifactRoot, ["rev-parse", "HEAD"], ""),
    agentSystemBranch: git(artifactRoot, ["branch", "--show-current"], ""),
    agentSystemClean: !git(artifactRoot, ["status", "--porcelain=v1", "-uall"], ""),
    knowledgeStatus: repositories.some((repo) => repo.knowledgeStatus === "stale") ? "stale" : "current",
    repositories,
  }, null, 2));
}

function commitPlan() {
  const workspace = resolveWorkspace();
  const violations = [];
  const customerRepositories = workspace.repositories.map((repo) => {
    const changes = git(repo.root, ["status", "--porcelain=v1", "-uall"], "").split(/\r?\n/).filter(Boolean);
    for (const change of changes) {
      const file = change.slice(3).replace(/^"|"$/g, "");
      if (forbiddenAgentArtifact.test(file)) violations.push({ repository: repo.id, file });
    }
    return { id: repo.id, destination: repo.remote, changes };
  });
  console.log(JSON.stringify({
    status: violations.length ? "blocked" : "ready",
    agentSystem: {
      destination: workspace.manifest.artifactRepository.remote,
      changes: git(artifactRoot, ["status", "--porcelain=v1", "-uall"], "").split(/\r?\n/).filter(Boolean),
    },
    customerRepositories,
    violations,
  }, null, 2));
  if (violations.length) process.exit(1);
}

const command = process.argv[2] || "status";
if (command === "install") install();
else if (command === "doctor") doctor();
else if (command === "sync") sync();
else if (command === "status") status();
else if (command === "commit-plan") commitPlan();
else if (command === "integrations") integrations();
else fail("Usage: agentctl.js <install|doctor|sync|status|commit-plan|integrations>");
