# Запуск Toolkit

Скопируй папку `reusable-agent-system-toolkit/` в корень целевого проекта. Затем открой Codex именно в корне этого проекта и отправь команду:

```text
Ты находишься в корне целевого проекта.
Не ищи toolkit в ~/.codex, plugins, node_modules, соседних проектах или родительских workspace-папках.
Открой и выполни локальную инструкцию:
./reusable-agent-system-toolkit/skills/project-agent-bootstrap/SKILL.md

Если этого файла нет в текущем проекте, остановись и скажи, что reusable-agent-system-toolkit не найден в project root.
Не создавай .codex/skills, codex-skills, docs/agent-system или "ближайший эквивалент" без локального bootstrap SKILL.md.
```

Первое корректное действие агента после этой команды: прочитать `./reusable-agent-system-toolkit/skills/project-agent-bootstrap/SKILL.md` из текущего проекта.

Некорректное поведение:

- искать `$project-agent-bootstrap` через tool/plugin search;
- искать toolkit в `~/.codex`;
- брать toolkit из соседнего проекта;
- брать `node_modules/reusable-agent-system-toolkit`;
- создавать fallback `.codex/skills` или `codex-skills`, если локальный bootstrap файл не найден.
