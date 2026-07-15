# Research Mode Guide

Используй этот reference при генерации `research-audit`, `workflow-router`, project docs и bootstrap flow.

Цель research mode - глубокий evidence-based аудит проекта и обновление документации, а не быстрый пересказ stack.

## Default Behavior

Если пользователь пишет `ресерч`, `research`, `глубокий анализ`, `найди слабые места`, `техдолг`, `карта проекта` или похожий запрос:

- сразу входи в Research mode через `workflow-router`;
- не переспрашивай scope, если можно безопасно взять весь проект;
- default scope = весь проект;
- не редактируй production code по умолчанию;
- если project docs отсутствуют или явно устарели, создай или обнови docs artifacts;
- если scope действительно невозможно определить, задай один короткий вопрос или остановись с blocker.

Нельзя отвечать поверхностным summary по стеку вместо research. Stack - только один input для аудита.

## First Bootstrap Requirement

При первом запуске toolkit в новом проекте `project-agent-bootstrap` обязан провести bootstrap research:

1. Project discovery:
   - stack;
   - entry points;
   - modules/domains;
   - critical flows;
   - commands;
   - tests;
   - CI/deploy;
   - enterprise integrations.
2. Deep audit:
   - layer classification;
   - adversarial defect hunts по применимым слоям;
   - dependency/library review;
   - architecture boundaries;
   - domain/business logic risks;
   - data/API contracts;
   - async/race/concurrency risks;
   - type/runtime safety;
   - UI/UX/accessibility, если есть UI;
   - security/privacy;
   - performance;
   - resource leaks;
   - testing/observability;
   - agent/process risks.
3. Full project research report на русском:
   - stack/runtime;
   - architecture;
   - data-flow;
   - dependency/library review;
   - security/privacy;
   - performance;
   - testing/CI;
   - confirmed findings;
   - gaps;
   - refactor recommendations.
4. Research evidence pack:
   - modules covered;
   - entry points covered;
   - critical flows traced;
   - data/API contracts covered;
   - shared high-risk areas checked;
   - auth/security/async/cache/CI/deploy covered or marked not applicable with evidence;
   - coverage result.
5. Coverage/depth validation.
6. Documentation/RAG:
   - agent knowledge base;
   - knowledge index;
   - project map;
   - project overview;
   - architecture map;
   - risk register;
   - refactor plan;
   - smoke checklist;
   - stack profile;
   - current state/worklog;
   - enterprise integrations, если применимо.

До прохождения full research и coverage/depth validation нельзя создавать final project maps, RAG базу или generated skills.

Bootstrap не считается завершенным, если нет research evidence pack, project map, risk register и refactor plan или если gaps не записаны явно.

## Required Research Artifacts

Для нового проекта или проекта без актуальных agent docs research должен создать/обновить:

- `docs/agent-system/project-map.md` или existing docs path;
- `docs/agent-system/full-project-research-report.md`;
- `docs/agent-system/research-evidence-pack.md`;
- `docs/agent-system/project-overview.md`;
- `docs/agent-system/architecture-map.md`;
- `docs/agent-system/risk-register.md`;
- `docs/agent-system/refactor-plan.md`;
- `docs/agent-system/smoke-checklist.md`;
- `docs/agent-system/stack-profile.md`;
- `docs/agent-system/current-state.md`;
- `docs/agent-system/research-worklog.md`, если research будет продолжаться итерациями.

Точный path можно адаптировать под проект, но артефакты должны существовать или быть явно marked as blocked.

## Evidence Sources

Research должен собрать карту evidence:

- file tree и module layout;
- package/build/test configs;
- CI/deploy configs;
- entry points, routes/controllers/pages/workers;
- domain modules and shared code;
- data contracts: API schemas, DTO, migrations, generated clients, repositories;
- tests/fixtures/smoke docs;
- existing project docs and agent rules;
- git status/diff only для текущей рабочей зоны;
- runtime/browser/network observations только если нужны для claims и безопасны.

Не включай secrets из `.env`, tokens, cookies, private payloads.

## Depth Criteria

Deep research считается достаточным только если:

- все top-level source modules/directories покрыты или excluded как generated/noisy с reason;
- entry points traced до downstream modules;
- critical flows traced через реальные files;
- layer classification выполнена;
- defect hunts выполнены по применимым слоям;
- risk findings имеют file/config/doc evidence;
- refactor plan slices вытекают из confirmed risks;
- knowledge base можно построить без guessing;
- stack-quality skills можно адаптировать к реальному stack.
- dependency/library/security/performance/testing review выполнены или gaps явно записаны.

Если criteria не пройдены, остановись до финальной генерации docs/skills.

## Audit Areas

Research должен покрывать применимые области:

- architecture boundaries and ownership;
- critical flows and user/business impact;
- fragile data access, positional assumptions, string/magic status conventions;
- type/runtime safety and validation boundaries;
- async/effects/watchers/jobs/race conditions;
- API/persistence contracts and migration safety;
- shared component/service blast radius;
- tests, smoke coverage and observability;
- security/privacy;
- performance hot paths;
- resource leak classes: timers/listeners/subscriptions/sockets/streams/workers/connections или аналоги в стеке;
- deployment/CI confidence;
- agent workflow/process gaps.

Если область неприменима, отметь это коротко. Если область важна, но не проверена, запиши gap.

## Finding Rules

Каждый confirmed finding должен иметь:

- severity;
- evidence: file/line, pattern, command output, config/doc reference или observation;
- impact;
- focused recommendation;
- suggested doc/skill/refactor follow-up.

Не смешивай confirmed findings, hypotheses и gaps.

## Documentation Rules

Research output не должен оставаться только в chat, если это bootstrap или missing docs case.

Документация должна быть:

- evidence-based;
- полезной следующему агенту;
- с paths/commands/checks;
- с risk ranking;
- с refactor slices, а не broad rewrite;
- с explicit gaps/blockers.

## Условия Остановки

Остановись и сообщи blocker, если:

- проект нельзя прочитать достаточно для project map;
- research требует auth/network/runtime access, а approved path отсутствует;
- невозможно определить critical flows даже после просмотра docs/configs;
- findings будут без evidence;
- coverage/depth criteria не пройдены;
- defect hunts не выполнены;
- нужно обновить docs, но target docs path конфликтует с existing project rules.

## Формат Результата

```markdown
Результат research:
- Scope:
- Layer classification:
- Defect hunts:
- Docs created/updated:
- Project map:
- Critical flows:
- Findings:
- Risk register updates:
- Refactor plan:
- Smoke checklist:
- Gaps/blockers:
- Next steps:
```
