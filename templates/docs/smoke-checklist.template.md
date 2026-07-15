# Smoke Checklist

## Static Checks

- Typecheck:
- Lint:
- Unit tests:
- Build:

## Runtime Checks

| Flow | Setup | Action | Expected UI/API result | Evidence |
|---|---|---|---|---|

## Browser/UI Checks

Используй только если в проекте есть user-facing UI.

- page открывается успешно;
- loading, empty, error, success states работают корректно;
- нет visible layout break на expected breakpoints;
- keyboard/focus basics работают для измененных controls.

## Backend/API Checks

Используй только если в проекте есть backend/API behavior.

- endpoint/status/payload verified;
- error path verified или marked as gap;
- persistence/reload/refetch verified where relevant;
- не появился request flood/retry storm.
