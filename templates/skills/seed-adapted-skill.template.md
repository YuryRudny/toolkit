---
name: <skill-name>
description: <когда использовать этот project-local skill; укажи stack/domain/task triggers>
---

# <Skill Title>

## Обзор

<1-3 предложения: какую работу делает skill и какую планку качества задает для этого проекта.>

## Когда использовать

- <trigger по задаче, слою, файлам, Jira/issue type или mode>

## Не использовать когда

- <границы ответственности; куда route вместо этого skill>

## Обязательные Чтения

- `docs/agent-system/knowledge-base.md`
- `docs/agent-system/knowledge-index.md`
- <skill-specific reference из `codex-skills/references/*`>
- <scoped project docs/RAG sections>

## Быстрый Маршрут По RAG

- <какой doc читать первым для этого слоя>
- <как найти source area через knowledge-index/project-map>
- <какие risk/refactor IDs всегда проверить>

## Использованные Seeds

| Seed | Source | Почему выбран | Что адаптировано | Что отброшено |
| --- | --- | --- | --- | --- |
| <seed id> | <library/path> | <dependency/path/RAG evidence> | <seed ideas -> project instructions> | <неприменимое и почему> |

Если полная `Seed Adaptation Matrix` сохранена в docs/bootstrap summary, укажи ссылку на нее.

## Карта Контекста Проекта

- Source areas: <real paths/files/modules>
- Critical flows: <flows from project map/research report>
- Commands/checks: <real commands>
- Existing authority: <local rules/skills that govern this area>

## Проектные Привязки

- <local pattern to preserve with path/evidence>
- <local boundary/contract to respect>
- <project-specific example of good implementation if known>

## Локальные Антипаттерны И Риски

- <risk/refactor id>: <bad pattern or fragile area and what to do in touched scope>
- Gap: <known missing evidence, if any>

## Планка Качества

- <production-ready criterion for this layer>
- <security/performance/testing/accessibility/data criteria as applicable>

## Порядок работы

1. <collect scoped context through RAG and source>
2. <inspect touched area and affected contracts>
3. <apply seed-derived senior workflow adapted to this project>
4. <fix obvious unsafe/fragile code in scope or record risk/refactor gap>
5. <run/check/record verification>

## Проверки По Слою

- <layer-specific check>
- <blast-radius check>
- <regression/smoke check>

## Контрольные gates

- <pre-change gate>
- <final review gate>

## Условия остановки

- <blocker condition with evidence required>

## Формат результата

```markdown
<Название skill>:
- Context/RAG:
- Seeds:
- Project hooks:
- Изменения:
- Проверки:
- Risks/refactor gaps:
- Blockers:
```
