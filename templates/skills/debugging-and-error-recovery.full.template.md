---
name: debugging-and-error-recovery
description: Ведет отладку до root cause в этом проекте. Используй при failing commands, runtime/build bugs, flaky UI/API behavior и неожиданных регрессиях.
---

# Отладка И Восстановление

## Обзор

При ошибке останови feature work и веди расследование по evidence: симптом, воспроизведение, слой, root cause, исправление, regression protection. Не лечи симптом, пока не понятна причина.

## Когда использовать

- Команда, тест, сборка или CI падают.
- Runtime bug воспроизводится или подозревается.
- Есть flaky behavior, stale state, race, cache issue.
- После fix нужно подтвердить root cause.

## Не использовать когда

- Пользователь просит обычную разработку без ошибки.
- Нужно провести широкий research проекта.
- Нет симптома и нет способа собрать evidence.

## Обязательные Чтения

- `docs/agent-system/knowledge-base.md`
- `docs/agent-system/knowledge-index.md`
- `docs/agent-system/current-state.md`
- `docs/agent-system/risk-register.md`
- `codex-skills/references/debugging-playbook.md`
- Routed stack/domain skill.

## Быстрый Маршрут По RAG

- Command/build failure: <commands/current-state route>.
- UI/runtime bug: <UI/state route>.
- API/server bug: <API route>.
- Flaky/performance: <performance/resource route>.

## Использованные Seeds

| Seed | Source | Что взято | Адаптация | Что отброшено |
| --- | --- | --- | --- | --- |
| <seed> | <library/path> | <repro/root-cause workflow> | <local failure modes/checks> | <not applicable commands> |

## Карта Контекста Проекта

- Failure-prone flows: <flows>.
- Commands/checks: <commands>.
- Logs/observability: <where to look>.
- External systems: <systems>.

## Проектные Привязки

- <local failure mode with path/evidence>.
- <common error shape>.
- <debug retrieval hint>.

## Локальные Антипаттерны И Риски

| Risk | Failure mode | Evidence | Debug action |
| --- | --- | --- | --- |
| <RISK_ID> | <mode> | <path/command> | <action> |

## Порядок работы

1. Останови feature work.
2. Зафиксируй точный симптом: command, route, role, input, environment, log.
3. Воспроизведи или запиши, почему воспроизведение заблокировано.
4. Локализуй слой: UI/state/API/server/data/build/CI/external.
5. Сузь failing case до минимального сценария.
6. Найди root cause через source/RAG, а не через догадку.
7. Исправь причину, не симптом.
8. Добавь regression protection: test, smoke, guard или documented gap.
9. Удали временную диагностику.

## Проверки По Слою

- UI: route/role/state reproduction, cleanup, stale responses.
- API/server: request/response, auth, error contract, timeout/cache.
- Build/tooling: package manager, lockfile, scripts, env.
- External: status, timeout, degraded behavior.

## Контрольные gates

- Не скрывай ошибку empty catch/retry без evidence.
- Не объявляй fix без воспроизведения или reason why not.
- Не добавляй broad refactor во время incident fix.
- Не оставляй temporary logs/debug code.

## Условия остановки

- Нельзя собрать симптом без user/external input.
- Ошибка зависит от недоступного external system.
- Исправление требует scope/security decision.
- Проверки заблокированы, а риск высокий.

## Формат результата

```markdown
Отладка:
- Симптом:
- Воспроизведение:
- Локализованный слой:
- Первопричина:
- Исправление:
- Regression protection:
- Проверки:
- Остаточные gaps/blockers:
```
