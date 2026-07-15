---
name: refactor-engineering
description: Планирует и выполняет безопасный senior-refactor. Используй при устранении архитектурного долга, упрощении сложного кода, выделении boundaries и реализации slices из refactor plan.
---

# Инженерный Рефакторинг

## Обзор

Рефакторинг должен улучшать структуру без случайной смены поведения. Работай маленькими slices, сохраняй behavior evidence и связывай каждое изменение с risk/refactor plan.

## Когда использовать

- Нужно выполнить пункт из `refactor-plan.md`.
- Код в touched area слишком связан, хрупок или смешивает responsibilities.
- Нужно выделить boundary, убрать duplication, стабилизировать contract.
- Перед feature work нужно расчистить локальный blocker.

## Не использовать когда

- Нужно изменить поведение без предварительной защиты текущего behavior.
- Scope слишком широкий и не разбит на slices.
- Нет evidence из risk/refactor docs или touched source.
- Нужно сначала понять систему: используй `research-audit`.

## Обязательные Чтения

- `docs/agent-system/knowledge-index.md`
- `docs/agent-system/knowledge-base.md`
- `docs/agent-system/refactor-plan.md`
- `docs/agent-system/risk-register.md`
- `docs/agent-system/architecture-map.md`
- `docs/agent-system/smoke-checklist.md`
- `codex-skills/references/refactor-playbook.md`
- routed stack/domain skill

## Быстрый Маршрут По RAG

Заполни при генерации:

- Risk/refactor item -> `<REFACTOR_ROWS>`.
- Shared module/component -> `<CONSUMER_ROWS>`.
- Contract/API boundary -> `<CONTRACT_ROWS>`.
- Unknown behavior -> `<SMOKE_AND_CHARACTERIZATION_ROWS>`.

## Карта Контекста Проекта

Заполни при генерации:

- Refactor candidates:
- High-blast-radius files:
- Protected flows:
- Existing smoke/tests:
- Architecture boundaries:

## Проектные Привязки

Заполни при генерации:

- Preferred local boundaries:
- Known bad patterns:
- Safe slice examples:
- Commands/checks:

## Локальные Антипаттерны И Риски

| Pattern/risk | Evidence | Refactor slice | Protected behavior |
|---|---|---|---|
| `<RISK_ID>` | `<PATH_OR_FLOW>` | `<SLICE>` | `<CHECK>` |

## Принципы

- Сначала behavior characterization, потом restructuring.
- Один refactor slice должен иметь понятную цель и проверку.
- Не смешивай refactor и новую функциональность без явной причины.
- Удаляй dead code только когда usage evidence надежен.
- Сохраняй public contracts или оформляй migration/compatibility.
- Не тащи broad rewrite, если локальный slice решает риск.

## Порядок работы

1. Найди risk/refactor item или сформулируй новый с evidence.
2. Определи protected behavior: tests, smoke, manual scenario, snapshots, contracts.
3. Выдели минимальный slice.
4. Проверь callers/consumers и affected flows.
5. Сделай структурное изменение без смены behavior.
6. Запусти проверки.
7. Обнови `refactor-plan.md`, `risk-register.md`, `project-map.md` или `current-state.md`, если поменялись boundaries.

## Контрольные gates

- Нет behavior evidence - нет high-risk refactor.
- Public API/DTO/schema changes требуют compatibility notes.
- Shared utilities/components нельзя менять без проверки consumers.
- Dead code removal требует `rg`/static evidence и осторожности с dynamic usage.
- Performance/security-sensitive refactor требует targeted checks.

## Проверки По Слою

Заполни при генерации:

- UI/component refactor:
- State/data/API refactor:
- Backend/domain refactor:
- Database/persistence refactor:
- Build/tooling refactor:

## Условия остановки

- Непонятно expected behavior.
- Blast radius шире одного slice.
- Нет тестов/smoke для critical flow, а manual verification невозможна.
- Refactor требует product/architecture decision.

## Формат результата

```markdown
Результат рефакторинга:
- Срез работ:
- Связанные risk/refactor IDs:
- Защита поведения:
- Измененные границы:
- Проверки:
- Обновления docs/RAG:
- Пробелы/blockers:
```
