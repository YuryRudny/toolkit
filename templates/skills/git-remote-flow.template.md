---
name: git-remote-flow
description: Project-local Git/GitLab policy для branch, commit, push и MR. Используй перед branch, commit, push, merge или MR actions.
---

# Git Remote Flow

## Конфигурация

- Remote:
- Базовая ветка:
- Branch naming: следуй явному запросу пользователя и existing project policy; если они не заданы, используй настроенный в среде префикс и осмысленный kebab-case slug
- Protected branches:
- Commit policy:
- Push policy:

<REPOSITORY_ROUTING>
- MR policy:
- CI/check policy:

## Правила

- До commit/push прочитай `codex-skills/references/repository-separation.md`: здесь заданы проверка владения, cleanup-исключение и парная публикация.
- Сначала установи storage mode. При `agent-storage.json` с mode=local/publication=never наши файлы остаются локально: не выполняй для них git init/staging/commit/push/MR. Сам перенос в local mode ничего не коммитит, включая customer cleanup. Последующий явно запрошенный product push допустим по клиентской policy; вместо агентского MR сообщи «локальное хранение — не используется». Правила двух Git ниже действуют только для Git storage.
- Не commit/push без анализа dirty worktree.
- Не используй `git add -A` без semantic grouping.
- Не работай в protected/base branch без explicit instruction.
- Если работа связана с Jira, формируй имя ветки из точного ключа задачи и короткого осмысленного описания.
- Если Jira-задачи нет, используй короткое осмысленное имя по сути изменения с префиксом, который требует текущая среда или team policy.
- Если branch не соответствует task policy, остановись.
- Перед publish собери evidence pack.
- При Git storage изменения customer-кода и agent-system коммить и отправляй раздельно, каждый в свой remote; local agent storage не публикуется.
- Никогда не добавляй наши RAG, skills, agent instructions или toolkit-файлы в customer-code репозиторий. Клиентский AGENTS.md/skills не становятся нашими по имени; сохраняй их локальную authority.
- При update проверяй разделение; если наши материалы в customer repository и назначения нет, запроси выбор Git-репозиторий или local папка без Git. Перенос выполняй по соответствующему reference до дальнейших update-записей.
- Cleanup ранее отслеживаемых agent artifacts — отдельный customer diff по местным правилам; перенос содержимого — artifact diff. Не меняй продуктовый код под видом cleanup.
- При запрошенном push изменений двух Git создай/обнови два MR/PR и верни проверенные ссылки «Продуктовый MR» и «Агентский MR». Для Git без изменений укажи «не требуется», не создавай пустой MR.
- Не угадывай URL и не скрывай частичный успех. Ссылку на внутренний агентский MR не размещай в клиентском MR без разрешения клиентской политики. Merge/auto-merge отдельно не разрешён.
