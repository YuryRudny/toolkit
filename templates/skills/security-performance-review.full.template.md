---
name: security-performance-review
description: Проверяет security, privacy, performance и resource lifecycle. Используй для trust boundaries, auth, unsafe rendering, dependencies, caches, hot paths и resource cleanup.
---

# Security And Performance Review

## Обзор

Проверяй trust boundaries и hot paths до merge. Security/performance claims принимаются только с evidence или explicit gap.

## Когда использовать

- Изменяется auth, permissions, sensitive data, rendering, dependencies.
- Изменяется cache, concurrency, external calls, heavy UI/backend path.
- Есть listeners/timers/subscriptions/resources.

## Не использовать когда

- Изменение не затрагивает security/performance surface.
- Нужен общий code review без специальных рисков.

## Обязательные Чтения

- `docs/agent-system/knowledge-base.md`
- `docs/agent-system/risk-register.md`
- `docs/agent-system/research-evidence-pack.md`
- `codex-skills/references/security-performance-playbook.md`

## Быстрый Маршрут По RAG

- Security/privacy: <security route>.
- Dependency: <dependency route>.
- Performance/resource: <performance route>.
- External/cache: <cache/integration route>.

## Использованные Seeds

| Seed | Source | Что взято | Адаптация | Что отброшено |
| --- | --- | --- | --- | --- |
| <seed> | <library/path> | <security/performance checks> | <project risks/hot paths> | <not applicable controls> |

## Карта Контекста Проекта

- Trust boundaries: <boundaries>.
- Sensitive surfaces: <paths>.
- Hot paths/caches: <paths>.
- Dependencies to watch: <packages>.

## Проектные Привязки

- <security-sensitive path>.
- <performance/resource path>.
- <dependency или external system>.

## Локальные Антипаттерны И Риски

| Risk | Area | Evidence | Required check |
| --- | --- | --- | --- |
| <RISK_ID> | <area> | <path> | <check> |

## Порядок работы

1. Определи затронутые trust boundaries и hot paths через RAG/source, затем зафиксируй их в результате.
2. Проверить input/output trust, auth/authz, secrets/logging/errors.
3. Проверить unbounded work, cache behavior, resource cleanup, dependency impact.
4. Исправить локальный unsafe code в scope или записать risk/refactor gap.
5. Подтвердить checks/smoke или explicit blocker.

## Проверки По Слою

- Secrets и logging.
- Permission/data exposure.
- Unsafe rendering/injection.
- External call timeout/degraded behavior.
- Cache/concurrency.
- Listeners/timers/subscriptions cleanup.
- Dependency supply chain.

## Контрольные gates

- Нет нового unsafe rendering без trust decision.
- Нет secret/PII leakage.
- Нет unbounded loops/requests/retries.
- Нет resource subscription без cleanup.
- Нет heavy dependency без evidence.

## Условия остановки

- Security boundary unclear.
- Sensitive data flow cannot be verified.
- Performance risk высокий, и проверка невозможна.
- Dependency risk неизвестен и не может быть оценен.

## Формат результата

```markdown
Security/performance:
- Trust boundaries:
- Hot paths/resources:
- Findings:
- Fixes/gaps:
- Проверки:
- Blockers:
```
