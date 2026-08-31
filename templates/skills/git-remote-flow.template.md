---
name: git-remote-flow
description: Project-local Git/GitLab policy для branch, commit, push и MR. Используй перед branch, commit, push, merge или MR actions.
---

# Git Remote Flow

## Конфигурация

- Remote:
- Базовая ветка:
- Branch naming: `<JIRA-KEY>-<meaningful-kebab-slug>` для задачи Jira; `<meaningful-kebab-name>` для работы без Jira; префикс и слово `codex` запрещены
- Protected branches:
- Commit policy:
- Push policy:

<REPOSITORY_ROUTING>
- MR policy:
- CI/check policy:

## Правила

- Не commit/push без анализа dirty worktree.
- Не используй `git add -A` без semantic grouping.
- Не работай в protected/base branch без explicit instruction.
- Если работа связана с Jira, формируй имя ветки из точного ключа задачи и короткого осмысленного описания.
- Если Jira-задачи нет, используй короткое осмысленное имя по сути изменения; не добавляй имя агента, инструмента или автора.
- Никогда не добавляй `codex` в имя ветки — ни как префикс `codex/`, ни как часть slug.
- Если branch не соответствует task policy, остановись.
- Перед publish собери evidence pack.
- Изменения customer-кода и agent-system всегда коммить и отправляй раздельно, каждый в свой remote.
- Никогда не добавляй RAG, skills, agent instructions или toolkit-файлы в customer-code репозиторий.
