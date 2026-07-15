# Backend Engineering

Используй этот reference только если в целевом проекте есть backend, API, workers или server-side behavior.

## Цель

Сгенерировать backend standards, которые защищают correctness, data integrity, security, observability и operational behavior.

Если агент меняет backend/API/workers рядом с очевидно небезопасным или хрупким кодом, он не должен молча продолжать тот же pattern. Локальную validation/auth/transaction/idempotency защиту нужно добавить в scope, если это безопасно; широкий redesign фиксируется как risk/refactor slice.

## Архитектура

- Держать transport/controllers тонкими.
- Держать domain rules в services/domain modules.
- Держать persistence details за repositories/ORM boundaries, если проект использует такой style.
- Не смешивать DTO/request/response/domain/database models без осознанного pattern.
- Избегать hidden cross-module side effects.
- Если controller/service уже смешивает transport, domain logic и persistence, не добавлять туда новую ответственность без явного reason; локально выделить boundary или записать refactor gap.

## API Contracts

- Валидировать input на boundaries.
- Возвращать stable response shapes.
- Version or migrate breaking contract changes.
- Документировать error responses.
- Сохранять backward compatibility, если clients зависят от API.
- Не парсить external/client data по labels/order/magic positions без explicit legacy adapter.

## Data Integrity

- Использовать transactions для multi-step writes, которые должны быть atomic.
- Добавлять constraints/indexes для invariants, где это поддерживается.
- Делать migrations reversible или документировать почему нет.
- Обрабатывать idempotency для retries, webhooks, jobs и payment/order-like flows.
- Если multi-step write уже существует без transaction, новая правка не должна увеличивать partial-success risk.

## Async, Jobs And Concurrency

- Проектировать retries с backoff и limits.
- Избегать duplicate side effects.
- Использовать locks/idempotency keys/unique constraints там, где возможны races.
- Делать queue workers safe to rerun.

## Безопасность

- Не доверять client-side authorization.
- Проверять permissions рядом с action и data access.
- Sanitize/escape user-controlled output.
- Не хранить secrets в code, docs, logs и generated files.
- Не leak sensitive data в errors и telemetry.

## Observability

- Логировать важные state transitions с safe identifiers.
- Добавлять metrics/tracing для critical paths, если project tooling это поддерживает.
- Сохранять enough context для debugging без раскрытия secrets.

## Тестирование

- Unit test domain logic.
- Integration test API boundaries и persistence contracts.
- Добавлять regression tests для high-risk bug fixes.
- Тестировать authorization и error paths для critical actions.

## Review checklist

- Boundaries понятны?
- Input валидируется?
- Data write behavior atomic/idempotent там, где нужно?
- Permission checks server-side?
- Errors полезные и безопасные?
- Tests соответствуют blast radius?
- Touched code не усиливает unsafe local pattern?
