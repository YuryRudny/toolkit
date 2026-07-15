# Enterprise Интеграции

## Назначение

Project-local конфигурация доступа к Jira, Confluence и Git/GitLab. Этот файл задает единственные разрешенные пути доступа для агентов.

## Jira

- Включена:
- Pattern Jira key:
- Метод доступа: helper-script | skipped by user | unavailable
- Helper: `.tmp/jira-rest.sh`
- Env helper: `.tmp/integration-env.sh`
- Источник credentials: configured via `.tmp/integration-env.sh` (абсолютный env path не записывать)
- Обязательные переменные: `JIRA_BASE_URL`, `JIRA_TOKEN`
- Auth mode:
- Проверочный probe: `./.tmp/jira-rest.sh /rest/api/2/myself`
- Права на чтение:
- Права на запись:
- Известные blockers:

## Confluence

- Включен:
- Метод доступа: helper-script | skipped by user | unavailable
- Helper: `.tmp/confluence-rest.sh`
- Env helper: `.tmp/integration-env.sh`
- Источник credentials: configured via `.tmp/integration-env.sh` (абсолютный env path не записывать)
- Обязательные переменные: `CONFLUENCE_BASE_URL`, `CONFLUENCE_TOKEN`
- Auth mode:
- Проверочный probe: `./.tmp/confluence-rest.sh /rest/api/user/current`
- Права на чтение:
- Права на запись:
- Известные blockers:

## Git И GitLab

- Remote:
- Базовая ветка:
- Правило именования веток:
- Метод доступа:
- Источник credentials:
- Обязательные переменные:
- Проверочный probe:
- Политика push:
- Политика MR:
- Политика CI/check:
- Известные blockers:

## MCP Servers

- Включены:
- Источник credentials:
- Обязательные переменные:
- Config path:
- Login/probe command:
- Права на чтение:
- Права на запись:
- Известные blockers:

## Fail-Fast Правила

- Разрешенная fallback policy:
- Retry policy:
- Политика network escalation:
- Условия остановки:

## Evidence

- Existing project rules:
- Env path configured in ignored helper: yes | no | skipped (сам абсолютный путь не записывать)
- Helper scripts created:
- Winning auth modes:
- Config files:
- Проверенные probes:
- Gaps/blockers:
