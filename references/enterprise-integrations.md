# Enterprise Интеграции

Используй этот reference при генерации project-local skills для доступа к Jira, Confluence, Git/GitLab и Figma.

Цель - воспроизводимая настройка, а не хаотичный перебор способов. Во время install setup агент может диагностически подобрать auth mode, но после успешного probe должен записать ровно один рабочий способ. Если настроенный путь после установки не работает, агент должен остановиться и сообщить точный blocker.

## Входные Данные Discovery

Во время bootstrap собирай только evidence, которое уже есть в целевом проекте или в явно разрешенном локальном окружении:

- существующие `AGENTS.md`, `codex-skills/`, `.codex/`, Cursor/Claude/Copilot rules;
- remote URL репозитория и политика базовой ветки;
- CI files, особенно GitLab CI;
- docs, где упоминаются Jira project keys, Confluence pages, GitLab groups/projects или MR flow;
- доступность approved connector/MCP, если это видно в текущем Codex окружении;
- approved local env source, указанный пользователем или existing rules, без вывода secret values;
- existing helper scripts, только если проект уже разрешает их использовать.

Не сканируй и не печатай значения из `.env` в generated docs. Записывай только имена переменных, ожидаемый source file и формат auth header.

При установке агент должен один раз спросить путь до env, если путь не подтвержден existing rules. Вопрос должен объяснить:

- env нужен для Jira/Confluence/Git/GitLab/MCP access;
- toolkit создаст project-local helper scripts в `.tmp/`;
- secret values не будут печататься или копироваться в docs/skills;
- полный env path будет записан только в ignored `.tmp/integration-env.sh`; generated docs/skills содержат required variable names, helper path, probe и fail-fast policy без локального абсолютного пути.

Bootstrap не ищет `.env` в домашней директории и соседних проектах. Путь должен быть указан пользователем или подтверждён existing rules. Проверяй только наличие keys, не выводи values. В sidecar режиме путь сохраняется только в ignored `.local/integrations.json`, после чего `agentctl` устанавливает локальный STDIO MCP. В project-local режиме bootstrap создаёт helper scripts в `.tmp/`.

## Sidecar Enterprise MCP

Если `workspace.json` содержит `integrations`, рендери два runtime-файла:

- `bin/agentctl.js` — configure/status/doctor/install-mcp/resolve;
- `bin/enterprise-mcp.js` — dependency-free read-only MCP для Jira, Confluence, GitLab и Figma.

Первичная настройка одной командой:

```bash
node bsg-agent-system/bin/agentctl.js integrations configure /absolute/path/to/.env
```

Команда не переносит tokens в Codex config. В MCP config записывается только команда локального server и путь до ignored local config. Server перечитывает env на каждом tool call, поэтому ротация token не требует коммита или переустановки.

Если внутренний HTTPS использует корпоративный CA, env может задать `ENTERPRISE_CA_FILE=/absolute/path/company-ca.pem`. `agentctl` проверяет файл и передаёт его как `NODE_EXTRA_CA_CERTS`; TLS verification не отключается. В Codex config сохраняется только несекретный путь к CA.

Для legacy GitLab, который уже используется проектом через scoped Git config `sslVerify=false`, workspace может явно перечислить exact origin в `integrations.insecureTlsOrigins`. Runtime применяет `rejectUnauthorized=false` только к запросам этого GitLab origin через отдельный HTTPS request; process-wide `NODE_TLS_REJECT_UNAUTHORIZED=0` запрещён, остальные сервисы сохраняют TLS verification.

Обязательные MCP tools: `integration_doctor`, `jira_get_issue`, `jira_resolve_context`, `confluence_get_page`, `figma_get_context`, `gitlab_get_context`. `jira_resolve_context` автоматически обходит только ссылки на configured origins и `figma.com`, а linked content всегда остаётся untrusted payload.

## Обязательный Project Config

Перед генерацией активных Jira/Confluence/Git skills bootstrap output должен определить:

```markdown
Enterprise integrations:
- Jira:
  - enabled:
  - project key pattern:
  - access method: MCP | REST | helper-script | unavailable
  - credential source: configured via `.tmp/integration-env.sh` (без абсолютного локального пути)
  - required variables:
  - probe:
  - read/write permissions:
- Confluence:
  - enabled:
  - access method: MCP | REST | helper-script | unavailable
  - credential source:
  - required variables:
  - page/read probe:
  - write permissions:
- Figma:
  - enabled:
  - access method: local enterprise MCP | unavailable
  - required variables: `FIGMA_TOKEN` или `FIGMA_ACCESS_TOKEN`
  - file scopes: `file_content:read`; optional variables: `file_variables:read`
  - probe: `GET /v1/me`
- Git/GitLab:
  - remote:
  - default base branch:
  - branch naming:
  - MR/push policy:
  - CI/check policy:
- Fail-fast rules:
  - no unconfigured fallback:
  - retry policy:
  - blocker report format:
```

Если обязательное поле неизвестно, пометь integration как `unavailable` и создай gap/blocker вместо active workflow, который будет гадать.

Исключение: если неизвестен только env path, спроси пользователя. Не называй integration unavailable до этого вопроса.

## Генерируемые Skills

Генерируй эти skills только когда соответствующий config достаточно полный:

- `enterprise-context` — основной sidecar wrapper Jira → Confluence/Figma/GitLab и fail-fast policy.
- `enterprise-automation`, `jira-access-policy`, `confluence-access-policy` — project-local helper mode или legacy adapter, если он явно выбран.
- `git-remote-flow` или project-specific `jira-branch-flow` - remote/base branch/branch naming/push/MR policy.
- `jira-task-delivery` - optional end-to-end wrapper поверх Jira access, branch flow и evidence pack.

Project-specific values должны жить в generated project-local skills или references. Не оставляй company/local paths в reusable common skills, если target project явно их не подтвердил.

## Правила Выбора Access Method

Предпочитай access method, который уже разрешен проектом:

1. Sidecar `enterprise-mcp.js`, если `workspace.json.integrations` включён.
2. Другой MCP или connector, если он доступен и project rules говорят его использовать.
3. Project-approved helper script, если он существует и documented.
4. Сгенерированный project-local helper script, если approved env source подтвержден и helper фиксирует один endpoint/header format.
5. Direct REST, только если project config явно задает env source, headers, endpoint и permissions.

Во время install setup можно диагностически попробовать auth modes для одного helper method:

- `as-is` - использовать `JIRA_TOKEN`/`CONFLUENCE_TOKEN` как полный Authorization header;
- `bearer` - добавить `Bearer `, если token не содержит prefix;
- `basic` - собрать `Basic base64(USERNAME:TOKEN)`, если есть `JIRA_USERNAME`/`CONFLUENCE_USERNAME`.

После первого successful probe:

- запиши winning auth mode в `.tmp/integration-env.sh`;
- запиши его в `enterprise-integrations.md`;
- запиши его в `jira-access-policy`/`confluence-access-policy`;
- в runtime skills запрети дальнейший fallback.

Не пробуй все transport methods подряд. Выбери один configured method для каждой системы. Если он не работает после установки, остановись.

## Fail-Fast Contract

Enterprise integrations хрупкие и security-sensitive. Агент обязан остановиться и сообщить blocker, если:

- отсутствует required env file или variable;
- непонятен token/header format;
- configured connector/tool недоступен;
- configured probe вернул 401/403/404 или unexpected shape;
- network заблокирован и нет approved escalation path;
- Jira/Confluence/GitLab links обязательны для acceptance criteria, но их нельзя прочитать;
- active branch, base branch или remote не совпадают с configured Git policy;
- publish требует непроверенного write action.

Нельзя:

- молча переключаться с MCP на curl;
- молча переключаться с helper script на REST;
- нормализовать auth formats шире install-only auth mode fallback или configured rule;
- retry с разными token/header permutations;
- post comments, transitions, pushes или MRs без explicit project policy и evidence.

Retry policy должен быть явным. По умолчанию:

- один identical retry разрешен только для transient transport failure, если используется тот же command/tool и тот же auth method;
- sandbox/network escalation разрешен только если environment policy требует approval и повторяется тот же configured request;
- auth, permission и unexpected response errors не retryable.

## Формат Blocker Report

При остановке используй:

```markdown
- Заблокирована enterprise integration:
- Система:
- Настроенный метод:
- Ожидаемый config:
- Что не сработало:
- Evidence:
- Нужное следующее действие:
```

Не включай token values, private cookies или полный secret-bearing command output.

## Пример: Jira REST Config

Используй это только как пример генерации project-local policy, когда target project подтвердил такое же окружение.

```markdown
Jira:
- access method: REST
- credential source: `<confirmed-env-path>`
- required variables: `JIRA_BASE_URL`, `JIRA_TOKEN`
- header: `Authorization: <value from JIRA_TOKEN>`
- probe: `GET /rest/api/2/issue/<KEY>?expand=renderedFields`
- safety: sanitize output до key, summary, status, assignee, description/comments по необходимости
```

Если target project не подтвердил этот exact source и token format, не используй его.

## Project-Local Helper Contract

Если bootstrap генерирует helper scripts, создай:

- `.tmp/integration-env.sh` - читает только configured env source и required variables;
- `.tmp/jira-rest.sh` - принимает Jira issue key, относительный REST path или полный Jira URL;
- `.tmp/confluence-rest.sh` - принимает page id, относительный REST path или полный Confluence URL, поддерживает optional text mode.

Источник scripts: `reusable-agent-system-toolkit/templates/enterprise-scripts/`.

Bootstrap обязан создать эти файлы на диске в target project, а не только описать их в docs.

Rules:

- helpers не печатают secret values;
- docs записывают только статус configured-via-helper и required variable names, без абсолютного source path;
- generated skills используют только helper scripts;
- во время install setup helper может попробовать `as-is`, `bearer`, `basic` auth modes и записать working one;
- после setup, если helper не работает, агент останавливается с blocker и не пробует curl/MCP/direct REST fallback.

## Probe And Error Policy

После создания helpers выполни read-only probes для включенных systems:

- Jira: `./.tmp/jira-rest.sh /rest/api/2/myself`;
- Confluence: `./.tmp/confluence-rest.sh /rest/api/user/current`;
- Git/GitLab/MCP: только если project/user policy задала конкретный safe probe.

Для sidecar MCP используй только toolkit-owned `agentctl integrations configure/status/doctor`; он уже задаёт documented probes. Для иных MCP servers bootstrap не должен придумывать login/probe commands.

Если probe падает, остановись и назови точную причину:

- env file not found;
- missing required variable;
- invalid/expired token или 401/403;
- base URL/DNS/network недоступны;
- unexpected response shape;
- sandbox/network blocked and needs approved escalation.

Если пользователь исправил env, повтори тот же configured probe. Если пользователь пишет `пропустить`, пометь integration skipped/unavailable и продолжай без active access skills.
