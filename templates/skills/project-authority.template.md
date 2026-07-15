---
name: project-authority
description: Определяет источники истины, RAG-маршрут и локальные правила проекта. Используй в начале разработки, исследования, ревью, отладки, рефакторинга и enterprise-задач до выбора source scope.
---

# Авторитет Проекта

## Порядок работы

1. Прочитай `docs/agent-system/knowledge-index.md`.
2. Открой только документы и source areas, указанные для текущего типа задачи.
3. Проверь `docs/agent-system/existing-rules-merge.md` и `docs/agent-system/authority-map.json`, если он существует.
4. Используй `docs/agent-system/project-model.json` для capabilities, modules и entry points.
5. Для high-risk области прочитай `risk-register.md`, `refactor-plan.md` и соответствующий smoke route.
6. Если fingerprint модели устарел, выполни targeted discovery и обнови затронутую часть RAG.

## Источники Истины

- Existing project rules имеют authority согласно merge-анализу.
- `project-model.json` хранит структурированную topology/capability модель.
- `knowledge-index.md` выбирает retrieval route.
- Исходный код и результаты команд подтверждают текущее поведение.
- Research findings без evidence считаются гипотезами.

## Формат результата

```markdown
Контекст задачи:
- Режим:
- Authority:
- Прочитанные RAG-документы:
- Source scope:
- Риски и проверки:
- Gaps:
```
