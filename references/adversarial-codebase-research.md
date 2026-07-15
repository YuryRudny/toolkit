# Adversarial Codebase Research

Используй этот reference в `deep-project-audit`, `full-project-research`, `research-mode-guide` и validation.

Цель - заставить первый research работать как полноценный senior code-review всего проекта, а не как обзор стека. Research должен искать дефекты активно: архитектурные разломы, небезопасные границы, слабую типизацию, утечки ресурсов, performance traps, непроверенные critical flows, dependency risks и зоны, где код нельзя безопасно развивать агентами.

Этот протокол stack-neutral. Агент сначала определяет применимые слои проекта, затем проходит обязательные охоты на дефекты для каждого слоя. Примеры ниже не являются frontend-only или backend-only правилами: они адаптируются к любому стеку.

## Главный Принцип

Research считается глубоким только если агент может ответить:

- где начинаются и заканчиваются основные flows;
- какие границы доверия и данных существуют;
- где код хрупкий, небезопасный или плохо сопровождаемый;
- какие дефекты подтверждены evidence;
- какие риски требуют refactor slices;
- какие проверки реально защищают проект;
- какие зоны остаются непроверенными и почему.

Если агент нашел только stack, команды и список папок, это не research. Это discovery.

## Определение Слоев

Перед аудитом классифицируй проект:

- frontend UI;
- frontend state/data;
- SSR/server rendering или hybrid runtime;
- backend/API;
- workers/jobs/queues;
- database/persistence/migrations;
- mobile/desktop/native shell;
- CLI/scripts/tooling;
- infrastructure/deploy/CI;
- shared packages/libs/monorepo boundaries;
- security-sensitive/domain-critical flows.

Для каждого слоя запиши `применимо`, `не применимо` или `неясно`, с evidence. Если слой применим, но не проверен, coverage не может быть `pass`.

## Обязательные Охоты На Дефекты

### 1. Корректность И Domain Logic

Ищи:

- business rules, размазанные по UI/controllers/watchers/scripts без единого owner;
- разные реализации одного правила в разных местах;
- magic statuses/strings/numbers и positional assumptions;
- implicit defaults, которые меняют поведение без явного contract;
- edge cases: empty/null/invalid/permission/stale/partial data;
- race conditions между user actions, async tasks, jobs или repeated requests.

Evidence:

- конкретные files/functions/components;
- duplicated patterns;
- traced flow;
- тесты, которые отсутствуют или проверяют не тот behavior.

### 2. Архитектура И Ownership

Ищи:

- god modules/components/services;
- смешение presentation/domain/data/network/persistence/infrastructure;
- shared code с domain-specific side effects;
- циклические зависимости и неявные imports;
- слой, который знает слишком много о соседнем слое;
- broad abstractions без нескольких реальных consumers;
- несогласованные folder/domain boundaries после работы разных команд.

Evidence:

- module map;
- import/dependency directions;
- high-blast-radius files;
- examples of consumers;
- где новый код будет вынужден копировать плохой pattern.

### 3. Data/API/Contract Safety

Ищи:

- отсутствие runtime validation на external boundaries;
- смешение DTO/domain/UI/db models;
- parsing по labels/order/magic positions;
- breaking changes без compatibility strategy;
- migrations без rollback/expand-contract плана;
- response/error contracts, которые разные consumers понимают по-разному;
- cache keys, stale data или partial writes, которые ломают consistency.

Evidence:

- DTO/schema/API route/repository/client files;
- consumers;
- error/loading/auth/cache behavior;
- tests или их отсутствие.

### 4. Security And Privacy

Ищи применимые риски:

- secret leaks в repo/docs/logs/errors;
- frontend-only authorization;
- missing server-side permission checks;
- injection risks: SQL/NoSQL/command/template/path/HTML/markdown/XML/YAML;
- unsafe deserialization/parsing;
- SSRF/open redirect/file upload/path traversal;
- sensitive data in analytics/logs/client state;
- weak CORS/CSP/cookies/session settings;
- dependency/config risks.

Нельзя писать `security ok`, если проверены только package manifests. Security review должен иметь границы доверия и evidence по sensitive flows. Если network advisory audit недоступен, записывай freshness gap.

### 5. Performance И Resource Leaks

Ищи:

- unbounded loops, queries, lists, streams, queues;
- request floods, retry storms, polling without backoff;
- N+1 queries, missing indexes, missing pagination;
- heavy render/effect/watch loops;
- memory/resource leaks: timers, listeners, subscriptions, sockets, streams, observers, workers, file handles, DB connections;
- cache without invalidation или с неверным scope;
- heavy dependencies ради малого usage;
- blocking sync work на hot path.

Для frontend/hybrid проектов дополнительно ищи:

- SSR/client boundary mistakes;
- hydration mismatch risks;
- browser API usage без runtime guard;
- server-side singleton state leaking между requests/users;
- global caches без tenant/user/request key;
- route/page data fetching, который может отдавать stale content.

Для backend дополнительно ищи:

- connection leaks;
- missing timeouts/cancellation;
- uncontrolled concurrency;
- job idempotency gaps;
- transaction boundaries around multi-step writes.

### 6. Type/Runtime Safety

Ищи:

- `any`, unchecked casts, unchecked `unknown`;
- dynamic object indexing без guard;
- nullable assumptions;
- untyped event/message/job payloads;
- route params/env/config без validation;
- schema drift между generated clients и runtime API;
- framework escape hatches без justification.

### 7. Testing, CI And Observability

Ищи:

- critical flows без tests/smoke;
- tests, которые проверяют implementation details вместо behavior;
- flaky e2e/selectors/test data;
- отсутствующие negative/error/auth tests;
- CI, который не запускает typecheck/build/test/security checks;
- observability gaps в critical flows: logs/metrics/traces/health checks;
- невозможность локально проверить release-critical scenario.

### 8. Dependency And Supply Chain

Ищи:

- direct dependencies без usage evidence;
- heavy/security-sensitive packages;
- дублирующие библиотеки для одной задачи;
- one/two-place dependency candidates;
- deprecated/outdated packages, если evidence доступно локально или через allowed audit;
- postinstall/build scripts, native bindings, parsers, auth/crypto/upload/html/markdown/xml/yaml/http clients.

Не называй dependency плохой без evidence. Но если audit freshness недоступна, это gap, а не pass.

## Метод Работы

Для каждой охоты:

1. Сформулируй search plan.
2. Найди candidates через manifests, source roots, routes, imports, configs, tests.
3. Прочитай найденные files, а не только `rg` output.
4. Подтверди или отклони defect class.
5. Запиши evidence, impact, recommendation.
6. Если evidence недостаточно, запиши hypothesis/gap, а не confirmed finding.

`rg` output, file counts, directory tree и one-file sample не являются подтверждением отсутствия дефектов.

## Минимальная Evidence Matrix

Для каждого применимого слоя research должен заполнить:

| Слой | Defect hunts выполнены | Confirmed findings | Hypotheses/gaps | Evidence paths | Coverage |
|---|---|---|---|---|---|

Coverage может быть `pass` только если:

- основные entry points и high-risk areas проверены;
- дефектные классы либо проверены, либо отмечены not applicable с evidence;
- gaps не блокируют понимание архитектуры и risk profile;
- refactor plan можно связать с confirmed findings.

## Условия Остановки

Остановись до генерации final docs/RAG/skills, если:

- применимые слои не классифицированы;
- defect hunts не выполнены;
- research не нашел ни одного risk в явно сложном legacy проекте и при этом не доказал отсутствие рисков evidence matrix;
- security/performance/resource review заменены generic текстом;
- refactor plan не связан с confirmed findings;
- risk register не содержит actionable risks;
- coverage `pass` основан на tree/rg/sampling/counts.
