# Reusable Agent System Toolkit

Эта папка — переносимый bootstrap toolkit для создания project-specific AI-agent operating system. Он поддерживает как установку внутри одного проекта, так и отдельный sidecar-репозиторий для нескольких customer-code репозиториев.

## Sidecar Workspace

Sidecar режим нужен, когда исходный код принадлежит заказчику, а RAG, документация, skills и правила команды должны храниться во внутреннем Git. Artifact repository содержит `workspace.json`; customer repositories и toolkit остаются соседними Git-корнями.

```text
workspace/
  AGENTS.md -> bsg-agent-system/AGENTS.md
  .agents/skills -> ../bsg-agent-system/codex-skills/skills
  bsg-agent-system/                               # RAG/docs/skills/runtime
  reusable-agent-system-toolkit-source/           # compiler
  service-a/                                      # customer code
  service-b/                                      # customer code
```

Основной sidecar flow:

```bash
node ../reusable-agent-system-toolkit-source/scripts/bootstrap.js workspace-snapshot .
node ../reusable-agent-system-toolkit-source/scripts/bootstrap.js create-workspace-model .
node ../reusable-agent-system-toolkit-source/scripts/bootstrap.js render-workspace-runtime .
node bin/agentctl.js install
node bin/agentctl.js integrations configure /absolute/path/to/.env
node bin/agentctl.js sync
node bin/agentctl.js smoke <repository-id>
```

`agentctl integrations configure` сохраняет только путь до env в ignored `.local/integrations.json`, устанавливает dependency-free STDIO MCP в пользовательский Codex config и выполняет read-only probes Jira, Confluence, GitLab и Figma. Значения токенов не копируются в Git или MCP config. `agentctl sync` делает только `git pull --ff-only` внутреннего agent-system по уже настроенному SSH и обновляет локальные ссылки. Customer repositories он не переключает и не обновляет. `agentctl status` сравнивает их HEAD с RAG snapshot, а `commit-plan` блокирует agent artifacts в Git заказчика.

`agentctl smoke <repository-id>` является обязательным post-task gate для любого репозитория с file edits. Он запускает configured `automatedTests`, затем `smokeTests`, останавливается на первой ошибке и пишет локальный ignored evidence-файл. Отсутствующий automated test или smoke profile блокирует завершение задачи. Несколько repository ids разрешены для cross-repo задачи; `--all` предназначен для полного workspace audit.

Для внутренних HTTPS с корпоративным CA env может задать `ENTERPRISE_CA_FILE=/absolute/path/company-ca.pem`. Локальный MCP получает его через `NODE_EXTRA_CA_CERTS`; проверка сертификата никогда не отключается.

Legacy GitLab с уже принятой project policy `sslVerify=false` может быть указан exact origin в `workspace.json` → `integrations.insecureTlsOrigins`. Исключение действует только на этот GitLab origin и не меняет TLS Jira, Confluence, Figma или других GitLab instances.

Git clone/fetch/push не зависят от GitLab API probe. Sidecar использует нативную Git credential chain: сначала системный helper разработчика (`osxkeychain`, Git Credential Manager и т.п.), затем generated `bin/git-credential-env.js` как fallback. Fallback читает `GITLAB_<NAME>_GIT_USERNAME` + `GITLAB_<NAME>_GIT_TOKEN`, либо существующие `GITLAB_<NAME>_USERNAME` + `GITLAB_<NAME>_TOKEN`, только из локального env и только для совпавшего HTTPS origin.

Default required enterprise APIs: Jira, Confluence и Figma. GitLab REST optional; он не участвует в решении, может ли агент читать, ветвить и публиковать код через Git remote.

Ни один sidecar script не должен писать в customer-code repositories. Эта граница проверяется snapshot/verify gate до commit.

## Project-local Mode

Скопируй папку в корень целевого проекта и запусти из этого же проекта path-first командой:

```text
Ты находишься в корне целевого проекта.
Не ищи toolkit в ~/.codex, plugins, node_modules, соседних проектах или родительских workspace-папках.
Открой и выполни локальную инструкцию:
./reusable-agent-system-toolkit/skills/project-agent-bootstrap/SKILL.md

Если этого файла нет в текущем проекте, остановись и скажи, что reusable-agent-system-toolkit не найден в project root.
Не создавай .codex/skills, codex-skills, docs/agent-system или "ближайший эквивалент" без локального bootstrap SKILL.md.
```

Не запускай через `$project-agent-bootstrap`, если skill не установлен в активной Codex-сессии. Для переносимого toolkit source of truth - файл `./reusable-agent-system-toolkit/skills/project-agent-bootstrap/SKILL.md` внутри целевого репозитория.

Toolkit не является готовым набором project-specific skills. Это методика, по которой агент должен изучить целевой проект или workspace, аккуратно смержить существующие правила, создать evidence-based документацию и затем сгенерировать skills под реальный стек, архитектуру, риски и командные conventions.

## Compiler Architecture

Toolkit использует исполняемый pipeline, а не только Markdown-инструкции:

```text
bootstrap.js -> project-model.json -> topology research tasks -> evidence/RAG
-> seed selection -> structured skill inputs -> rendered skills
-> skill-registry.json -> workflow-router -> computed quality report
```

- `project-model.json` является canonical structured model проекта.
- В sidecar режиме `workspace.json` задаёт Git boundaries, а source evidence в model/docs адресуется через `repo://<id>/<path>`.
- `bootstrap-state.json` разрешает только последовательные переходы с prerequisites.
- `research-tasks.json` строится по реальным modules, entry points и capabilities и синхронизируется с Markdown view.
- `skill-registry.json` является единственным источником доступных runtime skills для router.
- `bootstrap-quality-report.md` создается скриптом из измеряемых артефактов, а не самооценкой агента.

Основной CLI:

```bash
node reusable-agent-system-toolkit/scripts/bootstrap.js status .
```

Проверка самого toolkit на временном fixture-проекте:

```bash
node reusable-agent-system-toolkit/tests/run-tests.js
node reusable-agent-system-toolkit/tests/run-sidecar-tests.js
node reusable-agent-system-toolkit/tests/run-enterprise-tests.js
```

Первый запуск toolkit в новом проекте должен быть full project research-code-review: агент изучает стек, архитектуру, data flow, зависимости, security/privacy, performance/resource leaks, testing/CI, critical flows и risk zones, затем создает полный русскоязычный отчет, risk register, refactor plan и smoke checklist. Быстрый обзор стека не считается успешным bootstrap.

Research должен быть adversarial и stack-neutral: агент сначала классифицирует применимые слои проекта, затем проходит defect hunts по correctness/domain logic, architecture/ownership, data/API/contracts, security/privacy, performance/resource leaks, type/runtime safety, testing/CI/observability и dependencies/supply chain. Это правило одинаково для фронта, бэка, монорепы, CLI, worker-ов, mobile/native и infrastructure проектов.

Research должен идти по воспроизводимому алгоритму `deep-research-execution-algorithm`: inventory проекта, hot spots, critical flow traces, contract/boundary review, defect hunts, dependency usage review, tests/CI review и payload для docs/RAG/skills. Если research не дал проектные привязки, локальные антипаттерны, подсказки поиска source и checks by blast radius, skills нельзя считать project-specific.

Во время deep scan агент должен вести рабочую память на диске по `research-working-memory`: `docs/agent-system/research-workspace/research-plan.md`, `research-notes.md`, `evidence-log.md`, `error-log.md`, `decisions.md`. Это нужно, чтобы после десятков чтений файлов агент не потерял цель, evidence и ошибки, а финальные docs строились из накопленных заметок, а не из краткой памяти.

Первый запуск также должен создать agent knowledge base: компактную RAG-like базу знаний и retrieval index, чтобы последующие задачи не требовали повторного полного чтения проекта.

Перед research bootstrap запускает install wizard:

- спрашивает путь до `.env` для Jira, Confluence, GitLab и Figma/MCP access;
- объясняет, что `.env` нужен только локальному integration runtime;
- не печатает и не копирует secret values в docs/skills;
- в sidecar режиме создаёт ignored `.local/integrations.json`, рендерит `bin/enterprise-mcp.js`, устанавливает MCP через `codex mcp add` и выполняет read-only probes всех четырёх систем;
- настраивает нативный Git transport в `.git/config` customer repositories без записи credentials и проверяет clone/fetch/push-доступ через `agentctl integrations git-doctor`;
- в project-local режиме сохраняется helper-script flow через `.tmp/`;
- не перебирает transport/auth modes во время обычной работы: режим задаётся env contract и после ошибки применяется fail-fast;
- при ошибке говорит точную причину: неверный путь, отсутствующая переменная, протухший токен, DNS/network/auth/permission problem или unexpected response.

Только после того, как enterprise/MCP setup завершился статусом `pass` или `skipped`, install wizard спрашивает, запускать ли deep scan. Агент обязан предупредить, что глубокое сканирование может занять время и потратить токены. Если пользователь выбирает пропуск, агент обязан предупредить: без deep scan не будет полноценной RAG базы, карты проекта, risk register и refactor plan, а скилы будут менее конкретными и более общими. Такой режим помечается как `degraded install`.

Если в sidecar toolkit нет `templates/workspace/enterprise-mcp.template.js` или `templates/workspace/agentctl.template.js`, это stale/incomplete toolkit copy. Для project-local helper mode аналогично обязательны `templates/enterprise-scripts/*`. Агент должен остановиться и попросить обновить toolkit.

В конце project-local установки bootstrap обязан добавить `reusable-agent-system-toolkit/` в `.gitignore` целевого проекта. В sidecar режиме это правило не применяется: toolkit и agent-system являются отдельными внутренними репозиториями, а customer-code репозитории не изменяются вообще.

Важно: если deep scan подтвержден, bootstrap не останавливается за approval между этапами. Агент сначала досконально изучает проект, формирует full project research report и research evidence pack, подтверждает coverage/depth criteria, затем создает RAG базу, project docs и только после этого генерирует skills/maps/modes.

Запуск идет строго по `bootstrap-strict-algorithm`: skills templates и `generated-skill-catalog` запрещено читать до artifact gate `Docs/RAG Ready`. Это нужно, чтобы skills писались из понимания проекта, RAG базы, карт, risks и refactor plan, а не из generic шаблонов.

После `Docs/RAG Ready` skills не пишутся свободной генерацией. Они компилируются build pipeline:

```text
render-operational-skills.js -> create-skill-inputs.js -> extract-seed-playbooks.js -> агент адаптирует docs/agent-system/skill-inputs/*.json как schemaVersion 2 playbook forms -> render-skills.js -> SKILL.md + assembly sheets
```

Агент отвечает за смысл: project hooks, critical flows, local risks, workflow steps, checks, gates and result format. Toolkit отвечает за структуру и markdown render. Full install не должен выдавать краткий конспект, grouped `stack-skills.md`, skill, написанный “из головы”, или гибрид из короткого custom skill и приклеенных template sections.

Toolkit содержит встроенную библиотеку seed/base playbooks в `skill-seeds/`. Это не просто “источник вдохновения”: выбранный library skill становится base-каркасом для assembly. Дополнительно подключены external libraries: `skill-seeds/external/agent-skills-main/` со 110 imported skills и `skill-seeds/external/ai-agents-skills-main/` с 9 русскоязычными engineering playbooks и общими agents/docs/prompts/references. После `Docs/RAG Ready` агент обязан выбрать применимые seeds по `skill-seed-library.md`, `skill-seeds/manifest.json` и external indexes, открыть selected base skill, записать `selected/recommended/skipped` с evidence, заполнить adaptation sheet и только потом собрать итоговый skill через `.full.template.md`.

Full bootstrap должен пройти `bootstrap-quality-contract.md`: research, RAG, risks/refactor, skill assembly, senior skill quality, references, language, enterprise hygiene и re-run safety получают `10/10`. В конце создается `docs/agent-system/bootstrap-quality-report.md`. Если хотя бы одна категория ниже 10, full install не считается готовым: агент возвращается в нужную фазу repair loop и исправляет артефакты без дополнительного approval, если deep scan уже был разрешен.

## Принципы

- Существующие правила проекта считаются авторитетными, пока не выполнен merge-анализ.
- Existing local skills (`codex-skills/skills/*`, `.codex/skills/*`, `AGENTS.md` и похожие agent surfaces) считаются first-class input. Bootstrap обязан составить inventory, authority matrix и merge decisions до генерации новых skills. Generated router должен route to authoritative local skills или documented adapters, а не перетирать их.
- Сгенерированные skills должны быть project-local, собранными по явным шаблонам, недублирующимися и управляться через `workflow-router`.
- Findings должны быть evidence-based: пути к файлам, команды, документация, тесты, runtime-наблюдения или явно отмеченные gaps.
- Команда "ресерч" в generated project-local skills должна сразу включать Research mode. Если пользователь не указал scope, агент берет весь проект и не задает серию уточняющих вопросов.
- Research mode не должен завершаться только stack summary. Он обязан дать findings/gaps и обновить project docs, если они отсутствуют или bootstrap/research этого требует.
- Первый bootstrap обязан создать полный русскоязычный отчет для разработчиков: stack, architecture, data-flow, dependencies/libraries, security, performance, testing/CI, findings, gaps и refactor recommendations.
- Первый bootstrap обязан выполнить layer classification и defect hunt matrix. Без них research считается discovery, а не deep research.
- Первый bootstrap обязан вести рабочую память для research: plan, заметки, журнал evidence, журнал ошибок и decisions. Deep scan без `evidence-log.md` не считается полноценным.
- Dependency research обязателен: manifest/lockfile, heavy libraries, one/two-place usage candidates, outdated/deprecated/security-sensitive packages и audit gaps.
- Stack standards должны адаптироваться к реальному стеку, а не копироваться как общий текст про best practices.
- Generated stack skills должны быть уровня strong senior engineer: они обязаны поднимать качество кода, замечать unsafe/fragile patterns в зоне задачи и требовать локальное исправление или risk/refactor gap. Такие skills собираются только через full templates и adaptation sheets.
- Full install обязан выполнить выбор seeds из `skill-seeds/manifest.json` и external library indexes: выбрать применимые встроенные playbooks по реальному stack evidence, existing rules и RAG, затем адаптировать их в project-local skills на русском языке.
- Full install обязан сохранить `docs/agent-system/skill-inputs/<skill-name>.json` и compiled `docs/agent-system/skill-assembly/<skill-name>.md` для каждого full quality/stack/domain skill. `skill-inputs` должны быть `schemaVersion: 2`: RAG routes, project hooks, critical flows, risks, workflow, layer checks, gates, stop conditions и result format заполняются typed objects, а не строковыми списками. Markdown `SKILL.md` создается через `render-skills.js`, а не руками.
- Seed library не заменяет deep research. Если deep scan пропущен, stack-specific seeds можно только рекомендовать как preliminary, но нельзя выдавать их за project-specific senior skills.
- External library нельзя читать целиком до выбора. Агент сначала читает manifest/index, затем открывает только selected `SKILL.md` и нужные bundled resources.
- Для core quality playbooks (`code-review-and-quality`, `debugging-and-error-recovery`, `frontend-ui-engineering`, `mr-review`, `spec-driven-development`, `ci-cd-and-automation`) предпочитай `ai-agents-skills-main`, если проектный evidence подтверждает применимость.
- Full install обязан создать отдельные senior playbooks: `code-review-and-quality`, `debugging-and-error-recovery`, `refactor-engineering`. Они должны быть уровня эталонных инженерных skills: с triggers, RAG/source workflow, quality bar, gates, stop conditions, checks, severity/triage/refactor protocol и форматом результата.
- Full install обязан создать operational references для skills: `code-review-playbook.md`, `debugging-playbook.md`, `refactor-playbook.md`, `testing-playbook.md`, `security-performance-playbook.md` и stack-specific references по применимым слоям. Эти references должны содержать retrieval hints, project examples, known bad patterns, preferred local patterns, commands/checks и связи с risks/refactor items.
- `frontend-ui-engineering` и `backend-engineering` не должны быть короткими списками. UI skill обязан задавать production UI bar: accessibility, responsive, visual polish, design system, state boundaries, browser/runtime guards. Backend skill обязан задавать production backend bar: validation, auth/authz, transactions, idempotency, safe errors, observability и testing by blast radius.
- `codex-skills/references` не должен быть копией `docs/agent-system`. Project docs являются source of truth для RAG; skill references допустимы только если добавляют operational value: локальные patterns, examples, command recipes, retrieval hints или stack-specific gotchas.
- UI/backend/API/data/security/testing правила должны описывать работу уровня опытного инженера в конкретном проекте.
- Финальная система должна делать поведение агента воспроизводимым: trigger, выбранный skill, gate, action, evidence, review, gaps.
- Generated system должна проходить validation checklist: required files, router behavior, research mode, stack-quality gates, enterprise fail-fast и docs artifacts.
- Full bootstrap должен иметь `bootstrap-quality-report.md` с `Full bootstrap quality: 10/10`; `9/10` считается repair required, а не успехом.
- Enterprise setup должен создавать helper scripts на диске, хранить абсолютный env path только в ignored `.tmp/integration-env.sh`, а required variables/winning auth mode/probes записывать в access-policy skills. Runtime fallback после установки запрещен: агент использует записанный способ или останавливается с blocker.
- В project-local режиме toolkit folder не должен попадать в commit целевого проекта. В sidecar режиме toolkit и agent-system хранятся только во внутренних repositories, а customer Git остаётся чистым от agent artifacts.
- Research evidence pack и passed coverage/depth validation обязательны перед генерацией skills/RAG.
- Последующая работа должна начинаться с knowledge base/index и только потом читать deep docs/source по scope.

## Skills В Toolkit

- `project-agent-bootstrap` - управляет полным процессом внедрения.
- `project-discovery` - картирует стек, архитектуру, правила, команды, домены и ownership.
- `deep-project-audit` - находит архитектурные, логические, safety, security, performance и test риски.
- `project-docs-generator` - создает проектную документацию по результатам discovery и audit.
- `project-skills-assembler` - собирает project-local skills через library base skill, adaptation sheet и full templates.
- `project-skills-generator` - deprecated compatibility wrapper, который должен перенаправлять старые вызовы в assembler.
- `existing-rules-merge` - объединяет текущие agent rules с новой системой без потери локальной политики.
- `stack-engineering-standards` - готовит stack-specific engineering excellence payload для последующего render assembly.
- `skill-seeds/` - встроенная библиотека seed playbooks, включая curated seeds и external imported library, которые адаптируются под проект после RAG/docs.
- `scripts/create-research-tasks.js` - создает research task queue.
- `scripts/render-operational-skills.js` - детерминированно создает operational skills (`workflow-router`, `research-audit`, `pre-change-checklist`, `review-checklist`, `stack-quality`, `git-remote-flow`) из templates.
- `scripts/create-skill-inputs.js` - создает v2 structured playbook inputs для target skills.
- `scripts/extract-seed-playbooks.js` - открывает selected seed files, извлекает секции/rules/gates/result format и записывает `docs/agent-system/seed-extractions/<skill-name>.json`; без этого библиотека считается неиспользованной.
- `scripts/render-skills.js` - компилирует `SKILL.md`, references и assembly sheets из v2 inputs; поддерживает точечный render `render-skills.js . <skill-name>`.
- `scripts/check-bootstrap-state.js` - проверяет, что build pipeline реально завершен.

## Ожидаемый Результат В Целевом Проекте

После применения toolkit в проекте должны появиться:

- project-local skills directory;
- router-first workflow;
- режимы development, refactor, research, review, merge, summary;
- pre-change и final review gates;
- evidence pack и semantic commit workflow;
- bootstrap quality report 10/10;
- senior quality playbooks: code review, debugging/root cause, refactor engineering;
- project overview, architecture map, risk register, refactor plan, smoke checklist;
- full project research report для разработчиков;
- project map, current state и research worklog;
- agent knowledge base и knowledge index для token-efficient повторной работы;
- research evidence pack как источник правды для RAG базы;
- stack-specific frontend/backend/API/database/testing/security/performance skills, если они применимы.
- отчет по выбору seeds: какие встроенные playbooks выбраны, рекомендованы или пропущены и почему.
- structured skill inputs в `docs/agent-system/skill-inputs/`;
- extracted seed playbooks в `docs/agent-system/seed-extractions/`;
- adaptation sheets в `docs/agent-system/skill-assembly/` для full quality/stack/domain skills.
- stack-quality gates для pre-change и final review, чтобы агент не размножал плохой код проекта.
- concrete generated skill templates для router, research, pre-change, review, stack-quality и enterprise access.
- `.tmp/integration-env.sh`, `.tmp/jira-rest.sh`, `.tmp/confluence-rest.sh`, если enterprise setup включен.
- `skill-seeds/external/agent-skills-main/` и `skill-seeds/external/ai-agents-skills-main/` как переносимые библиотеки imported skills внутри toolkit.

Не копируй правила конкретного эталонного проекта в другой репозиторий вслепую. Используй toolkit, чтобы заново собрать систему из evidence целевого проекта.
