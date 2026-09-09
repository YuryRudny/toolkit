"use strict";
const fs = require("fs");
const crypto = require("crypto");
const { contentFingerprint, discoverSourceFiles } = require("./source-state");
const { researchFailures } = require("./research-evidence");
const { resolveInside } = require("./path-safety");
const { resolveSourcePath, loadWorkspace } = require("./workspace");
const DOCS = ["full-project-research-report.md", "research-evidence-pack.md", "knowledge-base.md", "knowledge-index.md", "project-map.md", "architecture-map.md", "risk-register.md", "refactor-plan.md", "smoke-checklist.md", "current-state.md", "stack-profile.md"];
const OPERATIONAL = ["workflow-router", "project-authority", "research-audit", "pre-change-checklist", "review-checklist", "stack-quality", "git-remote-flow", "agent-system-update"];
const CORE_ROLES = ["code-review-and-quality", "debugging-and-error-recovery", "refactor-engineering", "testing-strategy", "security-performance-review"];
function readJson(root, rel) {
  try { return JSON.parse(fs.readFileSync(resolveInside(root, rel, "build input"), "utf8")); } catch { return null; }
}
function nonEmpty(root, rel) {
  try { return fs.readFileSync(resolveSourcePath(root, rel), "utf8").trim().length > 0; } catch { return false; }
}
function requiredRoles(model) {
  const c = model?.capabilities || {};
  return [...CORE_ROLES, ...(c.frontend ? ["frontend-ui-engineering", "frontend-state-and-data"] : []), ...(c.server ? ["backend-engineering", "api-contract-safety"] : []), ...(c.capacitor ? ["mobile-capacitor-shell"] : [])];
}
function modelFailures(model) {
  const failures = [];
  if (![1, 2].includes(model?.schemaVersion) || !/^[a-f0-9]{64}$/.test(model?.fingerprint || "")) failures.push("project model has invalid schemaVersion/fingerprint");
  for (const key of ["modules", "entryPoints", "manifests", "sourceRoots", "existingRules", "criticalFlows", "findings", "gaps", "boundaries"]) if (!Array.isArray(model?.[key])) failures.push(`project model requires array ${key}`);
  if (!model?.capabilities || !Object.keys(model.capabilities).length || Object.values(model.capabilities).some((value) => typeof value !== "boolean")) failures.push("project model requires boolean capabilities");
  for (const key of ["modules", "entryPoints"]) {
    const seen = new Set();
    for (const item of Array.isArray(model?.[key]) ? model[key] : []) {
      if (!item?.id || !item.path || seen.has(item.id)) failures.push(`invalid/duplicate ${key} item`);
      const statuses = key === "modules" ? ["discovered", "researched", "not-applicable", "stale"] : ["discovered", "traced", "not-applicable", "stale"];
      if (!statuses.includes(item?.status) || !/^[a-f0-9]{64}$/.test(item?.contentFingerprint || "")) failures.push(`${key}: invalid status/contentFingerprint`);
      if (key === "modules" && (!Number.isInteger(item?.fileCount) || item.fileCount < 0 || !Array.isArray(item.languages))) failures.push("module has invalid fileCount/languages");
      seen.add(item?.id);
    }
  }
  return failures;
}
function docsFailures(root) {
  return DOCS.filter((name) => !nonEmpty(root, `docs/agent-system/${name}`)).map((name) => `missing or empty docs/agent-system/${name}`);
}
function sourceFingerprint(root, model) {
  if (model?.mode !== "sidecar-workspace") return contentFingerprint(root, discoverSourceFiles(root));
  const workspace = loadWorkspace(root);
  return crypto.createHash("sha256").update(workspace.repositories.map((repo) => `${repo.id}:${contentFingerprint(repo.root, discoverSourceFiles(repo.root, true))}`).join("\n")).digest("hex");
}
function assertGenerationReady(root, command) {
  const state = readJson(root, "docs/agent-system/bootstrap-state.json");
  if (!state || !["full", "degraded"].includes(state.installMode)) throw new Error(`${command}: initialize bootstrap state and choose installMode first`);
  if (state.blocked) throw new Error(`${command}: bootstrap is blocked`);
  if (state.installMode === "degraded") {
    if (command !== "render-operational") throw new Error(`${command}: full skills are disabled for degraded install`);
    return;
  }
  const model = readJson(root, "docs/agent-system/project-model.json");
  const failures = [...modelFailures(model), ...docsFailures(root), ...researchFailures(root, model, readJson(root, "docs/agent-system/research-workspace/research-tasks.json"))];
  if (model?.fingerprint !== sourceFingerprint(root, model)) failures.push("project model is stale against source content; rerun discovery and research");
  if (!state.completedPhases?.includes("docs-rag")) failures.push("docs-rag phase is not complete");
  const authority = readJson(root, "docs/agent-system/authority-map.json");
  if (!authority || !Array.isArray(authority.rules) || !Array.isArray(authority.conflicts)) failures.push("missing authority inventory");
  else if (authority.conflicts.some((item) => item.status !== "resolved")) failures.push("unresolved authority conflicts");
  if (!nonEmpty(root, "docs/agent-system/existing-rules-merge.md")) failures.push("missing existing-rules merge decisions");
  if (command !== "render-operational" && !nonEmpty(root, "docs/agent-system/seed-selection.md")) failures.push("missing seed-selection.md");
  if (failures.length) throw new Error(`${command}: Docs/RAG Ready gate failed:\n${failures.join("\n")}`);
}
function artifactFingerprint(root) {
  const files = [];
  const excluded = new Set(["bootstrap-state.json", "bootstrap-quality-report.md", "bootstrap-quality-report.json", "validation-result.json", "source-boundary-result.json"]);
  function walk(rel) {
    const file = resolveInside(root, rel, "validation artifact");
    if (!fs.existsSync(file)) return;
    if (fs.lstatSync(file).isDirectory()) {
      for (const name of fs.readdirSync(file).sort()) if (!excluded.has(name)) walk(`${rel}/${name}`);
    } else files.push(rel);
  }
  for (const rel of ["AGENTS.md", "codex-skills", "docs/agent-system", "bin", "workspace.json"]) walk(rel);
  return contentFingerprint(root, files);
}
function evaluateQuality(root) {
  const model = readJson(root, "docs/agent-system/project-model.json");
  const graph = readJson(root, "docs/agent-system/research-workspace/research-tasks.json");
  const state = readJson(root, "docs/agent-system/bootstrap-state.json");
  const registry = readJson(root, "docs/agent-system/skill-registry.json");
  const authority = readJson(root, "docs/agent-system/authority-map.json");
  const roles = requiredRoles(model), checks = [];
  const add = (category, failures) => checks.push({ category, score: failures.length ? 0 : 10, status: failures.length ? "failed" : "passed", failures });
  const research = researchFailures(root, model, graph);
  add("Research depth", [...modelFailures(model), ...research]);
  add("Evidence quality", research);
  add("RAG usefulness", docsFailures(root));
  const findings = Array.isArray(model?.findings) ? model.findings : [];
  add("Risk/refactor value", ["risk-register.md", "refactor-plan.md"].filter((name) => !nonEmpty(root, `docs/agent-system/${name}`)).map((name) => `missing ${name}`).concat(findings.filter((item) => !item.id || !item.evidence?.length).map(() => "finding lacks id or evidence")));
  const assembly = [], profiles = [], references = [], language = [];
  for (const name of roles) {
    const input = readJson(root, `docs/agent-system/skill-inputs/${name}.json`);
    if (!input || input.schemaVersion !== 2 || input.status !== "ready" || input.seedExtractionStatus !== "extracted" || input.projectFingerprint !== model?.fingerprint) assembly.push(`${name}: missing, stale or unready v2 input`);
    for (const rel of [`codex-skills/skills/${name}/SKILL.md`, `docs/agent-system/skill-assembly/${name}.md`]) if (!nonEmpty(root, rel)) assembly.push(`missing ${rel}`);
    for (const field of ["profileRoles", "projectHooks", "workflowSteps", "layerChecks", "gates", "stopConditions", "resultFormat"]) if (!Array.isArray(input?.[field]) || !input[field].length) profiles.push(`${name}: missing ${field}`);
    if (!Array.isArray(input?.references) || !input.references.length) references.push(`${name}: missing references`);
    for (const rel of input?.references || []) if (!nonEmpty(root, rel)) references.push(`missing ${rel}`);
    const skillPath = `codex-skills/skills/${name}/SKILL.md`;
    if (!nonEmpty(root, skillPath)) language.push(`missing ${skillPath}`);
    else if (/\b(Required Reads|Stop Conditions|Fix root cause|Read RAG first|Demand local fix)\b/.test(fs.readFileSync(resolveInside(root, skillPath), "utf8"))) language.push(`${name}: untranslated runtime instructions`);
  }
  add("Skill assembly discipline", assembly);
  add("Skill senior quality", profiles);
  add("Operational references", references);
  add("Language/runtime clarity", language);
  const hygiene = [];
  if (!authority || !Array.isArray(authority.conflicts) || authority.conflicts.some((item) => item.status !== "resolved")) hygiene.push("authority inventory missing or unresolved");
  for (const name of ["existing-rules-merge.md", "enterprise-integrations.md"]) if (!nonEmpty(root, `docs/agent-system/${name}`)) hygiene.push(`missing ${name}`);
  add("Existing rules/enterprise hygiene", hygiene);
  const rerun = [];
  if (model?.fingerprint !== sourceFingerprint(root, model)) rerun.push("project model is stale against source content");
  if (!state || state.blocked || !["full", "degraded"].includes(state.installMode)) rerun.push("bootstrap state missing, blocked or mode unset");
  if (model?.research?.stale || graph?.projectFingerprint !== model?.fingerprint) rerun.push("research is stale");
  if (!readJson(root, "docs/agent-system/generated-ownership.json")) rerun.push("missing generated output ownership");
  for (const name of [...OPERATIONAL, ...roles]) {
    const entry = registry?.skills?.find((item) => item.name === name && item.status === "active");
    if (!entry || !nonEmpty(root, entry.path)) rerun.push(`missing active skill: ${name}`);
  }
  add("Re-run safety", rerun);
  return { schemaVersion: 2, projectFingerprint: model?.fingerprint || null, artifactFingerprint: artifactFingerprint(root), status: checks.every((item) => item.status === "passed") ? "passed" : "failed", score: checks.filter((item) => item.status === "passed").length, checks, limitation: "Deterministic artifact contract only; not proof of research correctness or senior engineering quality." };
}
module.exports = { DOCS, OPERATIONAL, CORE_ROLES, requiredRoles, readJson, modelFailures, docsFailures, assertGenerationReady, artifactFingerprint, sourceFingerprint, evaluateQuality };
