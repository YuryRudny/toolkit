# Deep Research Execution Algorithm

Используй этот reference в `deep-project-audit`, `full-project-research` и первом bootstrap.

Цель - сделать research воспроизводимым на любом стеке: frontend, backend, mobile, data, infra, monorepo. Агент не должен ограничиваться stack summary, чтением пары файлов или красивым описанием папок.

## Главный Принцип

Research идет не от впечатления, а от обхода проекта:

```text
inventory -> hot spots -> entry points -> flow traces -> contracts -> defect hunts -> dependency usage -> tests/CI -> docs/RAG payload
```

Нельзя писать skills до того, как из этого алгоритма появились concrete проектные привязки, risks, refactor slices и RAG.

## Pass 1: Инвентарь Проекта

Собери карту файлов и зон. Используй `rg --files`, manifests, configs и docs.

Обязательно выдели:

- package/build/runtime manifests;
- lockfiles;
- source roots;
- pages/routes/controllers/handlers/jobs/commands;
- shared libraries/components/services;
- state management/data access/repositories;
- DTO/schema/models/entities/migrations;
- middleware/plugins/interceptors/guards;
- tests/specs/e2e fixtures;
- CI/deploy/docker/k8s/infra configs;
- scripts/tooling;
- existing agent rules/skills.

Результат pass: не просто список файлов, а module inventory:

```markdown
| Зона | Path patterns | Ответственность | Почему важно | Что читать глубже |
```

## Pass 2: Hot Spots И Blast Radius

Найди кандидатов на хрупкие зоны:

- большие файлы/components/classes/modules;
- files с большим количеством imports/exports;
- shared utilities/services/components с множеством consumers;
- folders с высокой концентрацией TODO/FIXME/any/casts/unsafe APIs;
- routes/controllers/pages/jobs с data mutation;
- auth/security/payment/admin/file upload/rendering/caching areas;
- duplicate-looking names/patterns across modules;
- direct dependencies that look heavy/security-sensitive/rare.

Не называй это finding сразу. Это очередь для чтения.

Результат pass:

```markdown
| Hot spot | Evidence | Почему риск | Следующий шаг |
```

## Pass 3: Entry Points And Critical Flows

Выбери и протрассируй главные flows проекта. Для каждого применимого слоя должна быть хотя бы одна concrete trace, а для high-risk проекта - несколько.

Trace format:

```text
entry -> UI/controller/job/handler -> state/service/usecase -> repository/client/db -> DTO/schema/API/external system -> error/auth/cache behavior -> tests/checks
```

Для frontend:

- route/page/component entry;
- data fetching/state/composables;
- repository/API client/server route;
- DTO/response contract;
- loading/empty/error/permission states;
- SSR/client boundary;
- cleanup/cancellation/stale response.

Для backend:

- route/controller/message/job;
- service/usecase;
- repository/db/external client;
- validation/authz/transaction/idempotency;
- response/error contract;
- observability/tests.

Для data:

- migration/schema/model;
- read/write path;
- constraints/indexes;
- transaction boundaries;
- backfill/rollback.

Результат pass:

```markdown
| Flow | Trace chain | Contract | Error/auth/cache behavior | Tests/checks | Risks/gaps |
```

## Pass 4: Contract And Boundary Review

Для каждого critical flow проверь границы:

- external input validation;
- DTO/domain/UI/db model separation;
- null/empty/error shape handling;
- auth/authz authority;
- cache key and invalidation;
- concurrency/cancellation/idempotency;
- runtime/env/config validation;
- logging without secrets.

Результат pass:

```markdown
| Boundary | Evidence | Safe pattern | Fragile pattern | Finding/gap |
```

## Pass 5: Defect Hunts

Выполни defect hunts из `adversarial-codebase-research.md` не как checklist, а как рабочие поиски:

1. Сформулируй search/read plan.
2. Найди candidates.
3. Прочитай source вокруг candidates.
4. Подтверди finding, отклони или запиши gap.
5. Свяжи confirmed finding с risk/refactor/smoke.

Минимальные hunts:

- correctness/domain logic;
- architecture/ownership;
- data/API/contract safety;
- security/privacy;
- performance/resource leaks;
- type/runtime safety;
- testing/CI/observability;
- dependencies/supply chain.

Результат pass:

```markdown
| Defect class | Search/read plan | Candidates read | Confirmed findings | Rejected candidates | Gaps |
```

## Pass 6: Dependency Usage Review

Для каждого ecosystem manifest:

- перечисли direct dependencies;
- выдели heavy/security-sensitive/rare packages;
- найди usage в source;
- проверь one/two-place dependency candidates;
- проверь duplicate libraries for same job;
- проверь lockfile/engine/package-manager mismatch;
- если advisory audit недоступен, запиши freshness gap.

Security-sensitive categories:

- auth/session/crypto;
- upload/files/path;
- html/markdown/xml/yaml/template rendering/parsing;
- HTTP clients/proxies;
- serialization/deserialization;
- database/query builders;
- shell/process execution.

Результат pass:

```markdown
| Package | Type | Usage evidence | Risk surface | Replace/remove candidate | Gap |
```

## Pass 7: Tests, CI And Local Verification

Проверь:

- существуют ли tests/specs/e2e;
- какие команды реально есть в manifest;
- какие checks запускает CI;
- есть ли typecheck/build/lint/test as blocking gates;
- какие critical flows не защищены;
- почему локальная команда не запускается, если не запускается.

Результат pass:

```markdown
| Flow/area | Existing checks | Missing checks | Suggested smoke/regression |
```

## Pass 8: Findings To Docs Payload

Каждый confirmed finding должен превратиться в связку:

```text
finding -> risk-register row -> refactor-plan slice or smoke-check -> skill hook/reference
```

Каждый gap должен попасть в:

```text
research-evidence-pack -> current-state -> knowledge-index stop/gap
```

Каждый recurring local pattern должен попасть в:

```text
knowledge-base/project-map -> generated skill Проектные Привязки -> skill reference
```

## Что Нельзя Делать

- Нельзя использовать directory tree как evidence отсутствия проблем.
- Нельзя писать `pass`, если source не прочитан вокруг candidates.
- Нельзя делать “representative sample” без записи, почему sample достаточен.
- Нельзя считать dependency review завершенным без usage search.
- Нельзя считать security review завершенным без trust boundaries.
- Нельзя считать performance review завершенным без hot paths/resource lifecycle.
- Нельзя считать architecture review завершенным без consumers/dependency direction.
- Нельзя создавать skills, если research не дал проектные привязки и локальные антипаттерны.

## Итоговый Research Payload

Перед `project-docs-generator` сформируй payload:

```markdown
Research payload:
- Module inventory:
- Hot spots:
- Critical flow traces:
- Boundary/contract review:
- Defect hunts:
- Dependency usage review:
- Tests/CI review:
- Confirmed findings:
- Hypotheses/gaps:
- RAG hooks:
- Skill hooks:
- Refactor slices:
```
