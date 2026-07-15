---
name: git-remote-flow
description: Project-local Git/GitLab policy для branch, commit, push и MR. Используй перед branch, commit, push, merge или MR actions.
---

# Git Remote Flow

## Конфигурация

- Remote:
- Базовая ветка:
- Branch naming:
- Protected branches:
- Commit policy:
- Push policy:
- MR policy:
- CI/check policy:

## Правила

- Не commit/push без анализа dirty worktree.
- Не используй `git add -A` без semantic grouping.
- Не работай в protected/base branch без explicit instruction.
- Если branch не соответствует task policy, остановись.
- Перед publish собери evidence pack.
