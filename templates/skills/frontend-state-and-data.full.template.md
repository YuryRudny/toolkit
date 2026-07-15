---
name: frontend-state-and-data
description: Senior playbook для frontend state/data слоя проекта. Используй при изменении stores, composables, client repositories, async data, forms, cache и DTO mapping.
---

# Frontend State And Data

## Обзор

Разделяй server data, form draft, UI state и derived state. Любые async/data изменения должны защищать stale responses, error states, permissions и contract drift.

## Когда использовать

- Меняются stores/composables/repositories/client data layer.
- Меняется form flow, async fetch, cache, DTO mapping.
- Есть риск stale state, race, contract drift или permissions gap.

## Не использовать когда

- Изменение только visual UI без state/data.
- Изменение относится к backend-owned contract без frontend impact.

## Обязательные Чтения

- `docs/agent-system/knowledge-base.md`
- `docs/agent-system/knowledge-index.md`
- `docs/agent-system/project-map.md`
- `docs/agent-system/risk-register.md`
- `codex-skills/references/frontend-ui-playbook.md`

## Быстрый Маршрут По RAG

- Store/composable: <state route>.
- Form flow: <critical flow route>.
- API/DTO: <contract route>.

## Использованные Seeds

| Seed | Source | Что взято | Адаптация | Что отброшено |
| --- | --- | --- | --- | --- |
| <seed> | <library/path> | <state/data rules> | <project stores/contracts> | <not applicable framework parts> |

## Карта Контекста Проекта

- State roots: <paths>.
- Data repositories/adapters: <paths>.
- DTO/contracts: <paths>.
- Critical flows: <flows>.

## Проектные Привязки

- <store/composable pattern>.
- <normalization/DTO pattern>.
- <error/loading convention>.

## Локальные Антипаттерны И Риски

| Risk | State/data area | Evidence | Rule |
| --- | --- | --- | --- |
| <RISK_ID> | <area> | <path> | <action> |

## Порядок работы

1. Проследи flow от UI entry до state/composable/repository/API.
2. Зафиксируй source of truth для данных.
3. Раздели server data, draft, UI state и derived state.
4. Проверь stale response, cancellation, duplicate submit, permissions и error state.
5. Обнови tests/smoke или documented gap.

## Проверки По Слою

- Loading/error/empty/permission states.
- DTO/contract compatibility.
- Stale response/cancellation.
- Form draft vs persisted data.
- Cache invalidation/reload behavior.

## Контрольные gates

- Нет silent state mutation без source of truth.
- Нет assumptions о backend shape без normalization.
- Нет lost error/loading state.

## Условия остановки

- Contract unclear.
- Required role/test data missing.
- Fix needs backend/product decision.

## Формат результата

```markdown
State/data:
- Flow:
- Source of truth:
- Contract:
- States:
- Проверки:
- Gaps:
```
