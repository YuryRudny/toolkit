---
name: stack-quality
description: Выбирает проверенный stack-specific playbook из реестра проекта. Используй перед изменением кода, чтобы применить правила затронутого слоя и существующую project authority.
---

# Правила Затронутого Слоя

## Порядок работы

1. Прочитай `docs/agent-system/skill-registry.json` и `docs/agent-system/authority-map.json`.
2. По `docs/agent-system/project-model.json` определи capabilities и владельца затронутого модуля.
3. Через `docs/agent-system/knowledge-index.md` найди source, contracts, риски и команды проверки.
4. Загрузи только активные skills соответствующей категории из registry: frontend, backend-data, testing, security-performance или mobile.
5. Если существующий локальный skill имеет authority, следуй merge decision; не подменяй его generated playbook.
6. Применяй проверки выбранного слоя в рамках запроса пользователя. Недоступные проверки укажи как gap.

## Условия остановки

- В реестре нет активного skill для применимого слоя.
- Project model или research evidence устарели.
- Правила конфликтуют и merge decision отсутствует.
- Изменение публичного контракта невозможно проверить по consumers.

## Формат результата

- Затронутый слой и source paths.
- Выбранные skills и authority.
- Применимые проверки и их фактические результаты.
- Ограничения и необходимые дальнейшие действия.
