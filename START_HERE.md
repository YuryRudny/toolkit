# Запуск Toolkit

## Sidecar workspace

Если RAG/skills должны жить отдельно от customer code, создай внутренний artifact repository с `workspace.json`, клонируй toolkit соседней папкой и запускай bootstrap из artifact root:

```text
Открой workspace.json и toolkit path из него.
Выполни project-agent-bootstrap/SKILL.md в sidecar-workspace режиме.
Customer repositories используй только для чтения.
Все RAG/docs/skills/runtime записывай только в текущий artifact repository.
До research создай source snapshot, после генерации выполни workspace verify и commit plan.
```

Для ежедневной работы разработчик один раз выполняет `node bsg-agent-system/bin/agentctl.js install`, затем `node bsg-agent-system/bin/agentctl.js integrations configure /path/to/.env`, а в начале сессии — `node bsg-agent-system/bin/agentctl.js sync`. Код тянется по SSH, enterprise context — через локальный read-only MCP с токенами только из env пользователя.

## Project-local repository

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

Некорректное поведение в project-local режиме:

- искать `$project-agent-bootstrap` через tool/plugin search;
- искать toolkit в `~/.codex`;
- брать toolkit из соседнего проекта без sidecar `workspace.json`;
- брать `node_modules/reusable-agent-system-toolkit`;
- создавать fallback `.codex/skills` или `codex-skills`, если локальный bootstrap файл не найден.
