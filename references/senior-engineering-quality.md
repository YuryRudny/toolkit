# Senior Engineering Quality

Используй этот reference при генерации stack-specific skills, review gates, pre-change gates и domain skills.

Цель - чтобы project-local skills поднимали качество проекта до уровня сильного senior engineer: production correctness, безопасность, архитектурная ясность, тестируемость, observability и качественный UI там, где UI есть.

## Базовый Принцип

Агент должен уважать existing architecture и локальные conventions, но не считать плохой код нормой.

Если в зоне задачи виден unsafe, fragile или junior-level code, агент обязан выбрать один из вариантов:

1. Исправить внутри текущего scope, если это безопасно, локально и снижает риск.
2. Записать finding/gap в risk register или refactor plan, если исправление шире текущей задачи.
3. Остановиться с blocker, если дальнейшая работа поверх плохого кода создаст высокий риск регрессии, security issue или data loss.

Нельзя молча копировать плохой pattern только потому, что он уже есть в проекте.

## Code Quality Bar

Generated stack skills должны требовать:

- понятные boundaries между transport/UI/domain/data/infrastructure;
- typed contracts и runtime validation на внешних boundaries;
- отсутствие новых `any`, unsafe casts, positional assumptions и magic strings без justification;
- edge cases: null/empty/invalid/loading/error/permission states;
- idempotency/transactions/cancellation/backoff там, где есть повторные или multi-step operations;
- secure defaults: server-side auth checks, safe logging, no secrets, sanitized output;
- performance awareness для hot paths;
- test strategy, соответствующая blast radius;
- observability для critical flows;
- минимальные focused abstractions вместо broad rewrites.

## Правило Зоны Задачи

При любой code task generated skills должны проверять touched area и immediate neighbors:

- изменяемый файл;
- вызываемые helpers/composables/services;
- API/data contracts, которые затронуты;
- shared components/services, если изменение влияет на нескольких consumers;
- tests/smoke, которые защищают flow.

Если плохой код вне зоны задачи, не надо чинить его opportunistically. Запиши риск и предложи slice.

## Frontend UI Quality

Если проект имеет UI, `frontend-ui-engineering` должен требовать:

- соответствие local design system/tokens/components;
- semantic HTML и keyboard accessibility;
- focus management для dialogs/drawers/menus/popovers/route transitions;
- accessible names для icon-only controls;
- loading, empty, error, disabled, success и permission states;
- responsive behavior на project breakpoints или минимум 320/768/1024/1440;
- отсутствие text overflow, clipped controls, layout shift и overlapping elements;
- clear state boundaries: server data, form draft, UI state, derived state;
- cleanup для effects/watchers/subscriptions/timers/debounced work;
- protection from stale responses and request floods;
- realistic content и длинные labels для visual QA.

UI skill должен запрещать:

- generic AI-looking UI, если проект имеет design system;
- недоступные custom controls;
- silent missing error/loading states;
- новый shared component с domain-specific behavior без ownership decision.

## Backend Quality

Если проект имеет backend/API/workers, `backend-engineering` должен требовать:

- thin controllers/transport layer;
- domain rules в services/use-cases/domain modules;
- validation на request/job/message boundaries;
- stable response shapes and documented error contracts;
- transaction boundaries для atomic multi-step writes;
- idempotency для retries, webhooks, payments, jobs, external side effects;
- server-side authorization рядом с action/data access;
- safe errors/logging без secrets и sensitive payloads;
- retries with backoff/limits/cancellation;
- observability: logs/metrics/tracing для critical paths;
- focused tests для domain, API, persistence, auth/error paths.

Backend skill должен запрещать:

- доверие frontend-only authorization;
- business logic в controllers без причины;
- silent catch/retry loops;
- partial writes без transaction/compensation notes;
- leaking secrets/user data в logs/errors.

## API And Data Quality

`api-contract-safety` и `database-safety` должны требовать:

- explicit DTO/domain/database mapping;
- runtime validation external data;
- compatibility plan для breaking changes;
- migrations с rollback/compatibility notes;
- constraints/indexes для invariants;
- no response parsing by labels/order unless legacy adapter explicitly documents it;
- contract/smoke tests для critical endpoints/flows.

## Testing Quality

`testing-strategy` должен выбирать checks по risk:

- pure domain logic -> unit tests;
- API/persistence boundary -> integration/contract tests;
- UI behavior -> component/browser smoke;
- critical user journey -> e2e/manual smoke checklist;
- security-sensitive path -> auth/error tests;
- bug fix -> regression test или documented reason why not.

Нельзя считать задачу проверенной, если test gap просто проигнорирован.

## Security And Performance Review

`security-performance-review` должен проверять:

- secrets in repo/docs/logs;
- unsafe rendering or injection risks;
- permission checks and data exposure;
- sensitive analytics/telemetry/logging;
- N+1 queries, missing pagination/indexes;
- request floods/retry storms;
- heavy render/effect/watch loops;
- unbounded memory/timer/listener growth.

Claims по security/performance требуют evidence из code/config/dependencies/runtime observation.

## Generated Skill Requirements

Каждый stack-specific skill должен содержать:

- назначение и triggers;
- обязательные чтения: stack profile, project map, architecture map, risk register;
- порядок работы: inspect touched area -> apply local patterns -> improve unsafe local code -> verify;
- планка качества;
- gates;
- условия остановки;
- чеклист ревью;
- формат результата с evidence/gaps.

## Условия Остановки

Остановись или зафиксируй blocker, если:

- task требует писать поверх кода, который может привести к data loss/security leak;
- local pattern конфликтует с safety/correctness;
- отсутствует нужный contract/test/runtime evidence для high-risk change;
- изменение shared component/service имеет unclear blast radius;
- архитектурный fix выходит за scope и пользователь не подтвердил refactor slice.
