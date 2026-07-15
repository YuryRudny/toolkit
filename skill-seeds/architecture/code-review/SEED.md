# Seed: Code Review И Качество

## Назначение

Используй как базу для `code-review-and-quality` и `code-review-playbook.md`.

Seed дает senior review lens. При bootstrap его нельзя копировать как есть: добавь проектные flows, risk IDs, команды, known bad patterns и existing local rules из RAG.

## Направления Ревью

### Корректность

- Требование выполнено полностью, включая negative/edge cases.
- Ошибки и пустые состояния обработаны явно.
- Нет race conditions, stale state, duplicate side effects, off-by-one.
- Поведение проверено тестом, smoke или documented gap.

### Архитектура

- Изменение сохраняет ownership boundaries.
- Shared utilities/components/services не получают domain-specific side effects.
- Нет циклических зависимостей и скрытого coupling.
- Новый abstraction оправдан реальными consumers, а не желанием обобщить заранее.

### Безопасность

- External/user-controlled data считается недоверенным.
- Auth/authz authority находится на правильной стороне boundary.
- Нет secret leaks в code, logs, docs, errors.
- Проверены XSS/injection/path traversal/file upload/SSRF risks, если применимо.

### Производительность И Ресурсы

- Нет N+1, request floods, retry storms, unbounded loops.
- Горячие paths не получают тяжелую dependency или лишний render/effect loop.
- Timers/listeners/subscriptions/sockets/streams имеют cleanup.
- Cache keys, invalidation и tenant/user/request scope проверены.

### Тесты И Observability

- Проверки соответствуют blast radius.
- Bug fix имеет regression protection или documented reason why not.
- Critical flows имеют smoke/e2e/manual verification path.
- Logs/metrics/debug information помогают расследовать сбои без sensitive data.

## Политика Severity

| Severity | Когда ставить | Действие |
|---|---|---|
| Critical | security/data loss/outage/broken core behavior | блокировать |
| Important | реальный риск регрессии, architecture drift, missing critical check | исправить до merge |
| Suggestion | maintainability improvement с понятной пользой | можно обсудить |
| Nit | мелочь вне formatter/linter | писать только если полезно |

## Обязательная Адаптация Под Проект

При генерации добавь:

- critical flows проекта;
- high-blast-radius files;
- risk/refactor IDs;
- команды проверки;
- stack-specific checks;
- локальные хорошие patterns;
- локальные плохие patterns, которые нельзя копировать.
