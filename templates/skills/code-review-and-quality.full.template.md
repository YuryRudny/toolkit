---
name: code-review-and-quality
description: Проводит многомерное senior-ревью кода в этом проекте. Используй перед merge, после реализации, при проверке кода агента/человека и при оценке refactor slices.
---

# Ревью Кода И Качество

## Обзор

Проверяй изменение как senior engineer: сначала требование и affected flow, затем корректность, архитектуру, безопасность, производительность, тестируемость и локальные риски проекта. Не превращай ревью в список вкусовых замечаний.

Код можно одобрить только если он решает задачу, не ломает critical flows, не усиливает известные антипаттерны и имеет достаточное evidence проверки.

## Когда использовать

- Перед merge/push/PR/MR.
- После реализации задачи или bug fix.
- При проверке кода, написанного агентом или человеком.
- При оценке refactor slice.
- Когда touched area пересекается с risk/refactor item.

## Не использовать когда

- Нет scope/diff/требования и его нельзя восстановить из RAG/source.
- Пользователь просит только статус без ревью.
- Нужно сначала провести research всего проекта.

## Обязательные Чтения

- `docs/agent-system/knowledge-base.md`
- `docs/agent-system/knowledge-index.md`
- `docs/agent-system/risk-register.md`
- `docs/agent-system/current-state.md`
- `docs/agent-system/seed-selection.md`
- `codex-skills/references/code-review-playbook.md`
- Routed stack/domain skill для затронутого слоя.

## Быстрый Маршрут По RAG

- Feature/bug: <task row from knowledge-index>.
- UI: <UI RAG route>.
- Backend/API/data: <backend/API RAG route>.
- Security/performance/dependency: <risk RAG route>.
- Unknown scope: `knowledge-index.md` -> affected source -> routed stack skill.

## Использованные Seeds

| Seed | Source | Что взято | Что адаптировано под проект | Что отброшено |
| --- | --- | --- | --- | --- |
| <seed> | <library/path> | <review structure/severity/checks> | <project risks/flows/checks> | <not applicable parts> |

## Карта Контекста Проекта

- Основные source roots: <paths>.
- Critical flows: <flows>.
- High-blast-radius files/modules: <paths>.
- Проверки: <commands/smoke>.
- Existing authority: <rules/skills>.

## Проектные Привязки

- <local good pattern with path>.
- <local boundary/contract to preserve>.
- <source retrieval hint>.

## Локальные Антипаттерны И Риски

| Risk | Evidence | Почему важно | Что делает reviewer |
| --- | --- | --- | --- |
| <RISK_ID> | <path/flow> | <impact> | <review action> |

## Планка Качества

- Требование выполнено полностью, включая edge/error/permission states.
- Изменение сохраняет архитектурные boundaries.
- Unsafe/fragile code в touched area исправлен или вынесен в risk/refactor gap.
- Security/data exposure не ухудшены.
- Performance hot paths не получили лишних loops/requests/listeners.
- Проверка соответствует blast radius.

## Порядок работы

1. Восстанови требование: Jira/spec/user request/source behavior.
2. Определи scope diff и affected flows.
3. Прочитай RAG по маршруту и routed stack/domain skill.
4. Сначала проверь tests/checks/smoke evidence.
5. Проверь код по направлениям: корректность, читаемость, архитектура, безопасность, производительность, тестируемость.
6. Сверь изменение с local patterns и risk/refactor docs.
7. Классифицируй замечания по severity.
8. Для unsafe/fragile code в touched area выбери действие: исправить, записать risk/refactor gap или остановиться с blocker.
9. Сформируй findings-first результат.

## Проверки По Слою

- UI: states, accessibility, responsive, browser/client guards.
- State/data/API: stale response, DTO/contract drift, error shape, loading/error state.
- Backend/API: validation, auth/authz, idempotency, safe errors, observability.
- Security/privacy: trust boundaries, secrets, unsafe rendering, permission/data exposure.
- Performance/resource: hot paths, cache, listeners/timers/subscriptions cleanup.
- Testing/CI: automated tests или documented smoke/gap.

## Severity Protocol

| Severity | Когда использовать | Действие |
| --- | --- | --- |
| Critical | Security/data loss/broken critical flow | Блокировать |
| Important | Реальная регрессия, missing critical check, architecture drift | Исправить до merge |
| Suggestion | Улучшение maintainability без явного риска | Можно обсудить |
| Nit | Мелочь вне formatter/linter | Не шуметь без пользы |

## Контрольные gates

- Не ставь `LGTM` без evidence.
- Не комментируй стиль, который должен ловить formatter/linter.
- Не требуй broad rewrite вне scope.
- Не игнорируй known risks из `risk-register.md`.
- Не принимай security/data/correctness gap как “потом”.

## Условия остановки

- Невозможно понять expected behavior.
- Нет доступа к critical contract/spec/source evidence.
- High-risk change нельзя проверить automated или smoke evidence.
- Обнаружен Critical blocker.

## Формат результата

```markdown
Ревью кода:
- Scope:
- Evidence:
- Проверенные flows/files:
- Findings:
  - [Critical/Important/Suggestion/Nit] ...
- Проверки:
- Risk/refactor updates:
- Вердикт:
```
