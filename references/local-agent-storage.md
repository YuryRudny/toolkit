# Локальное хранение без Git

Читай только если пользователь выбрал «локально у меня». Это полноценное место для наших skills, RAG, evidence, inputs, registry, rules и supporting files, но не Git-репозиторий и не «репозиторий без remote».

## Место и защита

Используй указанный пользователем путь. Если он выбрал локальное хранение без пути, предложи постоянную project-specific папку, например `~/.local/share/agent-systems/<project-id>`, и сообщи выбранный абсолютный путь до создания. Не выбирай временный каталог и не ищи там старые установки. Если нет разрешения записи — запроси доступ или другой путь, не заменяй назначение молча.

Папка должна быть вне customer/toolkit roots и вне любого Git worktree, включая родительский Git. Не используй соседний проект или существующий checkout в роли локального storage. Существующую непустую папку не перезаписывай: сначала inventory и решение коллизий. Для новой приватной папки используй права доступа владельца; не меняй права чужих каталогов.

Создай внутри `.gitignore` со следующим содержимым:

```gitignore
# Personal agent storage: never commit or publish.
*
```

Это дополнительная защита от обычного случайного staging, а не защита от `git add -f`. Не выполняй `git init`, не добавляй remote и не создавай commits, push или MR для storage. Не создавай `.gitignore` внутри клиентского проекта для маскировки непренесённых файлов.

## Локальный manifest

Создай `agent-storage.json` в storage root. Используй реальные id и абсолютные пути конкретной машины, например:

```json
{
  "schemaVersion": 1,
  "mode": "local",
  "id": "project-agent-system",
  "publication": "never",
  "toolkit": { "path": "/absolute/path/to/toolkit" },
  "repositories": [
    { "id": "product", "role": "customer-code", "path": "/absolute/path/to/product" }
  ]
}
```

Не придумывай artifact remote и не создавай Git-only `workspace.json`. При переходе из старого sidecar сохрани старый manifest в backup с другим именем, после проверки маршрутов активируй только `agent-storage.json`. Toolkit тоже должен быть вне customer/storage roots; если доступная копия пока внутри customer проекта, сначала вынеси её в отдельно согласованное локальное место, не запускай её удаление вместе с работающим entrypoint.

## Перенос и дальнейшая работа

Следуй общим проверкам `repository-separation.md`: план, сохранение обеих версий dirty/index, проверенная копия до удаления, client-owned rules остаются на месте. Все agent artifacts, backup, отчёты и рабочая память пишутся только в локальную папку. Не копируй `.git`, env/credentials, секретные логи и продуктовый код. Не регенерируй хорошие skills.

Проверь пути в knowledge index, registry, authority и references; logical `repo://<id>/...` разрешай по `agent-storage.json`. Обнови локальный AGENTS.md и Git skill: agent storage имеет publication=never, никаких agent commits/MR. Дай пользователю точный путь к локальному entrypoint для следующих запусков; не помещай skills или внутренний storage pointer обратно в customer Git ради автоматического обнаружения.

Не оставляй активным старый `agentctl`, который делает `git pull` или commit в artifact Git. После проверки ownership можно выполнить `render-workspace-runtime` для storage root: новая версия определяет `agent-storage.json` и генерирует защищённый runtime. Его `status`, `doctor`, `commit-plan` и `update --check` — read-only; `install`, `sync`, integrations setup и публикация заблокированы в локальном режиме. Не обходи ownership-конфликт через автоматический adopt.

Сам перенос в local mode выполняется без staging, commit, push и MR в обоих местах. Если исходные agent files уже отслеживались клиентским Git, их удаление останется незакоммиченным cleanup diff: сообщи это явно. Не обещай, что они исчезли из Git history/remote. Продуктовые коммиты возможны позже только по отдельному запросу и клиентской policy; локальные агентские файлы в них не входят.

## Приёмка и ограничения

Проверь `.gitignore`, publication=never, отсутствие Git/remote у storage, все перенесённые материалы и пути, отсутствие потери клиентских правил и незатронутый index. Запусти `bootstrap.js update <storage-root> --mode incremental --check` либо --mode full согласно явному выбору. Без режима получишь вопрос `needs-update-mode`; source repositories берутся только из manifest. Нельзя объявить RAG актуальной по одному preflight.

Полный bootstrap/model/research pipeline пока не адаптирован к non-Git storage. Не запускай `init`, `create-model`, `create-workspace-model`, sidecar `sync` или `workspace-snapshot` как замену локальному update и не создавай Git ради их prerequisites. Поддержаны агентский перенос, read-only preflight, source URI resolution и безопасный local runtime; автоматического `--apply` по-прежнему нет.

Итог: абсолютный storage path, что перенесено, что проверено, незакоммиченный customer cleanup (если есть), «Агентский Git/MR: не используется — локальное хранение». Отсутствие agent remote здесь норма, не blocker и не повод снова просить репозиторий.
