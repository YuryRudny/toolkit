# Deep Bootstrap Research

Используй этот reference в `project-agent-bootstrap`, `project-discovery`, `deep-project-audit` и `project-docs-generator`.

Цель - перед генерацией skills, project maps и RAG базы действительно изучить проект. Bootstrap не должен сначала написать красивые docs/skills, а потом надеяться, что они верны.

## Жесткий Порядок

Первый bootstrap идет в таком порядке:

1. Read-only discovery.
2. Full project research-code-review по `full-project-research.md`.
3. Research evidence pack.
4. Coverage/depth validation.
5. Полный русскоязычный project research report.
6. RAG база: knowledge base/index.
7. Project docs: project map, architecture map, risk register, refactor plan, smoke checklist, current state/worklog.
8. Только после этого: stack standards, skills, modes, AGENTS.

До прохождения full research и coverage/depth validation нельзя создавать final `codex-skills/skills`, `AGENTS.md`, `knowledge-base.md`, `project-map.md`, `risk-register.md` или `refactor-plan.md`.

Разрешено вести scratch notes в `.tmp`, `/tmp` или черновой worklog, если проект это допускает, но их нельзя выдавать за финальные docs.

## Coverage Criteria

Deep bootstrap research должен покрыть:

- stack, runtime, package manager, manifests and lockfiles;
- dependencies/libraries: usage, heavy packages, outdated/deprecated/security-sensitive candidates;
- все top-level source modules/directories;
- все entry points: app/pages/routes/controllers/server handlers/jobs/workers;
- основные critical flows от entry point до state/service/repository/API/persistence/external system;
- shared components/services/composables/utilities с высоким blast radius;
- API/data contracts: DTO, schemas, migrations, generated clients, repositories;
- auth/session/permission model;
- error/loading/empty/permission behavior для UI, если есть UI;
- async/effects/watchers/jobs/retry/cache/concurrency behavior;
- build/test/lint/typecheck/dev commands;
- CI/deploy/runtime/env model;
- existing docs and agent rules;
- enterprise integrations, если есть evidence.
- full research report and refactor plan quality bar from `full-project-research.md`.
- layer classification and adversarial defect hunts from `adversarial-codebase-research.md`.

Если область отсутствует, запиши `not applicable` с evidence. Если область есть, но не проверена, research gate не пройден.

## Что Не Считается Покрытием

Не засчитывай coverage как `pass`, если evidence основан на одном из суррогатов:

- `tree reviewed`, `reviewed by tree`, `directory tree`, `file list` вместо чтения ключевых файлов;
- `sampled`, `samples`, `spot check`, `частично посмотрел`, если по этой области стоит `pass`;
- счетчики файлов без объяснения ownership, entry points, call chains и contracts;
- `rg` output без последующего чтения найденных файлов;
- checklist отмечен как выполненный без чтения files и trace evidence;
- пересказ stack/config без прослеженных runtime/data flows;
- формулировки `enough to generate docs/skills`, `non-blocking gaps` при непроверенных source areas;
- общие выводы без file/function/command evidence.

Для large repo можно использовать sampling только как planning technique. Итоговый coverage `pass` требует явного coverage matrix по subdomains/entry points и объяснения, почему непроверенные файлы не блокируют понимание архитектуры. Если это объяснение невозможно, остановись до генерации docs/RAG/skills.

## Обязательный Формат Trace

Critical flow считается traced только если есть цепочка вида:

```text
entry file:function/component -> state/service/composable -> repository/server route -> DTO/schema/API/persistence/external system -> error/loading/auth/cache behavior
```

Для каждого звена укажи конкретный path и, если видно из кода, function/component/action name. Flow без downstream path, contract и error/auth/cache поведения не может давать `coverage pass`.

## Evidence Pack

Перед генерацией docs/skills создай research evidence pack:

```markdown
Deep bootstrap research evidence:
- Scope репозитория:
- Layer classification:
- Defect hunts:
- Покрытые source modules:
- Покрытые entry points:
- Прослеженные critical flows:
- Покрытые data/API contracts:
- Shared high-risk areas:
- Auth/security model:
- Async/cache/concurrency:
- Найденные commands/checks:
- CI/deploy/runtime:
- Existing rules/docs:
- Enterprise integrations:
- Confirmed findings:
- Hypotheses:
- Gaps/blockers:
- Coverage result: pass/fail
```

Каждый пункт должен содержать paths, commands, docs или explicit `not applicable`.

## Depth Validation

Research depth считается достаточной только если:

- project map можно построить без guessing;
- critical flows traced через реальные files;
- coverage matrix не опирается на `sampled`/`reviewed by tree` как pass evidence;
- risk register findings имеют file/config/doc evidence;
- refactor plan slices вытекают из confirmed risks;
- knowledge base может ссылаться на concrete docs/files;
- stack-quality skills могут быть адаптированы к реальному stack;
- layer classification выполнена;
- defect hunts выполнены по применимым слоям;
- gaps не блокируют понимание базовой архитектуры.

Нельзя считать deep research завершенным по времени, количеству сообщений или уверенности агента.

## Условия Остановки

Остановись до генерации final docs/skills, если:

- full project research-code-review не проведен;
- dependency/library/security/performance/testing review отсутствуют;
- не покрыты top-level modules;
- critical flows не traced;
- defect hunts отсутствуют или заменены поверхностным checklist;
- security/performance/resource review не содержит evidence;
- coverage pass основан на sampling, tree review или file counts;
- findings основаны на догадках;
- неясна архитектура entry -> data/API/persistence;
- невозможно построить RAG knowledge base без повторного full discovery;
- полный русскоязычный report/refactor plan/RAG не может быть создан по evidence;
- runtime/auth/network evidence обязательно, но access path отсутствует и это блокирует понимание core flow.

## Result Format

```markdown
Deep bootstrap research:
- Coverage:
- Evidence pack:
- Passed:
- Blockers:
- Allowed next step:
```
