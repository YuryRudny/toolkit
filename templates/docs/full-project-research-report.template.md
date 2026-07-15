# Полный Research Отчет По Проекту

Инструкция генерации: этот файл должен быть полноценным инженерным отчетом, а не коротким summary. Не удаляй секции шаблона. Если секция не применима, запиши `не применимо` и evidence. Для каждого confirmed finding используй concrete path/function/component/config/command evidence. Сохраняй подробность, достаточную для разработчика и будущего агента без повторного full discovery.

## Краткое Резюме

- Что это за проект:
- Главные технические риски:
- Главные бизнес/пользовательские риски:
- Уровень confidence:
- Что обязательно проверить следующим:

## Стек И Runtime

| Область | Значение | Evidence | Комментарий |
|---|---|---|---|

## Обзор Архитектуры

- Точки входа:
- Основные modules/domains:
- Границы ownership:
- Shared/high-blast-radius зоны:
- Архитектурные smells:

## Module Inventory И Hot Spots

| Module/area | Path patterns | Responsibility | Hot spot/risk signal | Что читать глубже |
|---|---|---|---|---|

## Классификация Слоев

| Слой | Статус | Evidence | Почему важно |
|---|---|---|---|

## Матрица Охоты На Дефекты

| Слой | Defect class | Результат | Evidence | Finding/risk IDs |
|---|---|---|---|---|

## Обзор Потоков Данных

| Поток | Trace chain | Contract/runtime safety | Error/auth/cache behavior | Риски | Evidence |
|---|---|---|---|---|---|

## Boundary И Contract Review

| Boundary | Evidence | Current behavior | Fragile pattern/gap | Recommendation |
|---|---|---|---|---|

## Обзор Зависимостей И Библиотек

| Package/library | Version/source | Runtime/dev/build | Где используется | Usage evidence | Риск/стоимость | Возможная замена | Следующий шаг |
|---|---|---|---|---|---|---|---|

## Dependency Audit Freshness

- Manifest/lockfile проверены:
- Usage search выполнен:
- Ecosystem audit выполнен:
- Если audit не выполнен, причина:
- Security advisory freshness:
- Heavy/rare dependency candidates:
- Unused/redundant candidates:

## Карта Тяжелых Или Редко Используемых Библиотек

| Package | Почему подозрительно | Usage count/evidence | Bundle/runtime/security cost | Решение |
|---|---|---|---|---|

## Обзор Безопасности

| Область | Finding/gap | Severity | Evidence | Recommendation |
|---|---|---|---|---|

## Обзор Производительности

| Область | Finding/gap | Impact | Evidence | Recommendation |
|---|---|---|---|---|

## Обзор Утечек Ресурсов

| Resource class | Finding/gap | Impact | Evidence | Recommendation |
|---|---|---|---|---|

## Обзор Тестирования И CI

| Область проверки | Текущее состояние | Недостающее покрытие | Риск | Recommendation |
|---|---|---|---|---|

## Подтвержденные Findings

| ID | Severity | Finding | Evidence | Trigger/condition | Impact | Recommendation | Required checks |
|---|---|---|---|---|---|---|---|

## Гипотезы И Gaps

| Gap/hypothesis | Почему не закрыто | Нужное evidence | Priority |
|---|---|---|---|

## Рекомендации По Рефакторингу

| Recommendation | Связанные риски | Примеры files/patterns | Suggested slice | Checks | Критерий успеха |
|---|---|---|---|---|---|

## Следующий План

- 30 days:
- 60 days:
- 90 days:
