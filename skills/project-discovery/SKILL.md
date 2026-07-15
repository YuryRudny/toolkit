---
name: project-discovery
description: Изучает целевой репозиторий перед генерацией agent docs или skills. Используй для карты stack, architecture, commands, tests, CI, domains, critical flows, existing rules и ownership boundaries в frontend, backend, full-stack, mobile или infrastructure проекте.
---

# Project Discovery

## Обзор

Построй фактическую карту репозитория. Discovery должен идти до audit, documentation и skill generation.

При первом bootstrap discovery не ограничивается стеком. Он должен подготовить project map: entry points, domains/modules, critical flows, data contracts, shared high-risk areas, commands, tests, CI/deploy и gaps.

Discovery остается read-only phase. Он не создает final docs/RAG/skills; он подготавливает evidence для deep bootstrap research.

## Обязательные Чтения

- `reusable-agent-system-toolkit/references/discovery-search-heuristics.md`

## Порядок работы

1. Проверь branch/status и не меняй файлы во время discovery.
2. Собери project metadata:
   - package/build files;
   - language/framework markers;
   - CI/CD configs;
   - test configs;
   - Docker/infrastructure files;
   - docs и existing agent rules.
   Используй search patterns из `discovery-search-heuristics.md`.
3. Собери enterprise integration metadata:
   - Jira key patterns, issue links and existing Jira skills/rules;
   - Confluence links/page ids and access rules;
   - Git remotes, default branch, подсказки protected branch policy, GitLab CI/MR docs;
   - approved env source и имена переменных, не печатая secrets;
   - доступность connector/MCP/helper-script, если project docs уже это определяют.
   - используй env source только если путь подтверждён пользователем или existing project rules. Проверяй только имена required keys, не печатай values.
4. Определи stack:
   - frontend frameworks;
   - backend frameworks;
   - database/storage/queue;
   - API style;
   - auth/session model;
   - deployment/runtime.
5. Построй architecture map и project map:
   - entry points;
   - modules/domains;
   - shared components/services;
   - data flow;
   - external integrations;
   - critical user/API/job flows;
   - data/API/persistence contracts;
   - shared high-risk areas;
   - ownership boundaries.
6. Определи commands:
   - install;
   - lint;
   - typecheck;
   - unit tests;
   - integration/e2e tests;
   - build;
   - local server.
7. Определи critical flows, risk zones и likely refactor slices.
8. Подготовь enterprise integration config для `project-docs-generator` и `project-skills-assembler`:
   - enabled/unavailable для Jira, Confluence, Git/GitLab;
   - настроенный метод доступа для каждой системы;
   - required probes и permissions;
   - fail-fast условия остановки.
9. Подготовь discovery notes для `project-docs-generator` и `project-skills-assembler`.

## Источники evidence

- File tree и config files.
- Existing docs и README.
- CI scripts и package scripts.
- Tests и fixtures.
- API schemas или migrations.
- Runtime/browser/network observations только если это явно нужно и безопасно.
- Enterprise integration evidence из existing project rules, remotes, CI configs, docs, approved env variable names и доступности connector.

## Контрольные gates

- Не выводи framework по одной dependency, если project structure говорит обратное.
- Не запускай expensive или destructive commands во время discovery.
- Не записывай secrets из `.env` files в docs или final output.
- Не генерируй rules до карты commands и architecture.
- Не делай live Jira/Confluence/GitLab probe во время discovery, если access path не подтвержден project rules/user approval.
- Не выводи enterprise access method по догадке; если config неполный, пометь integration как unavailable/gap.
- Не помечай Jira/Confluence как unavailable до вопроса о разрешённом env source и попытки configured read-only probe.
- Не выдавай discovery как готовый результат, если есть только stack summary без project map, critical flows и risk zones.
- Не создавай final project docs или skills на discovery phase до passed deep research coverage gate.

## Условия остановки

- Stack нельзя определить по repository evidence.
- Нужные docs/configs отсутствуют, а assumptions рискованные.
- Discovery требует network/auth access без разрешения пользователя.
- Jira/Confluence/GitLab workflow обязателен, но невозможно подтвердить credential source, метод доступа или permission boundary.
- Невозможно построить project map по доступным файлам и docs.

## Формат результата

```markdown
Discovery:
- Stack:
- Architecture:
- Project map:
- Critical flows:
- Existing rules:
- Commands:
- Tests:
- Enterprise integrations:
- Refactor candidates:
- Risk zones:
- Gaps/blockers:
```
