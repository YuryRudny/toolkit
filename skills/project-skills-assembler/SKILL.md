---
name: project-skills-assembler
description: Собирает project-local skills по строгому render pipeline. Используй после Docs/RAG Ready и выбора seeds, чтобы создать full-install skills через selected library skill, per-skill assembly sheet и fixed full template без свободного авторства.
---

# Project Skills Assembler

## Нулевой Закон Assembly

Агент не пишет full-install skills. Агент заполняет structured inputs, а toolkit рендерит full-install skills.

Для каждого full-install quality/stack/domain skill существует ровно один допустимый путь:

```text
target skill -> docs/agent-system/skill-inputs/<skill-name>.json -> extract-seed-playbooks.js -> RAG adaptation -> render-skills.js -> assembly sheet + codex-skills/skills/<skill-name>/SKILL.md
```

Если в голове возникла фраза "сейчас кратко напишу нормальный skill" - это выход из алгоритма. Вернись к `skill-inputs/<skill-name>.json` и заполни недостающие structured fields.

Финальный `SKILL.md` не является местом для размышления, пересказа или сжатия. Это compiled artifact.

## Resume Protocol

Если контекст был сжат, сессия была прервана или агент продолжает Phase 7 после долгого research, перед любым созданием `codex-skills/skills/*/SKILL.md` выполни resume-read:

1. Перечитай этот `SKILL.md`.
2. Перечитай `docs/agent-system/bootstrap-state.json`.
3. Перечитай `docs/agent-system/skill-inputs/index.json`, если он существует.
4. Если `skill-inputs` отсутствует, запусти `node reusable-agent-system-toolkit/scripts/create-skill-inputs.js .`.
5. Если есть старые compact/grouped files вроде `stack-and-domain.md` или `# Skill Assembly: ...`, не продолжай поверх них. Пересобери через `render-skills.js`.

После resume-read нельзя создавать финальные skills по памяти или по старому summary.

## Обязательные Чтения

- `reusable-agent-system-toolkit/references/bootstrap-strict-algorithm.md`
- `reusable-agent-system-toolkit/references/bootstrap-quality-contract.md`
- `reusable-agent-system-toolkit/references/skill-seed-library.md`
- `reusable-agent-system-toolkit/references/skill-generation-blueprint.md`
- `reusable-agent-system-toolkit/templates/skills/skill-adaptation-sheet.template.md`
- target `.full.template.md` из `reusable-agent-system-toolkit/templates/skills/`
- `reusable-agent-system-toolkit/skill-seeds/manifest.json`
- external manifest/index files из `skill-seeds/manifest.json`
- selected base `SEED.md` или `SKILL.md`
- project docs: `docs/agent-system/knowledge-base.md`, `knowledge-index.md`, `stack-profile.md`, `seed-selection.md`, `risk-register.md`, `refactor-plan.md`, `project-map.md`, `architecture-map.md`, `research-evidence-pack.md`, `current-state.md`

Читай только target full template для текущего skill. Не открывай все templates пачкой, если сейчас собирается один skill.

## Очередь Сборки

Собирай skills по одному. Не создавай batch `stack-skills.md`, не пиши несколько skills из одной формы.

1. `code-review-and-quality`
2. `debugging-and-error-recovery`
3. `refactor-engineering`
4. stack/domain skills, которые подтверждены `stack-profile.md`, `seed-selection.md` и RAG:
   - `frontend-ui-engineering`;
   - `frontend-state-and-data`;
   - `backend-engineering`;
   - `api-contract-safety`;
   - `testing-strategy`;
   - `security-performance-review`;
   - `mobile-capacitor-shell`.

Следующий skill начинается только после того, как предыдущий получил:

- `docs/agent-system/skill-assembly/<skill-name>.md`;
- `codex-skills/skills/<skill-name>/SKILL.md`;
- skill-specific reference, если target template требует reference.

## Target Skills И Full Templates

| Target skill | Full template | Preferred base library |
| --- | --- | --- |
| `code-review-and-quality` | `code-review-and-quality.full.template.md` | `ai-agents-skills-main/skills/code-review-and-quality` или `architecture-code-review` |
| `debugging-and-error-recovery` | `debugging-and-error-recovery.full.template.md` | `ai-agents-skills-main/skills/debugging-and-error-recovery` |
| `refactor-engineering` | `refactor-engineering.full.template.md` | `architecture-refactor` и applicable external refactor skill |
| `frontend-ui-engineering` | `frontend-ui-engineering.full.template.md` | `ai-agents-skills-main/skills/frontend-ui-engineering` или stack UI seed |
| `frontend-state-and-data` | `frontend-state-and-data.full.template.md` | TypeScript/state/data seed matching stack |
| `backend-engineering` | `backend-engineering.full.template.md` | backend/API seed matching stack |
| `api-contract-safety` | `api-contract-safety.full.template.md` | API design/TypeScript/schema seed matching evidence |
| `testing-strategy` | `testing-strategy.full.template.md` | CI/CD/testing seed matching stack |
| `security-performance-review` | `security-performance-review.full.template.md` | security/performance/dependency seed matching evidence |
| `mobile-capacitor-shell` | `mobile-capacitor-shell.full.template.md` | Capacitor seed when mobile shell evidence exists |

## Build Pipeline V2

Выполняй эти шаги как процедуру, без перестановок.

1. Запусти `node reusable-agent-system-toolkit/scripts/create-skill-inputs.js .`.
   - Скрипт определит target skills по project evidence.
   - Скрипт создаст `docs/agent-system/skill-inputs/<skill-name>.json` со `schemaVersion: 2`.
   - Скрипт не создает финальные `SKILL.md`.
2. Запусти `node reusable-agent-system-toolkit/scripts/extract-seed-playbooks.js .`.
   - Скрипт откроет selected seed `SEED.md`/`SKILL.md`.
   - Скрипт создаст `docs/agent-system/seed-extractions/<skill-name>.json`.
   - Скрипт заполнит `seedExtractions[]` concrete sections/rules/quality gates/result format.
   - Без этого шага selected seed считается неиспользованным.
3. Собирай каждый skill отдельно. Для одного `skill-inputs/<skill-name>.json` заполни v2 fields:
   - `status: "ready"`;
   - `seedExtractions[]` как объекты `{ seedId, sourcePath, sectionsUsed, rulesTaken, rulesRejected, projectAdaptation }`;
   - `ragRoutes[]` как объекты `{ label, path, when, extract }`;
   - `projectHooks[]` как объекты `{ name, paths, why, inspect }`;
   - `criticalFlows[]` как объекты `{ name, entry, chain, risk, verification }`;
   - `localRisks[]` как объекты `{ id, title, severity, evidence, action }`;
   - `workflowSteps[]` как объекты `{ step, action, evidence, output }`;
   - `layerChecks[]` как объекты `{ layer, check, evidence, verification }`;
   - `gates[]` как объекты `{ gate, trigger, action }`;
   - `stopConditions[]` как объекты `{ condition, why, nextAction }`;
   - `resultFormat[]` как объекты `{ field, content }`;
   - `useWhen`, `doNotUseWhen`, `qualityBar`, `preferredPatterns`, `antiPatterns`;
   - `references`.
4. Используй уже извлеченный `seedExtractions` как playbook scaffold и адаптируй его не общими словами, а конкретной связкой seed -> RAG/source/risk:
   - `sourcePath` - фактический путь к `SEED.md` или `SKILL.md`;
   - `sectionsUsed` - какие секции/правила seed реально использованы;
   - `rulesTaken` - какие инженерные правила взяты;
   - `rulesRejected` - что отброшено из-за чужого стека, отсутствия evidence или конфликта с проектом;
   - `projectAdaptation` - как seed превращён в проектный порядок работы через RAG/source/risk evidence.
5. Переноси не текст seed, а структуру поведения: роль, порядок, quality bar, проверочные lenses, формат результата. Всё project-specific бери из RAG/source.
6. Запусти точечный render: `node reusable-agent-system-toolkit/scripts/render-skills.js . <skill-name>`.
   - Renderer v2 не принимает старые массивы строк в ключевых секциях.
   - Если input готов, renderer создаст `codex-skills/skills/<skill-name>/SKILL.md`, `docs/agent-system/skill-assembly/<skill-name>.md` и skill-specific reference.
7. Перейди к следующему skill и повтори шаги 2-5.
8. После всей очереди запусти `node reusable-agent-system-toolkit/scripts/bootstrap.js render-operational .`, чтобы пересобрать registry/router из реально созданных skills.
9. Запусти `node reusable-agent-system-toolkit/scripts/check-bootstrap-state.js .`.
10. Создай вычисляемый report командой `node reusable-agent-system-toolkit/scripts/bootstrap.js quality-report .`.
11. Запусти `node reusable-agent-system-toolkit/scripts/bootstrap.js validate .`.

Markdown skills и assembly sheets руками не создавай. Ручная работа агента - найти evidence и заполнить structured inputs.

После завершения всей очереди запусти assembly contract check командой `node reusable-agent-system-toolkit/scripts/validate-generated-agent-system.js .`. Если проверка указывает missing/compact/grouped assembly sheet, вернись к structured inputs и rerender.

Не редактируй score в `bootstrap-quality-report.md` вручную. Если score низкий, исправь structured inputs/model/research artifacts и повторно запусти quality compiler.

## Как Заполнять V2 Input

`skill-inputs/<skill-name>.json` - это не черновик markdown. Это форма сборки senior playbook.

Заполняй её как инженерную карточку:

- `ragRoutes`: что открыть, когда открыть, что достать.
- `seedExtractions`: какой seed открыт, какие правила взяты, что отброшено, как адаптировано под проект.
- `projectHooks`: какие source paths являются точками входа, почему они важны, что там смотреть.
- `criticalFlows`: реальная цепочка `entry -> state/service -> repository/server/API -> contract/error/cache/auth behavior`.
- `localRisks`: не только risk id, а название, severity, evidence и действие skill.
- `workflowSteps`: каждый шаг имеет действие, evidence и выходной артефакт.
- `layerChecks`: проверка по слоям с понятной verification.
- `gates`: что меняет поведение агента при конкретном trigger.
- `stopConditions`: когда агент сообщает точный blocker и не гадает.
- `resultFormat`: какие поля должны быть в ответе после применения skill.

Если поле можно заполнить фразой без путей, flow, risk id или проверяемого выхода, значит поле заполнено слабо и его нужно усилить из RAG/source.

## Как Рендерить SKILL.md

Рендер делает скрипт `render-skills.js`.

1. Не создавай `SKILL.md` руками.
2. Не редактируй `docs/agent-system/skill-assembly/<skill-name>.md` руками.
3. Если результат слабый, исправляй `skill-inputs/<skill-name>.json` и rerender.
4. Пути, команды, risks, refactor IDs и references должны приходить из v2 input.

Нельзя объединять секции template. Нельзя создавать собственную структуру вместо template. Нельзя создавать "короткую версию" перед полной версией.

## Русский Язык

Все runtime-инструкции generated skills пишутся на русском.

Допустимо оставить:

- file paths;
- commands;
- env vars;
- package/framework/API names;
- code identifiers;
- Jira/Git/HTTP technical terms.

Если selected base skill на английском, переводи смысл в `Final text for SKILL.md`, а не в финальном файле на лету.

## Degraded Install

Если deep scan пропущен:

- не создавай full-install quality/stack/domain skills;
- создай только minimal router/general/access skills с marker `Degraded install: deep scan skipped by user`;
- запиши recommended seeds, но не выдавай их за adapted project skills.

## Условия Остановки

- `Docs/RAG Ready` не пройден.
- `seed-selection.md` отсутствует для full install.
- Для target skill нет selected base skill и нет достаточного evidence, чтобы собрать project-specific playbook.
- Assembly sheet не заполнен по каждой секции target template.
- `Final text for SKILL.md` generic и не содержит project evidence.
- Финальный `SKILL.md` не является clean render target full template.
- Generated skill требует английские runtime-инструкции.
- Любой full quality/stack/domain skill ниже `10/10` по `Skill assembly discipline` или `Skill senior quality`.

## Формат Результата

```markdown
Skills assembly:
- Skill:
  Base skill:
  Assembly sheet:
  Full template:
  Rendered skill:
  Reference:
  Project evidence:
  Gaps:
```
