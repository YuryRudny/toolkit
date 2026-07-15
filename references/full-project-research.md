# Full Project Research

Используй этот reference при первом bootstrap, `ресерч` mode и deep audit.

Цель - провести полноценный research-code-review всего проекта и создать русскоязычную базу знаний для разработчиков и агентов. Это не быстрый обзор stack и не генерация skills. Сначала исследование, потом документы/RAG, потом skills.

## Обязательный Результат Первого Bootstrap

После первого запуска toolkit в проекте должны появиться или обновиться docs в существующей docs-папке проекта, иначе в `docs/agent-system/`:

- `full-project-research-report.md` - полный отчет для разработчиков;
- `research-evidence-pack.md` - evidence matrix;
- `knowledge-base.md` и `knowledge-index.md` - RAG-like база для агентов;
- `project-map.md` и `architecture-map.md`;
- `risk-register.md`;
- `refactor-plan.md`;
- `smoke-checklist.md`;
- `current-state.md` и `research-worklog.md`;
- `stack-profile.md`.

Все narrative sections, headings, findings, risks, recommendations и plans должны быть на русском языке. Технические identifiers, file paths, package names, commands и API names можно оставлять как есть.

## Research-Code-Review Принцип

Первый research должен работать как ревью всего проекта уровня senior engineer. Агент не просто описывает stack, а активно ищет дефекты и риски по применимым слоям.

Перед основной матрицей обязательно прочитай `adversarial-codebase-research.md` и выполни:

- layer classification: какие слои проекта применимы;
- defect hunts для каждого применимого слоя;
- evidence matrix: что проверено, какие findings подтверждены, какие gaps остались.

Если defect hunts не выполнены, нельзя создавать финальные RAG/skills/refactor plan.

Перед docs/RAG обязательно выполни `deep-research-execution-algorithm.md`:

- module inventory;
- hot spots and blast radius;
- critical flow traces;
- contract and boundary review;
- defect hunts;
- dependency usage review;
- tests/CI review;
- findings-to-docs payload.

Этот алгоритм нужен не только для отчета. Он должен дать material для generated skills: проектные привязки, локальные антипаттерны, подсказки поиска source, commands/checks и risk/refactor links. Если такого material нет, skills будут generic, а bootstrap должен вернуться к research.

Во время bootstrap/deep scan также используй `research-working-memory.md`: веди `research-plan.md`, `research-notes.md`, `evidence-log.md`, `error-log.md`, `decisions.md`. Финальные docs/RAG должны строиться из этих файлов. Если `evidence-log.md` пустой, research считается недостаточно материализованным.

## Research Matrix

Покрой весь проект по направлениям:

1. Stack and runtime:
   - language/framework/runtime versions;
   - package manager and lockfile;
   - build/dev/test/lint/typecheck commands;
   - app entry points, server entry points, workers/jobs/scripts;
   - runtime env/config/secrets policy без secret values.

2. Architecture:
   - modules/domains and ownership boundaries;
   - dependency direction and layering;
   - shared components/services/composables/utils;
   - high-blast-radius files;
   - cyclic/implicit coupling risks;
   - places where UI/domain/data/network/persistence are mixed.

3. Data flow and contracts:
   - entry -> state/service/composable -> repository/server route -> DTO/schema/API/persistence/external system;
   - validation and runtime safety;
   - error/loading/empty/permission states;
   - caching, retries, dedup, queues, transactions, idempotency;
   - data loss, stale state, race conditions.

4. Code quality and maintainability:
   - large files/components/classes;
   - duplicate logic;
   - unsafe casts, `any`, nullable assumptions, dynamic object indexing;
   - magic strings/numbers, positional access, display-name lookup;
   - hidden side effects in watchers/effects/hooks/lifecycle;
   - boundaries that make tests/refactor hard.

5. Dependencies and libraries:
   - direct dependencies and devDependencies;
   - heavy packages used in one/two places;
   - packages that duplicate platform/framework features;
   - obsolete/deprecated packages visible from package metadata/lockfile/docs;
   - potential security-sensitive packages: auth, crypto, upload, html rendering, markdown, xml/yaml parsers, HTTP clients;
   - version and maintenance risks when evidence is available locally.

6. Security and privacy:
   - auth/session/permissions;
   - frontend-only permission assumptions;
   - backend validation, authorization, injection, SSRF/path traversal/file upload risks where applicable;
   - secret handling, logging, PII/user payloads;
   - CORS/CSP/cookies/headers where visible;
   - dependency risks from lockfile/package config. Если network audit недоступен, запиши blocker/gap, не делай вид, что audit прошел.

7. Performance and bundle/runtime cost:
   - large dependencies and duplicate libraries;
   - hot paths, repeated network calls, request floods;
   - SSR/cache behavior, hydration/rerender risks;
   - unbounded loops over large structures;
   - backend N+1, missing indexes, slow queries where applicable;
   - memory leaks from timers/listeners/subscriptions.

8. Testing and delivery confidence:
   - existing tests and missing tests;
   - CI checks vs local checks;
   - smoke scenarios by critical flow;
   - release/publish policy;
   - observability/logging/health checks.

9. Product/domain risks:
   - core business flows;
   - money/data/security-critical operations;
   - user-visible failure modes;
   - docs/Jira/Confluence context when configured.

10. Adversarial defect hunts:
   - correctness/domain logic;
   - architecture/ownership;
   - data/API/contract safety;
   - security/privacy;
   - performance/resource leaks;
   - type/runtime safety;
   - testing/CI/observability;
   - dependency/supply-chain.

Для каждого применимого слоя запиши, какие defect classes проверены, какие findings подтверждены, какие hypotheses/gaps остались и какие evidence paths использованы.

## Dependency Research Rules

Для JS/TS проектов обязательно прочитай `package.json` и lockfile summary. Для других ecosystems читай соответствующие manifests: `pom.xml`, `build.gradle`, `requirements*.txt`, `pyproject.toml`, `poetry.lock`, `Pipfile.lock`, `go.mod`, `Cargo.toml`, `composer.json`, `.csproj`, etc.

Если network доступен и политика проекта разрешает, можно запускать ecosystem audit (`npm audit`, `yarn npm audit`, `pnpm audit`, `pip-audit`, `cargo audit`, etc.). Если network недоступен, делай offline dependency review по manifest/lockfile и явно запиши gap: `security advisory freshness not checked`.

Минимальный dependency evidence contract:

- для каждого direct dependency укажи source: manifest, lockfile или build config;
- определи назначение: runtime, dev-only, build-only, test-only, transitive risk;
- выполни usage search по source roots для heavy/security-sensitive/rare packages и запиши evidence: files, imports/usages, пример search pattern или command;
- не называй package unused, deprecated, dangerous или replaceable без evidence;
- если package используется в одном/двух местах, запиши точные files и возможную замену;
- если package security-sensitive, проверь хотя бы local risk surface: auth, crypto, html/markdown/xml/yaml parsing, upload, http client, serialization, file/path handling;
- если audit не запускался или network недоступен, явно запиши audit freshness gap и не ставь security review как complete.

Отдельно отметь:

- heavy dependency candidates;
- one/two-place usage candidates;
- possible replacement with native/framework functionality;
- packages that appear unused or redundant;
- packages that require runtime/browser/security caution.

## Отчет Для Разработчиков

`full-project-research-report.md` должен быть написан как инженерный отчет:

- executive summary;
- stack and runtime;
- architecture overview;
- data-flow map;
- dependency/library review;
- security review;
- performance review;
- resource leak review;
- adversarial defect hunt matrix;
- testing/CI review;
- confirmed findings by severity;
- hypotheses/gaps;
- refactor recommendations with examples;
- next 30/60/90 day plan или phased plan, если проект большой.

Каждая confirmed finding должна иметь evidence: file path, function/component/action name, config path, command output или doc reference. Hypothesis без evidence не должна попадать в confirmed findings.

## Refactor Plan Quality Bar

`refactor-plan.md` должен быть полноценным инженерным планом:

- контекст и верхнеуровневая оценка;
- главные риски;
- принципы рефакторинга;
- phased plan или slices;
- критерии успеха;
- recommended starting point;
- examples of concrete problematic files/patterns;
- checks/smoke per slice;
- stop conditions.

Не пиши generic slices вроде "улучшить архитектуру". Каждый slice должен ссылаться на risk ids/evidence и объяснять, почему он важен.

## RAG Base Rule

RAG base создается после full research и должна позволять будущему агенту не повторять full discovery:

- `knowledge-base.md` = компактный стартовый контекст, flows, risks, commands, stack gates;
- `knowledge-index.md` = topic/task -> читать сначала -> docs/source -> skills -> checks;
- research report и evidence pack остаются source of truth;
- generated skills должны читать RAG сначала, затем scoped docs/source.

Плотность RAG обязательна:

- knowledge base должен содержать project identity, stack, entry points, critical flows, module/domain map, high-risk areas, dependency watchlist, commands, retrieval rules и gaps;
- knowledge index должен покрывать минимум: feature, UI, backend/API, database/migration, auth/security, performance, dependencies, research, refactor, enterprise task, merge/publish. Если слой отсутствует в проекте, запиши `не применимо` с evidence;
- каждый routing row должен указывать не только docs, но и source/source code область, required skill/checks и stop/gap;
- RAG не должен быть пересказом full report. Он должен быть быстрым retrieval layer для следующего агента.

## Привязки Для Skills Payload

Перед запуском `project-skills-assembler` research/docs должны дать отдельный payload для skills:

- `проектные привязки`: конкретные directories/files/flows/commands, которые должен знать skill;
- `локальные антипаттерны`: подтвержденные хрупкие patterns из findings/risk register;
- `preferred local patterns`: хорошие локальные patterns, если они есть;
- `подсказки поиска source`: как быстро найти affected source для задачи;
- `risk/refactor links`: какие risk IDs/refactor slices должны всплывать в skill;
- `checks by blast radius`: какие команды/smoke checks запускать для этого слоя.

Этот payload может быть распределен между `knowledge-base.md`, `knowledge-index.md`, `risk-register.md`, `refactor-plan.md` и skill references, но он должен быть явно доступен. Без него generated skills неизбежно станут общими.

## Планка Качества Risk Register

`risk-register.md` должен быть исполнимым инженерным документом:

- каждый confirmed risk имеет ID, severity, область/flow, проблему, evidence, trigger/condition, impact, recommendation, owner/skill, required checks и status;
- dependency/security risks отделены от архитектурных и продуктовых рисков;
- каждый `Critical`/`High` связан с `refactor-plan.md`, `smoke-checklist.md` или blocker;
- hypothesis/gap не смешивается с confirmed risk;
- нет generic пунктов вроде "улучшить архитектуру" без files/patterns/checks.

## Условия Остановки

Остановись до генерации RAG/skills, если:

- отчет будет поверхностным stack summary;
- не проверены dependencies/manifests;
- не проверены architecture/data flow/security/performance/testing areas;
- defect hunts не выполнены по применимым слоям;
- layer classification отсутствует;
- refactor plan нельзя связать с confirmed risks;
- confirmed findings не имеют evidence;
- dependency review не содержит manifest/lockfile/usage evidence;
- risk register нельзя использовать как план действий: нет trigger/impact/check/status;
- knowledge base/index не позволяют следующему агенту выбрать docs/source/skills без повторного full discovery;
- документы будут не на русском языке;
- невозможно построить RAG без повторного full discovery.
- research не дал проектные привязки/локальные антипаттерны/подсказки поиска source для generated skills.
- полный deep scan не вел рабочую память или `evidence-log.md` пустой.
