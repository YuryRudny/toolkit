# Research Docs Blueprint

Используй этот reference в `project-docs-generator` после full research и до генерации skills.

Цель - не дать агенту превратить deep research в короткий executive summary. Первый bootstrap должен оставить документацию, по которой следующий агент и разработчик реально понимают проект, риски, flows и план рефакторинга.

## Главный Принцип

`full-project-research-report.md` - это отчет для людей.

`research-evidence-pack.md` - это доказательная база.

`knowledge-base.md` и `knowledge-index.md` - это быстрый RAG/retrieval слой для будущих агентов.

`risk-register.md`, `refactor-plan.md`, `smoke-checklist.md` - это исполнимые инженерные документы.

Нельзя заменить эти документы одним коротким пересказом.

## Линия Сборки Docs

Перед записью docs возьми payload из `deep-research-execution-algorithm.md` и рабочую память из `research-working-memory.md`, затем разложи по документам:

```text
research-plan -> research-worklog, current-state
research-notes -> full report, knowledge-base, project-map
evidence-log -> research-evidence-pack
error-log -> gaps, current-state, research-worklog
decisions -> agent-operating-model, enterprise-integrations, generated skills
module inventory -> project-map, architecture-map, knowledge-base
hot spots -> risk-register, refactor-plan, knowledge-index
critical flow traces -> full report, evidence pack, smoke checklist, skills hooks
contract/boundary review -> risk-register, stack-profile, backend/API skills
defect hunts -> full report, evidence pack, risk-register
dependency usage review -> full report, stack-profile, security-performance references
tests/CI review -> risk-register, smoke-checklist, testing-strategy
findings/gaps -> current-state, research-worklog, knowledge-index
```

## Полный Research Отчет

`full-project-research-report.md` должен быть long-form отчетом, а не тезисами.

Обязательные секции:

- краткое резюме;
- стек и runtime;
- архитектурный обзор;
- module/domain map;
- high-blast-radius зоны;
- классификация слоев;
- матрица defect hunts;
- critical flow traces;
- data/API/contract review;
- dependency/library review;
- security review;
- performance/resource review;
- testing/CI review;
- confirmed findings by severity;
- hypotheses/gaps;
- refactor recommendations;
- 30/60/90 plan.

Для каждого confirmed finding нужны:

- ID;
- severity;
- affected area/flow;
- concrete evidence path/function/component/config;
- trigger;
- impact;
- recommendation;
- required checks.

Если отчет можно прочитать за минуту и он не дает разработчику новой информации о конкретных flows и source areas, это не полный отчет.

## Research Evidence Pack

`research-evidence-pack.md` должен сохранять сырые evidence-таблицы:

- scope repository;
- layer classification;
- module inventory;
- hot spots;
- entry points;
- critical flow traces;
- boundary/contract review;
- defect hunt matrix;
- dependency usage evidence;
- commands/tests/CI evidence;
- findings;
- hypotheses/gaps;
- coverage result.

Evidence pack не обязан быть красивым. Он обязан быть проверяемым.

Если deep scan был включен, evidence pack должен явно включать или суммировать строки из `research-workspace/evidence-log.md`. Пустой evidence-log означает, что research велся в чате и не может считаться полноценным.

Не сжимай defect hunts до пяти строк. Для каждого применимого слоя запиши, что именно искали, какие candidates читали, что подтвердилось, что отклонено и какие gaps остались.

## Knowledge Base

`knowledge-base.md` - компактный, но плотный стартовый контекст.

Он должен содержать:

- identity проекта;
- stack;
- source roots;
- entry points;
- critical flows;
- module/domain map;
- high-risk areas;
- dependency watchlist;
- enterprise state;
- команды;
- retrieval rules;
- gaps/blockers.

Это не копия full report. Это quick-start для агента.

## Knowledge Index

`knowledge-index.md` должен быть маршрутизатором retrieval:

```markdown
| Тип задачи | Читать сначала | Source areas | Skills | Проверки | Stop/gap |
```

Покрой минимум:

- feature/bug;
- UI;
- state/data;
- backend/API/server;
- auth/security;
- performance/resource;
- dependencies;
- testing;
- refactor;
- research;
- enterprise/Jira;
- merge/publish;
- database/migration или `не применимо` с evidence.

## Risk Register

Каждый risk должен иметь:

- ID;
- severity;
- affected flow/area;
- problem;
- evidence;
- trigger/condition;
- impact;
- recommendation;
- owner skill;
- required checks;
- status.

Не смешивай confirmed risks и hypotheses.

## Refactor Plan

Каждый slice должен иметь:

- связанный risk ID;
- problem statement;
- source examples;
- protected behavior;
- concrete steps;
- checks;
- expected outcome;
- stop conditions.

План “улучшить архитектуру” без source examples и checks бесполезен.

## Smoke Checklist

Каждый smoke item должен иметь:

- flow;
- setup;
- action;
- expected result;
- evidence to capture;
- related risk IDs.

## Что Нельзя Делать

- Нельзя писать `full-project-research-report.md` как краткий список findings.
- Нельзя выбрасывать template sections.
- Нельзя сокращать evidence pack до “что проверено”.
- Нельзя делать RAG без source areas и stop/gap rules.
- Нельзя писать risk/refactor без concrete source evidence.
- Нельзя создавать skills, если docs не дают проектные привязки и локальные антипаттерны.
- Нельзя игнорировать `research-workspace/*` при генерации docs.

## Формат Отчета Docs Generator

```markdown
Docs generation:
- Full report:
  Sections:
  Findings:
  Flow traces:
- Evidence pack:
  Layers:
  Defect hunts:
  Gaps:
- RAG:
  Retrieval rows:
  Project hooks:
- Risk/refactor/smoke:
  Linked risk IDs:
  Checks:
```
