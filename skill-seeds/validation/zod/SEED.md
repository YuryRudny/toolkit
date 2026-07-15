# Seed: Zod Validation

## Назначение

Используй только если project dependencies подтверждают `zod` или команда явно выбирает Zod для runtime validation.

## Правила Validation

- Validate external/user-controlled data at system boundaries.
- Use `unknown` over `any` for untrusted data.
- Use `safeParse` for user/API input where errors are expected.
- Use `parseAsync` when refinements are async.
- Handle all validation issues, not only the first.
- Distinguish optional, nullable and nullish semantics deliberately.
- Export schemas and inferred types together.
- Use branded types for domain IDs when confusion is costly.
- Cache schemas; do not recreate heavy schemas in hot paths.

## Обработка Ошибок

- Preserve field paths for nested errors.
- Provide user-safe messages.
- Do not throw inside refine unless aborting validation is intentional.
- Separate internal validation logs from user-facing errors.

## Обязательная Адаптация Под Проект

При генерации добавь:

- external boundaries needing validation;
- DTO/domain/UI model mapping;
- package/bundle constraints;
- error i18n requirements;
- candidate files for first schema slice.
