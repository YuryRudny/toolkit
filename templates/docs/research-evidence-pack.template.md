# Research Evidence Pack

Инструкция генерации: evidence pack хранит подробную доказательную базу research. Не сжимай его до краткого отчета. Не удаляй секции шаблона. Для каждого `pass` укажи concrete evidence: files/functions/components/configs/commands. Если проверка не выполнена, запиши gap, а не `pass`.

## Scope Репозитория

- Root:
- Branch/status:
- Source roots:
- Excluded/generated/noisy paths:

## Классификация Слоев

| Слой | Статус | Evidence | Комментарий |
|---|---|---|---|

Статус: `применимо`, `не применимо`, `неясно`.

## Матрица Охоты На Дефекты

| Слой | Defect class | Что проверено | Evidence paths/commands | Findings | Gaps | Coverage |
|---|---|---|---|---|---|---|

Defect classes:

- correctness/domain logic;
- architecture/ownership;
- data/API/contracts;
- security/privacy;
- performance/resource leaks;
- type/runtime safety;
- testing/CI/observability;
- dependencies/supply chain.

## Покрытые Source Modules

| Module/path | Ответственность | Evidence | Coverage |
|---|---|---|---|

## Hot Spots И Blast Radius

| Hot spot | Evidence | Почему риск | Что прочитано | Follow-up |
|---|---|---|---|---|

## Покрытые Entry Points

| Entry point | Component/function | Downstream path | Contract/API | Evidence |
|---|---|---|---|---|

## Прослеженные Critical Flows

| Flow | Trace chain | Error/auth/cache behavior | Risks | Checks |
|---|---|---|---|---|

Trace chain format:

```text
entry file:function/component -> state/service/composable -> repository/server route -> DTO/schema/API/persistence/external system -> error/loading/auth/cache behavior
```

## Покрытые Data/API Contracts

| Contract | Source | Consumers | Validation/runtime safety | Evidence |
|---|---|---|---|---|

## Boundary/Contract Review

| Boundary | Что проверено | Evidence | Safe behavior | Fragile behavior/gap |
|---|---|---|---|---|

## Shared High-Risk Areas

| Area | Consumers | Blast radius | Evidence |
|---|---|---|---|

## Auth/Security Model

- Auth/session:
- Permissions:
- Secrets/env:
- Evidence:
- Gaps/blockers:

## Async/Cache/Concurrency

- Watchers/effects/jobs:
- Retries/backoff:
- Cache:
- Concurrency:
- Evidence:
- Gaps/blockers:

## Производительность И Утечки Ресурсов

- Hot paths:
- Unbounded operations:
- Timers/listeners/subscriptions:
- Sockets/streams/workers/connections:
- Caches/global state:
- Evidence:
- Gaps/blockers:

## Dependency Evidence

| Manifest/lock/audit source | Что проверено | Evidence | Status |
|---|---|---|---|

| Package/library | Direct/dev/transitive | Где используется | Usage search evidence | Heavy/rare/security-sensitive | Gap/decision |
|---|---|---|---|---|---|

## Команды/Проверки/CI

| Command/config | Назначение | Evidence | Status |
|---|---|---|---|

## Findings

| Severity | Finding | Evidence | Impact | Follow-up |
|---|---|---|---|---|

## Hypotheses

| Hypothesis | Needed evidence | Priority |
|---|---|---|

## Coverage Result

- Passed:
- Классификация слоев завершена: yes/no
- Охоты на дефекты завершены: yes/no
- Blocking gaps:
- Allowed next step:
- Surrogate coverage check:
  - `sampled`/`reviewed by tree` used as pass evidence: yes/no
  - file counts used as pass evidence: yes/no
  - shallow search output used as pass evidence: yes/no
