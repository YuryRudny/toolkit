---
name: project-agent-update
description: Обновляет агентскую систему в выбранном full или incremental режиме, сохраняя MCP-настройки и разделение product/agent хранения. Используй для обновления skills/RAG или их переноса, не для обычных package updates.
---

# Обновление Проектной Агентской Системы

## Границы запуска

Используй локальную копию toolkit, из которой прочитан этот skill. В project-local режиме источник — `./reusable-agent-system-toolkit/skills/project-agent-update/SKILL.md`; для Git sidecar path/remote берутся из валидного `workspace.json`, для local storage явный toolkit.path — из `agent-storage.json`. Если локального источника нет, остановись; не ищи замену в home, plugins, node_modules или соседних проектах. При разработке самого toolkit это maintenance, не self-install и не перенос исходников toolkit.

## Обязательный порядок

1. Прочитай `../../references/update-modes.md`. В начале нового update спроси Full или бережный incremental, предупредив о времени/токенах Full и сохранении MCP. Если пользователь уже явно выбрал, не спрашивай повторно. Без выбора не запускай deep scan и не меняй систему.
2. Прочитай `../../references/repository-separation.md`. Выполни `node reusable-agent-system-toolkit/scripts/bootstrap.js update . --mode incremental --check` либо такую же команду с `--mode full` согласно выбору, не подставляй режим за пользователя. Для Git/local хранилища используй entrypoint из manifest и storage root. Команда read-only; отсутствие --mode возвращает `needs-update-mode`, не запускает default reset.
3. Если наши skills/RAG в customer Git и назначения нет, спроси Git-репозиторий или локальная папка без коммитов/push. Для Git запроси URL/checkout с remote; для local прочитай `../../references/local-agent-storage.md`, выбери безопасную постоянную папку, `.gitignore` и publication=never. Валидный существующий storage не переключай. Перенос выполняй только по проверенному плану, без потери клиента/настроек; local перенос не stage/commit/push ни одну сторону.
4. Для incremental прочитай только `../../references/incremental-update.md`: критичные ошибки и нужные compatibility updates, без сноса skills/RAG/истории и без full scan. Исправные материалы сохрани.
5. Для Full прочитай `../../references/full-update.md`: сохрани MCP-серверы, их конфигурацию, env/credentials sources, runtime и Git/CI/storage policy; основную идею вынеси в короткий project intent. Пересобери skills и базы по fresh deep scan. Старую рабочую историю не загружай в новый контекст, rollback checkpoint держи отдельно. Архив/план не равны готовой сборке: при отсутствии безопасного compiler workflow остановись до затрат/сноса, не обходи prerequisites.
6. Для Git storage commit/MR маршрутизация раздельная, публикация только по запросу и местной policy; верни URL обеих изменённых сторон. Для local agent commits/MR запрещены, последующий отдельно запрошенный product push — по клиентским правилам. Не создавай пустые MR и не выполняй merge автоматически.

## Результат

Сообщи update mode отдельно от storage mode, точное назначение, результат обновления/активации, MCP checks, сохранённый intent, состояние истории и блокеры. Различай preflight, deep scan, готовую сборку, активацию, cleanup и публикацию. Без безопасного назначения/решения ownership update не завершён; отсутствие remote у local storage не blocker. Ограничения `--check` описаны в `update-modes.md`: он ничего не удаляет и сам не делает deep scan/пересборку.
