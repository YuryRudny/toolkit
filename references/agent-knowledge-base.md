# База Знаний Агентов

Используй этот reference при bootstrap, docs generation, workflow-router и generated system validation.

Цель - потратить много токенов на глубокий research только при первом запуске, а дальше дать агентам компактную RAG-like базу знаний: что читать сначала, где лежит evidence, какие файлы отвечают за flows, какие risks/gates применимы.

Это не обязательно vector database. Минимальная portable форма - Markdown/JSON индекс в docs, который работает как retrieval layer для агента.

## Обязательные Артефакты

При bootstrap создай agent knowledge base только после passed deep bootstrap research coverage gate:

```text
docs/agent-system/knowledge-base.md
docs/agent-system/knowledge-index.md
docs/agent-system/full-project-research-report.md
docs/agent-system/research-evidence-pack.md
docs/agent-system/current-state.md
docs/agent-system/research-worklog.md
```

Если проект имеет другой docs layout, адаптируй path, но сохрани смысл:

- `knowledge-base.md` - компактный контекст для старта агента;
- `knowledge-index.md` - retrieval index: topic -> docs/files/skills/checks;
- `full-project-research-report.md` - полный отчет для разработчиков и source of truth для risks/refactor recommendations;
- `research-evidence-pack.md` - evidence, на котором построена база;
- `current-state.md` - актуальный статус и open gaps;
- `research-worklog.md` - история research/discovery.

## Содержание Knowledge Base

`knowledge-base.md` должен быть компактным. Не копируй весь research report.

Обязательные разделы:

- Идентичность проекта: что за система и для кого.
- Кратко о стеке: только факты, нужные для работы.
- Точки входа: app/API/jobs/routes.
- Критичные flows: 5-15 главных flows с trace/source ссылками.
- Карта модулей и доменов: ownership и boundaries.
- Зоны повышенного риска: где агент должен быть осторожен.
- Dependency watchlist: heavy/rare/security-sensitive packages и где они используются.
- Quality gates по стеку: какие skills читать для UI/backend/API/data/security/testing.
- Enterprise доступы: где смотреть Jira/Confluence/Git config.
- Команды: install/lint/typecheck/test/build/dev.
- Правила retrieval: что читать по типу задачи.
- Актуальность: дата последнего bootstrap/research и gaps.
- Source evidence: ссылка на `research-evidence-pack.md`.
- Отчет для разработчиков: ссылка на `full-project-research-report.md`.

## Содержание Knowledge Index

`knowledge-index.md` должен работать как RAG router:

```markdown
| Тип задачи/topic | Читать сначала | Потом читать | Source/source code | Skills | Обязательные проверки | Stop/gap |
|---|---|---|---|---|---|---|
```

Обязательные topics или явное `не применимо` с evidence:

- новая feature;
- UI component;
- form/state/data fetching;
- backend/API endpoint;
- database migration;
- auth/security;
- performance;
- dependencies;
- refactor;
- research;
- Jira task;
- merge/publish.

Каждый row должен указывать source/source code область, required skills/checks и stop/gap. Недостаточно сослаться только на `project-map.md`.

## Правило Для Generated Skills

Generated `workflow-router`, `project-authority`, `research-audit`, `pre-change-checklist` и stack-quality skills должны ссылаться на knowledge base:

- сначала читать `knowledge-base.md`;
- затем `knowledge-index.md` для выбора docs/skills;
- только потом читать deep docs/source files по конкретному scope.

Исключения:

- knowledge base отсутствует или stale;
- задача требует source-level evidence;
- high-risk change требует проверить actual code;
- user explicitly asks for fresh discovery.

## Правила Актуальности И Обновления

Knowledge base надо обновлять:

- после bootstrap;
- после deep research;
- после refactor slice, который меняет architecture/flows;
- после изменения enterprise access;
- после добавления/удаления critical command/check;
- после discovery significant gap closure.

Не обновляй knowledge base при мелкой правке, если project map/risks/commands не изменились.

## Правила Против Раздувания

- Не превращай knowledge base в dump всех docs.
- Не копируй secrets, payloads, token values, private links with credentials.
- Не дублируй long risk register; дай ссылку и summary.
- Не дублируй full architecture docs; дай retrieval path.
- Целевой размер: достаточно коротко, чтобы агент мог прочитать первым.

## Условия Остановки

Остановись или запиши blocker, если:

- bootstrap завершает работу без knowledge base;
- knowledge base создается без passed research evidence pack;
- knowledge base создается без полного research report;
- knowledge base противоречит project map/risk register/current state;
- retrieval index не указывает, что читать для major task types;
- retrieval index не указывает source/source code области, skills, checks и stop/gap;
- knowledge base не содержит dependency watchlist;
- knowledge base содержит secrets;
- generated router не ссылается на knowledge base.

## Формат Результата

```markdown
База знаний агентов:
- Path:
- Index path:
- Freshness:
- Topics covered:
- Required first reads:
- Gaps/blockers:
```
