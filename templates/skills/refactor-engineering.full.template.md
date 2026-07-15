---
name: refactor-engineering
description: Выполняет безопасные refactor slices из risk/refactor docs. Используй для архитектурного долга, cleanup touched area и изменения boundaries без feature creep.
---

# Refactor Engineering

## Обзор

Refactor допустим только как маленький проверяемый slice с защищенным поведением. Не переписывай широко и не смешивай feature work с structural cleanup без причины.

## Когда использовать

- Пользователь просит refactor.
- Touched area содержит подтвержденный risk/refactor item.
- Нужно выделить boundary, убрать duplication, стабилизировать contract.
- Code review нашел архитектурный долг, который можно исправить локально.

## Не использовать когда

- Нет protected behavior или smoke/test path.
- Refactor маскирует feature change.
- Scope слишком широкий для одного slice.

## Обязательные Чтения

- `docs/agent-system/refactor-plan.md`
- `docs/agent-system/risk-register.md`
- `docs/agent-system/knowledge-index.md`
- `docs/agent-system/current-state.md`
- `codex-skills/references/refactor-playbook.md`

## Быстрый Маршрут По RAG

- Slice by risk: <risk/refactor route>.
- Touched area cleanup: <source route>.
- Boundary migration: <architecture map route>.

## Использованные Seeds

| Seed | Source | Что взято | Адаптация | Что отброшено |
| --- | --- | --- | --- | --- |
| <seed> | <library/path> | <slice/protected behavior workflow> | <project refactor plan> | <broad rewrite ideas> |

## Карта Контекста Проекта

- Refactor slices: <slice IDs>.
- Protected flows: <flows>.
- High-risk modules: <paths>.
- Checks: <commands/smoke>.

## Проектные Привязки

- <slice ID>: <paths и protected behavior>.
- <preferred migration pattern>.
- <callers/consumers to inspect>.

## Локальные Антипаттерны И Риски

| Risk | Refactor slice | Evidence | Guardrail |
| --- | --- | --- | --- |
| <RISK_ID> | <slice> | <path> | <check/limit> |

## Порядок работы

1. Привяжи refactor к risk/refactor ID.
2. Определи protected behavior и проверку до изменения.
3. Разбей работу на один маленький slice.
4. Прочитай callers/consumers affected boundary.
5. Внеси structural change без feature drift.
6. Запусти проверки или manual smoke.
7. Обнови RAG/refactor/risk docs, если boundary изменился.

## Проверки По Слою

- UI: visual/state smoke.
- API/data: contract compatibility.
- Shared helper/component: callers/consumers.
- Testing: regression или documented gap.

## Контрольные gates

- Один refactor slice за раз.
- Нет broad rewrite без отдельного plan.
- Нет behavior change без явного описания.
- Нет удаления “мертвого” кода без evidence.

## Условия остановки

- Protected behavior неясен.
- Blast radius нельзя оценить.
- Проверки заблокированы, а slice high-risk.
- Refactor требует product/domain decision.

## Формат результата

```markdown
Refactor:
- Slice:
- Protected behavior:
- Измененные boundaries:
- Проверки:
- Docs/RAG updates:
- Остаточные risks/gaps:
```
