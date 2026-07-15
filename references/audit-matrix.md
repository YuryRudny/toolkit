# Audit Matrix

Используй эту матрицу в `deep-project-audit`. Она stack-neutral; примеры нужно адаптировать под целевой проект.

## 1. Architecture

Проверить:

- размытые границы между UI, domain, transport, persistence и infrastructure;
- большие модули с несколькими ответственностями;
- shared code со скрытым project-specific поведением;
- циклические зависимости или трудно тестируемый global state;
- business logic внутри views/controllers, где ее нельзя переиспользовать и нормально тестировать.
- junior-level shortcuts: god components/services, hidden side effects, broad abstractions without consumers, copy-paste business rules.
- ownership drift: разные команды добавляли несовместимые patterns для одной задачи;
- code areas, где следующий change почти гарантированно заденет unrelated behavior.

Evidence:

- dependency graph, imports, module layout, повторяющиеся patterns, docs, tests.

## 2. Domain And Business Logic

Проверить:

- дублирующиеся business rules;
- magic statuses, strings, numbers и positional conventions;
- отсутствие guards для null/empty/invalid states;
- logic, размазанную по watchers/listeners/controllers без единого owner.

## 3. Data Contracts

Проверить:

- смешение DTO/domain/UI models без mapping;
- unsafe parsing external data;
- API response shape, угаданный по labels или array order;
- database migrations без rollback или compatibility notes;
- breaking changes без versioning или migration plan.

## 4. Async, Race And Concurrency

Проверить:

- UI watchers/effects, которые сохраняют init state как user input;
- retries без backoff или cancellation;
- concurrent writes в один resource;
- stale cache после fresh response;
- отсутствие transactions вокруг multi-step backend writes;
- queues/jobs без idempotency.

## 5. Type And Runtime Safety

Проверить:

- `any`, unchecked casts, слабую обработку `unknown`;
- отсутствие runtime validation на API boundaries;
- framework-specific unsafe escapes;
- untyped event payloads, route params и config.
- new code that continues unsafe local patterns without justification.

## 6. UI/UX And Accessibility

Использовать только если в проекте есть user-facing UI.

Проверить:

- missing loading, empty, error, disabled, success states;
- interactive elements, недоступные с клавиатуры;
- missing labels или focus management;
- layout overflow на целевых breakpoints;
- visual patterns, конфликтующие с design system проекта.

## 7. Security And Privacy

Проверить:

- secrets в repo/docs/logs;
- frontend-only authorization assumptions;
- unsafe input rendering;
- missing permission checks;
- sensitive data в analytics/logging;
- dependency/config risks.
- touched actions without server-side permission checks or validation.

Не делать security claims без evidence.

## 8. Performance

Проверить:

- repeated expensive computations в hot paths;
- request floods и retry storms;
- missing pagination/streaming/chunking;
- heavy watchers/effects;
- unbounded memory growth;
- N+1 queries или missing indexes.
- hot path changes that copy inefficient local patterns instead of isolating/fixing them.

## 8.1 Resource Leaks

Проверить применимые для стека ресурсы:

- timers/intervals/timeouts без cleanup;
- event listeners, observers, subscriptions, streams без teardown;
- sockets, workers, child processes, file handles, DB connections без закрытия;
- global/singleton caches без eviction, tenant/request/user key или lifecycle;
- retry/polling loops без limits/backoff/cancellation;
- server-rendering state, который может протекать между requests/users;
- background jobs, которые можно запустить повторно без idempotency.

Evidence:

- lifecycle/effect/watch/job/connection files;
- cleanup paths;
- runtime configs;
- tests/smoke, если есть.

## 9. Testing And Observability

Проверить:

- critical flows без tests;
- tests, которые проверяют implementation details вместо behavior;
- flaky e2e без stable selectors/data;
- отсутствие logs/metrics/tracing для важных backend operations;
- отсутствие smoke checklist для release-critical flows.

## 10. Agent Workflow And Project Knowledge

Проверить:

- отсутствует project map для будущих агентов;
- нет risk register или refactor plan для известных weak spots;
- research/router не имеют clear triggers и stop conditions;
- команда "ресерч" может уходить в поверхностное summary по стеку;
- отсутствует evidence pack или final review gate;
- enterprise integrations не имеют fail-fast access policy;
- existing rules конфликтуют или дублируются без merge decision.

## Finding Format

```markdown
- [Severity] Title
  Evidence:
  Impact:
  Recommendation:
  Suggested skill/doc:
```

Severity:

- Critical: data loss, security leak, broken core flow, production outage risk.
- High: broad regression risk, broken contract, race/concurrency risk.
- Medium: localized fragility, weak tests, weak typing, maintainability risk.
- Low: readability, small duplication, documentation gap.
