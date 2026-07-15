---
name: backend-engineering
description: Senior playbook для backend/API/server/workers слоя этого проекта. Используй при изменении endpoints, services, jobs, auth, validation, errors и observability.
---

# Backend Engineering

## Обзор

Backend changes должны сохранять contracts, auth/authz, validation, data integrity, idempotency, safe errors и observability. Не размазывай domain logic по transport layer.

## Когда использовать

- Изменяется API/server/worker/backend code.
- Меняется validation/auth/error/contract behavior.
- Есть data integrity, concurrency, transaction или external integration risk.

## Не использовать когда

- В проекте нет backend/server layer.
- Изменение только UI без backend contract impact.
- Existing backend skill authoritative.

## Обязательные Чтения

- `docs/agent-system/knowledge-base.md`
- `docs/agent-system/knowledge-index.md`
- `docs/agent-system/architecture-map.md`
- `docs/agent-system/risk-register.md`
- `codex-skills/references/backend-api-playbook.md`

## Быстрый Маршрут По RAG

- Endpoint/service change: <backend route>.
- Auth/security: <security route>.
- External integration: <integration route>.
- Data/contract: <contract route>.

## Использованные Seeds

| Seed | Source | Что взято | Адаптация | Что отброшено |
| --- | --- | --- | --- | --- |
| <seed> | <library/path> | <backend/API principles> | <project server/contracts> | <not applicable DB/transactions/etc> |

## Карта Контекста Проекта

- Server roots: <paths>.
- API/external integrations: <paths>.
- Contracts/DTOs: <paths>.
- Checks: <commands/smoke>.

## Проектные Привязки

- <route/service pattern>.
- <auth/error/validation convention>.
- <external system boundary>.

## Локальные Антипаттерны И Риски

| Risk | Backend area | Evidence | Rule |
| --- | --- | --- | --- |
| <RISK_ID> | <area> | <path> | <action> |

## Планка Качества

- Input validated at boundary.
- Auth/authz authority явно описан и server-side там, где это нужно.
- Error contracts безопасны и полезны для debugging.
- Multi-step writes have transaction/compensation/idempotency plan.
- External calls have timeout, retry/backoff/cancellation policy where applicable.
- Logs/metrics/traces help debugging without secrets.
- Contract compatibility и migration risks задокументированы.

## Порядок работы

1. Trace request/job flow through route -> service -> repository/external/data.
2. Определи contract и consumers.
3. Check validation/auth/authz/error behavior.
4. Implement small change near owning layer.
5. Добавь или обнови tests/smoke по blast radius.
6. Запиши risk/refactor gap, если contract или data integrity остаются хрупкими.

## Проверки По Слою

- Validation и parsing.
- Auth/authz и permissions.
- Error/response compatibility.
- Idempotency/concurrency/transactions.
- External integration timeout/degraded behavior.
- Observability и safe logging.
- Tests/contract/smoke.

## Контрольные gates

- No sensitive data in logs/errors.
- No silent catch without behavior.
- No transport-layer domain sprawl.
- No contract change without consumers/checks.

## Условия остановки

- Contract owner unclear.
- Auth/data integrity decision missing.
- External system required but unavailable.
- Migration/compatibility risk too high for scope.

## Формат результата

```markdown
Backend результат:
- Flow/contract:
- Validation/auth/errors:
- Data/external effects:
- Проверки:
- Risks/refactor gaps:
- Blockers:
```
