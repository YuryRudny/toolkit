---
name: research-audit
description: Глубокий evidence-based аудит проекта или модуля. Используй на trigger "ресерч", "research", "глубокий анализ", "найди слабые места" и при bootstrap research.
---

# Research-Аудит

## Обзор

Глубокий аудит без изменений кода по умолчанию. Область по умолчанию при trigger `ресерч` = весь проект.

## Обязательные Чтения

- `docs/agent-system/knowledge-base.md`
- `docs/agent-system/knowledge-index.md`
- `docs/agent-system/project-map.md`
- `docs/agent-system/risk-register.md`
- `docs/agent-system/refactor-plan.md`
- `docs/agent-system/stack-profile.md`
- `docs/agent-system/research-evidence-pack.md`, если файл существует
- `codex-skills/references/code-review-and-quality-playbook.md`, если research связан с quality review
- `codex-skills/references/security-performance-review-playbook.md`, если research связан с security/performance
- stack/domain references по область.

## Порядок работы

1. Зафиксируй область. Если область не указан, бери весь проект.
2. Выполни research passes:
   - inventory проекта;
   - hot spots и радиус влияния;
   - трассировка критических потоков;
   - ревью контрактов и границ;
   - охота на дефекты;
   - ревью использования зависимостей;
   - ревью tests/CI;
   - пакет findings для docs.
3. Выполни layer classification: какие слои проекта применимы, не применимы или неясны.
4. Выполни охота на дефекты по применимым слоям: correctness/domain logic, architecture/ownership, data/API/contracts, security/privacy, performance/resource leaks, type/runtime safety, testing/CI/observability, dependencies/supply chain.
5. Проверь audit areas: architecture, domain logic, data/API contracts, async/race, type/runtime safety, UI/accessibility, security/privacy, performance/resource leaks, testing/observability, process risks.
6. Сформируй пакет привязок для skills: проектные привязки, локальные антипаттерны, подсказки поиска source, команды/проверки и связи risk/refactor.
7. Запиши подтвержденные находки отдельно от гипотезы/gaps.
8. Обнови research evidence pack, если research меняет coverage, layer classification, охота на дефекты или gaps.
9. Обнови knowledge base/index, если research меняет project map, risks, commands, flows, skill hooks или gaps.
10. Обнови docs, если это bootstrap или docs отсутствуют/устарели.
11. Заверши findings first.

## Контрольные gates

- Каждый finding имеет evidence.
- Нет изменений кода без explicit user request.
- Stack summary не является результатом.
- Layer classification и охота на дефекты обязательны для full-project research.
- Security/performance/resource review не может быть generic текстом без evidence.
- Research не может считаться глубоким без трассировка критических потоков, ревью использования зависимостей и пакет привязок для skills.
- Недоступная проверка записан как gap.

## Формат результата

```markdown
## Находки
- [Severity] Title
  Подтверждение:
  Влияние:
  Предложенное исправление:

## Классификация Слоев
-

## Охоты На Дефекты
-

## Привязки Для Skills
-

## Обновленные Docs
-

## Пробелы
-

## Следующие Шаги
-
```
