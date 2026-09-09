---
name: agent-system-update
description: Запускает full или incremental обновление skills/RAG с сохранением MCP, основной идеи и выбранного Git/local хранения. Используй для обновления toolkit или переноса агентских материалов, не для обычных package updates.
---

# Обновление Агентской Системы

1. Прочитай `codex-skills/references/update-modes.md`. Если режим ещё не выбран явно, спроси Full или бережный incremental, предупредив о deep scan затратах Full. В обоих режимах MCP-серверы и их настройки сохраняются. Не принимай слово «update» за разрешение на reset.
2. Разреши toolkit только через локальную папку `reusable-agent-system-toolkit`, явные path/remote в `workspace.json` или toolkit.path в local `agent-storage.json`. Открой его `skills/project-agent-update/SKILL.md`. Если файла нет, попроси явно предоставить новую локальную копию; не запускай старый bootstrap вместо update и не ищи замену за пределами заданного workspace.
3. До research и любых update-записей проверь разделение. Если наши skills/RAG в customer Git и назначения нет, спроси: отдельный Git-репозиторий или локально у пользователя без коммитов/push. Для Git получи URL/checkout; для local прочитай `codex-skills/references/local-agent-storage.md`, подготовь отдельную папку, `.gitignore` и publication=never. Перенос допустим только после проверки назначения и плана; клиентские правила и source code не забирай.
4. Для incremental читай `codex-skills/references/incremental-update.md`: только критичные ошибки и необходимые обновления без сноса. Для Full читай `codex-skills/references/full-update.md`: свежий deep scan и пересборка skills/RAG с сохранением MCP/доступов/настроек, основная идея остаётся, старая рабочая история не переходит в новый контекст. Старую систему заменяй только после проверенного checkpoint и успешной новой сборки.
5. При Git storage следуй `git-remote-flow`: отдельные коммиты/MR для product и agent Git при запрошенной публикации, клиентская policy для product, две проверенные ссылки без пустых MR. При local перенос не делает staging/commit/push в обоих местах; агентского MR нет и remote не требуется. Позднейший product push — отдельный запрос по клиентским правилам.

Доступность этого режима не означает наличие автоматического `--apply`. Соблюдай границу автоматизации из update reference и не заявляй успешную миграцию до проверки результата.
