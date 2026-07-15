# Seed: NestJS Backend Engineering

## Назначение

Используй только если research подтвердил NestJS.

## Категории Правил

### Архитектура

- Feature modules over technical-layer dumping.
- Avoid circular module dependencies.
- Focused services instead of god services.
- Repository/data access boundary is explicit.
- Events/queues used for decoupling when useful.

### Dependency Injection

- Constructor injection by default.
- No service locator anti-pattern.
- Scope awareness: singleton/request/transient.
- Injection tokens for interfaces and replaceable providers.

### API И Validation

- DTOs with pipes for input validation.
- Serialization/interceptors for output contracts.
- Versioning strategy for breaking changes.
- Error contracts consistent and safe.

### Security

- Guards for auth/authz.
- Validate all input at boundaries.
- Sanitize output where user-controlled data can render.
- Rate limiting for exposed endpoints.
- JWT/session handling avoids leaking secrets.

### Database/Transactions

- Transactions around multi-step writes.
- Avoid N+1.
- Migrations for schema changes.
- Repository/usecase boundaries protect domain logic.

### Observability

- Structured logs without secrets.
- Health checks for deploy/runtime.
- Graceful shutdown for queues/connections.

## Обязательная Адаптация Под Проект

При генерации добавь:

- module map;
- controllers/services/repositories;
- auth guards;
- DB/ORM/migration stack;
- queue/microservice use;
- test commands and missing coverage.
