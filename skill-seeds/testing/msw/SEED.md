# Seed: MSW Testing

## Назначение

Используй только если проект использует MSW или планирует API mocking test harness.

## Правила Setup

- Node tests use `msw/node`.
- Server lifecycle hooks reset handlers after each test.
- Unhandled requests policy is explicit.
- Handlers grouped by domain.
- Happy path handlers are baseline; error cases are scenario overrides.

## Правила Handler-ов

- Use absolute URLs when runtime clients require them.
- Parse request bodies explicitly.
- Order handlers from specific to general.
- Extract shared response logic.
- Use one-time handlers for sequential scenarios.

## Правила Тестов

- Test user-visible behavior, not implementation request counts unless request count is the behavior.
- Reset handlers and clear request caches.
- Avoid flaky fake timers unless queueMicrotask/fetch behavior is controlled.
- Mock auth/cookies/upload/error responses deliberately.

## Обязательная Адаптация Под Проект

При генерации добавь:

- test runner;
- source setup files;
- API client base URL;
- critical flows needing mocks;
- current gaps if no test harness exists.
