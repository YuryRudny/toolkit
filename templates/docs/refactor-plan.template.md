# План Рефакторинга

## Контекст

Опиши проект/домен, почему рефакторинг нужен и какие flows имеют самый высокий риск.

## Верхнеуровневая Оценка

- Что в проекте работает нормально:
- Что выросло быстрее архитектуры:
- Главный архитектурный smell:
- Главный data-flow risk:
- Главный testing/delivery risk:

## Главные Риски

| ID | Severity | Risk | Evidence | Почему опасно | Что делать |
|---|---|---|---|---|---|

## Принципы Рефакторинга

- Не начинать с cosmetic cleanup.
- Сначала стабилизировать data flow, contracts и boundaries.
- Работать маленькими slices.
- Не смешивать behavior change, broad cleanup и migration.
- Перед high-risk изменением собрать smoke/test evidence или записать blocker.
- Новый код не должен копировать unsafe legacy patterns.

## Поэтапный План

### Этап 1: Discovery И Safety Net

Цель:

- 

Ожидаемые результаты:

- 

Проверки:

- 

### Этап 2: Architecture/Data Flow Boundaries

Цель:

- 

Ожидаемые результаты:

- 

Проверки:

- 

### Этап 3: Contract/Security/Runtime Safety

Цель:

- 

Ожидаемые результаты:

- 

Проверки:

- 

### Этап 4: Decomposition И Cleanup

Цель:

- 

Ожидаемые результаты:

- 

Проверки:

- 

## Slices

| Slice | Scope | Связанные риски | Evidence/examples | Required checks | Status |
|---|---|---|---|---|---|

## Примеры Явных Проблем

| Pattern/file | Почему проблема | Risk | Suggested fix |
|---|---|---|---|

## Критерии Успеха

- 

## Рекомендуемая Стартовая Точка

Опиши первый самый полезный и безопасный slice.

## Условия Остановки

- Scope неясен.
- Required evidence отсутствует.
- Shared behavior impact не mapped.
- Backend/API/security/runtime evidence нужно, но недоступно.
- Tests или runtime checks нельзя запустить, и gap неприемлем.
