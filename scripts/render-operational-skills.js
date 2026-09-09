#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { writeOwnedArtifacts, managedText } = require("./lib/owned-artifacts");
const { assertGenerationReady } = require("./lib/build-contract");

const root = path.resolve(process.argv[2] || process.cwd());
assertGenerationReady(root, "render-operational");
const degraded = JSON.parse(fs.readFileSync(path.join(root, "docs/agent-system/bootstrap-state.json"), "utf8")).installMode === "degraded";
const toolkitRoot = path.resolve(__dirname, "..");
const outRoot = path.join(root, "codex-skills", "skills");
const entryPath = path.join(root, "AGENTS.md");
const entryTemplatePath = path.join(toolkitRoot, "templates", "project-rules", "AGENTS.template.md");
const entryStart = "<!-- reusable-agent-system-toolkit:start -->";
const entryEnd = "<!-- reusable-agent-system-toolkit:end -->";
const writePlan = [];

const baseTemplates = [
  ["project-authority", "project-authority.template.md"],
  ["research-audit", "research-audit.template.md"],
  ["pre-change-checklist", "pre-change-checklist.template.md"],
  ["review-checklist", "review-checklist.template.md"],
  ["stack-quality", "stack-quality.template.md"],
  ["git-remote-flow", "git-remote-flow.template.md"],
  ["agent-system-update", "agent-system-update.template.md"],
];

function readJson(rel) {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
  } catch {
    return null;
  }
}

function writeSkill(name, text) {
  const outPath = path.join(outRoot, name, "SKILL.md");
  writePlan.push({ relativePath: path.relative(root, outPath), text: adaptWorkspaceText(text) });
  return path.relative(root, outPath);
}

function writeReference(name, text) {
  const outPath = path.join(root, "codex-skills", "references", name);
  writePlan.push({ relativePath: path.relative(root, outPath), text: adaptWorkspaceText(text) });
  return path.relative(root, outPath);
}

function renderProjectEntry() {
  if (!fs.existsSync(entryTemplatePath)) {
    console.error(`Missing project entry template: ${path.relative(toolkitRoot, entryTemplatePath)}`);
    process.exit(1);
  }

  const model = readJson("docs/agent-system/project-model.json") || {};
  const sidecarRules = model.mode === "sidecar-workspace"
    ? `\n\n## Sidecar Preflight\n\n- До чтения customer source и первого Git action выполни \`node bsg-agent-system/bin/agentctl.js sync\` из workspace root. Это обычный \`git pull --ff-only\` внутреннего репозитория по SSH. Исключение: Update Mode начинает с read-only separation check без sync/pull.\n- Затем выполни \`node bsg-agent-system/bin/agentctl.js status\`. При \`knowledgeStatus: stale\` сначала сделай targeted update затронутой RAG области.\n- Для Jira key или Jira/Confluence/Figma/GitLab URL загрузи \`enterprise-context\` и выполни \`node bsg-agent-system/bin/agentctl.js integrations status\` до внешнего запроса.\n- Код коммить только в его customer repository; docs/RAG/skills — только в bsg-agent-system. Перед commit/push выполни \`node bsg-agent-system/bin/agentctl.js commit-plan\`. При запрошенном push верни пользователю проверенные ссылки на MR каждого изменённого Git, без пустых MR.\n- Не создавай наши AGENTS.md, .agents, .codex, codex-skills, docs/agent-system или toolkit paths внутри customer-code repositories. Клиентские правила сохраняй. Узкое cleanup-исключение при согласованном переносе задано в \`codex-skills/references/repository-separation.md\`.`
    : "";
  const body = `${fs.readFileSync(entryTemplatePath, "utf8")
    .replaceAll("<PROJECT_SKILLS_PATH>", "codex-skills/skills")
    .trim()}${degraded ? "\n\nDegraded install: deep scan skipped by user. Полная RAG-база и senior skills не созданы; перед существенным изменением требуется исследование touched area." : ""}${sidecarRules}`;
  const managedBlock = `${entryStart}\n${body}\n${entryEnd}`;

  if (!fs.existsSync(entryPath)) {
    writePlan.push({ relativePath: "AGENTS.md", text: adaptWorkspaceText(`${managedBlock}\n`), mergeEntry: true });
    return "AGENTS.md (created)";
  }

  const existing = fs.readFileSync(entryPath, "utf8");
  managedText(existing);
  const startIndex = existing.indexOf(entryStart);
  const endIndex = existing.indexOf(entryEnd);
  if (startIndex >= 0 && endIndex > startIndex) {
    const before = existing.slice(0, startIndex).trimEnd();
    const after = existing.slice(endIndex + entryEnd.length).trimStart();
    writePlan.push({ relativePath: "AGENTS.md", text: `${before ? `${before}\n\n` : ""}${adaptWorkspaceText(managedBlock)}${after ? `\n\n${after.trimEnd()}` : ""}\n`, mergeEntry: true });
    return "AGENTS.md (updated managed block)";
  }

  writePlan.push({ relativePath: "AGENTS.md", text: `${existing.trimEnd()}\n\n${adaptWorkspaceText(managedBlock)}\n`, mergeEntry: true });
  return "AGENTS.md (merged with existing rules)";
}

const workspaceConfig = readJson("workspace.json") || {};
function adaptWorkspaceText(text) {
  const localRoot = path.resolve(root, workspaceConfig.localIntegration?.workspaceRoot || "..");
  const artifactDirectory = path.relative(localRoot, root).replace(/\\/g, "/") || ".";
  return text.replaceAll("bsg-agent-system", artifactDirectory);
}
const enterpriseEnabled = Boolean(workspaceConfig.integrations);
const selectedTemplates = degraded ? baseTemplates.filter(([name]) => ["project-authority", "git-remote-flow", "agent-system-update"].includes(name)) : baseTemplates;
const templates = enterpriseEnabled ? [...selectedTemplates, ["enterprise-context", "enterprise-context.template.md"]] : selectedTemplates;
const rendered = [];
for (const [skillName, templateName] of templates) {
  const templatePath = path.join(toolkitRoot, "templates", "skills", templateName);
  if (!fs.existsSync(templatePath)) {
    console.error(`Missing operational skill template: ${path.relative(toolkitRoot, templatePath)}`);
    process.exit(1);
  }
  let text = fs.readFileSync(templatePath, "utf8");
  if (degraded) text += "\nDegraded install: deep scan skipped by user. Исследование и full-install skills недоступны.\n";
  if (skillName === "git-remote-flow") {
    const model = readJson("docs/agent-system/project-model.json") || {};
    const workspace = readJson("workspace.json") || {};
    const git = model.integrations?.git || {};
    const sources = model.integrations?.sources || [];
    const routing = model.mode === "sidecar-workspace"
      ? `## Repository Routing\n\n- RAG, docs, skills, agent rules и runtime: \`${git.remote || "artifact remote не определён"}\`.\n${sources.map((source) => `- Customer code \`${source.id}\`: \`${source.remote}\`.`).join("\n")}`
      : "## Repository Routing\n\n- Продуктовый код: проверенный remote текущего project repository, по клиентской policy.\n- Наши RAG/skills: отдельный Git либо local папка без Git по выбору пользователя. Если назначения нет, спроси оба варианта перед переносом; origin продукта не является назначением агентских материалов. В local mode agent commits/push/MR запрещены.";
    text = text
      .replace("- Remote:", `- Remote: ${git.remote || "не определён"}`)
      .replace("- Базовая ветка:", `- Базовая ветка: ${workspace.artifactRepository?.defaultBranch || git.branch || "требует project policy"}`)
      .replace("<REPOSITORY_ROUTING>", routing);
  }
  rendered.push(writeSkill(skillName, text));
}

for (const name of ["update-modes.md", "full-update.md", "incremental-update.md", "repository-separation.md", "local-agent-storage.md"]) {
  rendered.push(writeReference(name, fs.readFileSync(path.join(toolkitRoot, "references", name), "utf8")));
}

if (enterpriseEnabled) {
  const referenceTemplate = path.join(toolkitRoot, "templates", "references", "enterprise-context.template.md");
  if (!fs.existsSync(referenceTemplate)) {
    console.error(`Missing enterprise reference template: ${path.relative(toolkitRoot, referenceTemplate)}`);
    process.exit(1);
  }
  rendered.push(writeReference("enterprise-context.md", fs.readFileSync(referenceTemplate, "utf8")));
}

const active = fs.existsSync(outRoot)
  ? fs.readdirSync(outRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name)
  : [];
const available = new Set([...active, ...templates.map(([name]) => name), "workflow-router"]);
const select = (...names) => names.filter((name) => available.has(name));

const modes = [
  ["Research", "ресерч, research, глубокий анализ, карта проекта", select("project-authority", "research-audit", "review-checklist")],
  ["Development", "feature, bugfix, Jira task, изменение кода", select("project-authority", "pre-change-checklist", "stack-quality", "review-checklist")],
  ["Review", "ревью, review, проверка diff", select("project-authority", "code-review-and-quality", "review-checklist")],
  ["Debugging", "ошибка, падение, flaky behavior, regression", select("project-authority", "debugging-and-error-recovery", "review-checklist")],
  ["Refactor", "рефактор, architecture debt, следующий slice", select("project-authority", "refactor-engineering", "pre-change-checklist", "review-checklist")],
  ["Merge/Publish", "commit, push, merge, MR", select("project-authority", "git-remote-flow", "review-checklist")],
  ["Update", "обновить toolkit, обновить агентскую систему, перенос skills/RAG, разделить продуктовый и агентский Git", select("project-authority", "agent-system-update", "git-remote-flow")],
  ...(enterpriseEnabled ? [["Enterprise Context", "Jira key, Confluence/Figma/GitLab URL, external task context", select("project-authority", "enterprise-context")]] : []),
];

const modeSections = modes.map(([title, triggers, skills]) => `### ${title} Mode\n\nТриггеры: ${triggers}.\n\nОбязательные skills: ${skills.map((name) => `\`${name}\``).join(", ") || "нет"}.`).join("\n\n");
const router = `---
name: workflow-router
description: Выбирает режим и только реально зарегистрированные project-local skills. Используй в начале задачи, при смене scope и перед development, research, review, debugging, refactor, update или publish действиями.
---

# Маршрутизатор Работы

## Порядок работы

1. Прочитай \`docs/agent-system/skill-registry.json\` и \`docs/agent-system/knowledge-index.md\`.
2. Определи режим по задаче.
3. Загрузи обязательные skills режима только если их status равен \`active\`.
4. Выбери дополнительные stack/domain skills из registry по touched layer.
5. Если scope изменился, повтори маршрутизацию.
6. После edits примени \`review-checklist\`.

## Режимы

${modeSections}

## Инварианты

- Не называй и не загружай skill, которого нет в registry со status \`active\`.
- Для Jira/Confluence/Figma/GitLab используй \`enterprise-context\` только если он активен; runtime status/probe обязан подтвердить локальную конфигурацию.
- При устаревшем project-model выполняй targeted discovery до изменения.
- Research обновляет model/RAG, если обнаружены новые modules, flows, findings или gaps.
`;
rendered.push(writeSkill("workflow-router", router));
const entryResult = renderProjectEntry();
writeOwnedArtifacts(root, writePlan);

const registryResult = spawnSync(process.execPath, [path.join(toolkitRoot, "scripts", "create-skill-registry.js"), root], {
  cwd: root,
  stdio: "inherit",
});
if (registryResult.status !== 0) process.exit(registryResult.status || 1);
const authorityResult = spawnSync(process.execPath, [path.join(toolkitRoot, "scripts", "create-authority-map.js"), root], {
  cwd: root,
  stdio: "inherit",
});
if (authorityResult.status !== 0) process.exit(authorityResult.status || 1);

console.log(`Rendered operational skills: ${rendered.join(", ")}; ${entryResult}`);
