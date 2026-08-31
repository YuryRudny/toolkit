#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = path.resolve(process.argv[2] || process.cwd());
const outPath = path.join(root, "docs", "agent-system", "bootstrap-quality-report.md");

function readJson(rel) {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
  } catch {
    return null;
  }
}

function readText(rel) {
  try {
    return fs.readFileSync(path.join(root, rel), "utf8");
  } catch {
    return "";
  }
}

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

function clamp(value) {
  return Math.max(0, Math.min(10, Math.round(value * 10) / 10));
}

function ratio(items, predicate) {
  if (!items.length) return 0;
  return items.filter(predicate).length / items.length;
}

function markdownRows(text) {
  return text.split(/\r?\n/).filter((line) => /^\|.+\|$/.test(line) && !/^\|\s*---/.test(line)).slice(1);
}

function lineSet(text) {
  return new Set(text.split(/\r?\n/).map((line) => line.trim().toLowerCase()).filter((line) => line.length > 24 && !line.startsWith("#")));
}

function overlap(left, right) {
  if (!left.size || !right.size) return 0;
  let shared = 0;
  for (const line of left) if (right.has(line)) shared += 1;
  return shared / Math.min(left.size, right.size);
}

const model = readJson("docs/agent-system/project-model.json") || {};
const workspace = readJson("workspace.json") || {};
const tasks = readJson("docs/agent-system/research-workspace/research-tasks.json")?.tasks || [];
const registry = readJson("docs/agent-system/skill-registry.json")?.skills || [];
const evidenceLog = readText("docs/agent-system/research-workspace/evidence-log.md");
const riskRegister = readText("docs/agent-system/risk-register.md");
const refactorPlan = readText("docs/agent-system/refactor-plan.md");
const knowledgeBase = readText("docs/agent-system/knowledge-base.md");
const knowledgeIndex = readText("docs/agent-system/knowledge-index.md");
const router = readText("codex-skills/skills/workflow-router/SKILL.md");

const inputDir = path.join(root, "docs", "agent-system", "skill-inputs");
const inputs = fs.existsSync(inputDir)
  ? fs.readdirSync(inputDir).filter((file) => file.endsWith(".json") && file !== "index.json").map((file) => readJson(`docs/agent-system/skill-inputs/${file}`)).filter(Boolean)
  : [];

const roleSkillNames = inputs.map((input) => input.skillName);
const roleSkillTexts = roleSkillNames.map((name) => readText(`codex-skills/skills/${name}/SKILL.md`));
const references = registry.flatMap((skill) => skill.references || []).filter((item, index, array) => array.indexOf(item) === index);

const researchTaskRatio = ratio(tasks, (task) => ["complete", "not-applicable"].includes(task.status));
const moduleRatio = ratio(model.modules || [], (item) => ["researched", "not-applicable"].includes(item.status));
const entryRatio = ratio(model.entryPoints || [], (item) => ["traced", "not-applicable"].includes(item.status));
const researchScore = clamp(researchTaskRatio * 5 + moduleRatio * 2 + entryRatio * 2 + Math.min((model.criticalFlows || []).length / 4, 1));

const evidenceRows = Math.max(0, markdownRows(evidenceLog).length);
const confirmedRisks = (riskRegister.match(/\bR-[A-Z0-9-]+\b/g) || []).filter((item, index, array) => array.indexOf(item) === index).length;
const evidenceScore = clamp(Math.min(evidenceRows / 20, 1) * 5 + Math.min(confirmedRisks / 8, 1) * 5);

const ragFiles = ["knowledge-base.md", "knowledge-index.md", "project-map.md", "architecture-map.md", "current-state.md"];
const ragExists = ratio(ragFiles, (file) => exists(`docs/agent-system/${file}`));
const routeRows = markdownRows(knowledgeIndex).length;
const ragScore = clamp(ragExists * 6 + Math.min(routeRows / 10, 1) * 2 + (knowledgeBase.includes("Критич") ? 1 : 0) + (knowledgeBase.includes("Gaps") || knowledgeBase.includes("Пробел") ? 1 : 0));

const riskRows = markdownRows(riskRegister).length;
const refactorIds = (refactorPlan.match(/\bRF-[A-Z0-9-]+\b/g) || []).filter((item, index, array) => array.indexOf(item) === index).length;
const riskScore = clamp(Math.min(riskRows / 10, 1) * 5 + Math.min(refactorIds / 4, 1) * 5);

const readyInputs = ratio(inputs, (input) => input.status === "ready" && input.schemaVersion === 2 && input.seedExtractionStatus === "extracted");
const renderedInputs = ratio(inputs, (input) => exists(`codex-skills/skills/${input.skillName}/SKILL.md`) && exists(`docs/agent-system/skill-assembly/${input.skillName}.md`));
const assemblyScore = clamp(readyInputs * 5 + renderedInputs * 5);

const requiredSections = ["## Обзор", "## Быстрый Маршрут По RAG", "## Использованные Seeds", "## Порядок работы", "## Условия остановки", "## Формат результата"];
const specializedHeaders = {
  "code-review": "## Severity И Verdict Protocol",
  debugging: "## Протокол Диагностики",
  refactor: "## Safe Slice Protocol",
  "frontend-ui": "## Матрица Production UI",
  "frontend-state": "## Матрица Data Consistency",
  "backend-api": "## Матрица Request И Runtime Safety",
  testing: "## Матрица Выбора Проверки",
  "security-performance": "## Threat И Resource Matrix",
  "mobile-capacitor": "## Матрица Web И Native Boundary",
};
const seniorRatio = ratio(inputs, (input) => {
  const skillText = readText(`codex-skills/skills/${input.skillName}/SKILL.md`);
  const specialized = specializedHeaders[input.profileId];
  return requiredSections.every((section) => skillText.includes(section))
    && (!specialized || skillText.includes(specialized))
    && /R-[A-Z0-9-]+/.test(skillText);
});
const seniorScore = clamp(seniorRatio * 10);

let duplicatePenalty = 0;
for (const reference of references) {
  const refText = readText(reference);
  const owner = registry.find((skill) => (skill.references || []).includes(reference));
  if (!owner) continue;
  if (overlap(lineSet(refText), lineSet(readText(owner.path))) > 0.65) duplicatePenalty += 1;
}
const referenceScore = clamp(ratio(references, exists) * 8 + (references.length ? 2 : 0) - Math.min(duplicatePenalty, 4));

const englishMarkers = roleSkillTexts.join("\n").match(/\b(Required Reads|Stop Conditions|Fix root cause|Read RAG first|Demand local fix)\b/gi) || [];
const languageScore = clamp(10 - Math.min(englishMarkers.length, 10));

const sidecarEnterpriseReady = Boolean(
  workspace.integrations
  && exists("bin/enterprise-mcp.js")
  && exists("codex-skills/skills/enterprise-context/SKILL.md")
  && exists("codex-skills/references/enterprise-context.md")
);

const enterpriseScore = clamp(
  (exists("docs/agent-system/existing-rules-merge.md") ? 4 : 0)
  + (exists("docs/agent-system/enterprise-integrations.md") ? 3 : 0)
  + (model.integrations?.git?.remote ? 1 : 0)
  + (exists(".tmp/integration-env.sh") || sidecarEnterpriseReady || readText("docs/agent-system/enterprise-integrations.md").includes("skipped") ? 2 : 0),
);

const activeNames = new Set(registry.filter((skill) => skill.status === "active").map((skill) => skill.name));
const routerRefs = router.split(/\r?\n/)
  .filter((line) => line.startsWith("Обязательные skills:"))
  .flatMap((line) => [...line.matchAll(/`([a-z0-9-]+)`/g)].map((match) => match[1]));
const routerConsistent = routerRefs.every((name) => activeNames.has(name));
const rerunScore = clamp(
  (exists("docs/agent-system/project-model.json") ? 2 : 0)
  + (exists("docs/agent-system/skill-registry.json") ? 2 : 0)
  + (exists("docs/agent-system/bootstrap-state.json") ? 2 : 0)
  + (routerConsistent ? 2 : 0)
  + (researchTasksFingerprintMatches() ? 2 : 0),
);

function researchTasksFingerprintMatches() {
  const graph = readJson("docs/agent-system/research-workspace/research-tasks.json");
  return Boolean(graph?.projectFingerprint && graph.projectFingerprint === model.fingerprint);
}

const scores = [
  ["Research depth", researchScore, "project-model modules/entry points + topology research task completion"],
  ["Evidence quality", evidenceScore, "evidence-log rows + confirmed risk IDs"],
  ["RAG usefulness", ragScore, "required RAG files + knowledge-index routes"],
  ["Risk/refactor value", riskScore, "risk rows + linked RF slices"],
  ["Skill assembly discipline", assemblyScore, "ready v2 inputs + rendered skills/assembly sheets"],
  ["Skill senior quality", seniorScore, "required operational sections + project risk IDs"],
  ["Operational references", referenceScore, "registered references + duplication check"],
  ["Language/runtime clarity", languageScore, "runtime English marker scan"],
  ["Existing rules/enterprise hygiene", enterpriseScore, "merge docs + enterprise state + Git/helper or sidecar MCP evidence"],
  ["Re-run safety", rerunScore, "model + registry + state + router consistency + freshness"],
];
const fullScore = clamp(scores.reduce((sum, [, score]) => sum + score, 0) / scores.length);
const repairRows = scores.filter(([, score]) => score < 10).map(([name, score]) => `| ${name} | ${score}/10 | Вернуться к соответствующему structured input/model/research artifact |`);

const report = `# Bootstrap Quality Report

Generated by: \`reusable-agent-system-toolkit/scripts/generate-quality-report.js\`

## Итог

- Full bootstrap quality: ${fullScore}/10
- Статус: ${fullScore === 10 ? "готов" : "needs repair"}
- Project fingerprint: \`${model.fingerprint || "missing"}\`
- Дата: ${new Date().toISOString()}

## Scorecard

| Категория | Score | Вычисляемое evidence | Repair action если score < 10 |
| --- | --- | --- | --- |
${scores.map(([name, score, evidence]) => `| ${name} | ${score}/10 | ${evidence} | ${score === 10 ? "не требуется" : "см. Repair Plan"} |`).join("\n")}

## Coverage Snapshot

- Research tasks: ${Math.round(researchTaskRatio * 100)}% complete/not-applicable (${tasks.length} total).
- Modules: ${Math.round(moduleRatio * 100)}% researched/not-applicable (${(model.modules || []).length} total).
- Entry points: ${Math.round(entryRatio * 100)}% traced/not-applicable (${(model.entryPoints || []).length} total).
- Critical flows in project model: ${(model.criticalFlows || []).length}.
- Skill inputs: ${inputs.length}; ready ratio ${Math.round(readyInputs * 100)}%.
- Registered skills: ${registry.length}; registered references: ${references.length}.

## Repair Plan

| Категория | Текущий score | Следующее действие |
| --- | --- | --- |
${repairRows.length ? repairRows.join("\n") : "| Нет | 10/10 | Repair не требуется |"}

## Правило Приёмки

Оценка вычислена из артефактов и не выставляется агентом вручную. Full bootstrap считается 10/10 только когда каждая категория равна 10/10.
`;

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, report);
console.log(`Quality report generated: ${path.relative(root, outPath)} (${fullScore}/10)`);
