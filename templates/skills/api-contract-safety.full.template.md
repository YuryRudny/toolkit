---
name: api-contract-safety
description: Проверяет API/data contracts и compatibility. Используй при изменении request/response shapes, DTO, external integrations, validation и error contracts.
---

# API Contract Safety

## Обзор

API/data contract change безопасен только если известны producer, consumers, validation, error shape и compatibility path.

## Когда использовать

- Меняется API request/response.
- Меняется DTO/schema/normalization.
- Меняется external integration contract.
- Есть documented contract drift.

## Не использовать когда

- Изменение не затрагивает contracts.
- Contract owner недоступен и задача не может продолжаться безопасно.

## Обязательные Чтения

- `docs/agent-system/knowledge-base.md`
- `docs/agent-system/architecture-map.md`
- `docs/agent-system/research-evidence-pack.md`
- `docs/agent-system/risk-register.md`
- `codex-skills/references/backend-api-playbook.md`

## Быстрый Маршрут По RAG

- API/DTO: <contract route>.
- External service: <integration route>.
- Error handling: <debug/current-state route>.

## Использованные Seeds

| Seed | Source | Что взято | Адаптация | Что отброшено |
| --- | --- | --- | --- | --- |
| <seed> | <library/path> | <contract safety rules> | <project API/DTO evidence> | <not applicable persistence rules> |

## Карта Контекста Проекта

- Producers: <paths>.
- Consumers: <paths>.
- DTO/schema/normalizers: <paths>.
- External systems: <systems>.

## Проектные Привязки

- <contract example>.
- <normalization rule>.
- <consumer search hint>.

## Локальные Антипаттерны И Риски

| Risk | Contract | Evidence | Rule |
| --- | --- | --- | --- |
| <RISK_ID> | <contract> | <path> | <action> |

## Порядок работы

1. Найди producer и всех известных consumers.
2. Сравни request/response/error shapes.
3. Проверь validation/normalization at boundary.
4. Сохрани backward compatibility или задокументируй migration.
5. Add contract/smoke/regression check.

## Проверки По Слою

- Required/optional fields.
- Null/empty/error shapes.
- Backward compatibility.
- External service failure/degraded behavior.
- Consumer impact.

## Контрольные gates

- Нет contract change без consumer check.
- Нет dynamic shape assumption без normalization.
- Нет unsafe error leakage.

## Условия остановки

- Producer/consumer ownership unclear.
- Backend/API docs conflict with source.
- Contract migration requires product/backend decision.

## Формат результата

```markdown
API contract:
- Producer:
- Consumers:
- Shape changes:
- Compatibility:
- Проверки:
- Gaps:
```
