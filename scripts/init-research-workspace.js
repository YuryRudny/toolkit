#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { loadWorkspace, writeArtifact } = require("./lib/workspace");

const toolkitRoot = path.resolve(__dirname, "..");
const requestedRoot = path.resolve(process.argv[2] || process.cwd());
const workspace = fs.existsSync(path.join(requestedRoot, "workspace.json"))
  ? loadWorkspace(requestedRoot)
  : { artifactRoot: requestedRoot };
const base = "docs/agent-system/research-workspace";

const workingFiles = {
  "research-plan.md": `# План Research

## Цель

Собрать проверяемую базу знаний по всем customer-code репозиториям workspace без записи в них.

## Фазы

- [ ] Инвентарь репозиториев и модулей
- [ ] Hot spots и blast radius
- [ ] Critical flow traces
- [ ] Boundary и contract review
- [ ] Defect hunts
- [ ] Dependency usage review
- [ ] Tests и CI review
- [ ] Docs и RAG payload

## Ключевые вопросы

- Где находятся реальные trust и ownership boundaries?
- Какие потоки имеют максимальную бизнес-ценность и blast radius?
- Какие подтвержденные риски должны стать gates будущих skills?

## Текущий статус

Research workspace создан; task graph является источником статуса покрытия.

## Ошибки и блокеры

См. \`error-log.md\`.
`,
  "research-notes.md": `# Рабочие Заметки Research

## Инвентарь Модулей

## Hot Spots

## Flow Traces

## Contracts И Boundaries

## Defect Hunts

## Dependencies

## Tests И CI

## Привязки Для Skills
`,
  "evidence-log.md": `# Журнал Evidence

| Фаза | Тип evidence | Путь или команда | Что проверено | Результат | Целевой документ |
| --- | --- | --- | --- | --- | --- |
`,
  "error-log.md": `# Журнал Ошибок И Блокеров

| Фаза | Ошибка или blocker | Причина | Решение | Оставшийся gap |
| --- | --- | --- | --- | --- |
`,
  "decisions.md": `# Решения Bootstrap

| Решение | Evidence | Альтернативы | Почему выбрано | Затронутые docs или skills |
| --- | --- | --- | --- | --- |
`,
};

function ensure(relativePath, content) {
  const target = path.join(workspace.artifactRoot, relativePath);
  if (!fs.existsSync(target)) writeArtifact(workspace, relativePath, content);
}

for (const [name, content] of Object.entries(workingFiles)) ensure(`${base}/${name}`, content);

const formsRoot = path.join(toolkitRoot, "templates", "research-forms");
for (const name of fs.readdirSync(formsRoot).filter((item) => item.endsWith(".form.md")).sort()) {
  ensure(`${base}/forms/${name.replace(".form.md", ".md")}`, fs.readFileSync(path.join(formsRoot, name), "utf8"));
}

console.log(`Research workspace initialized: ${base}`);
