# Bootstrap Strict Algorithm

Используй этот reference в `project-agent-bootstrap`, `project-docs-generator`, `project-skills-assembler` и bootstrap acceptance.

Цель - запретить самовольный порядок запуска toolkit. Первый bootstrap всегда идет по фазам. Следующая фаза недоступна, пока предыдущая не закрыта реальными artifacts на диске.

## Главный Закон

Первый запуск toolkit:

```text
install wizard -> enterprise env/helpers/probes -> scan decision -> rules merge -> discovery -> research forms -> full research docs -> RAG base -> project maps/refactor docs -> stack standards -> create skill inputs -> extract seed playbooks -> adapt inputs from RAG -> skill render -> validation
```

Нельзя менять порядок. Нельзя начинать skills generation только потому, что агент "уже понял проект". Нельзя читать `templates/skills/*` до закрытия phase gate `Docs/RAG Ready`. Full skills собираются через build scripts and structured inputs, а не ручной markdown.

Если пользователь отказался от deep scan, full research/RAG path заменяется на degraded install path. Такой bootstrap нельзя называть полноценным: future tasks должны видеть warning, что RAG база, project map, risk register и refactor plan не готовы.

## Phase 0: Install Wizard

Обязательные действия:

- определить install mode: project-local либо sidecar по наличию `workspace.json`;
- в project-local режиме принять working directory как корень целевого проекта; в sidecar режиме принять его как корень artifact repository, а customer-code roots загрузить только из `workspace.json`;
- проверить bootstrap skill в manifest-declared toolkit path для sidecar либо в `./reusable-agent-system-toolkit/skills/project-agent-bootstrap/SKILL.md` для project-local;
- если файла нет, остановиться с blocker `reusable-agent-system-toolkit не найден по ожидаемому пути`;
- не угадывать путь bootstrap через `~/.codex`, plugins или `node_modules`; sidecar toolkit path берется только из `workspace.json`;
- не создавать `.codex/skills`, `codex-skills`, `docs/agent-system` или fallback-систему без локального bootstrap SKILL.md;
- прочитать `./reusable-agent-system-toolkit/skills/project-agent-bootstrap/SKILL.md`;
- прочитать `MANIFEST.md`, `README.md`;
- прочитать этот `bootstrap-strict-algorithm.md`;
- прочитать `full-project-research.md`, `deep-bootstrap-research.md`, `deep-research-execution-algorithm.md`, `research-working-memory.md`, `research-docs-blueprint.md`, `adversarial-codebase-research.md`, `agent-knowledge-base.md`, `skill-generation-blueprint.md`, `skill-seed-library.md`, `generated-system-validation.md`, `bootstrap-quality-contract.md`, `bootstrap-acceptance-checklist.md`;
- прочитать список `templates/research-forms/*` и `templates/skills/*.full.template.md`;
- запустить `node reusable-agent-system-toolkit/scripts/bootstrap.js init .`;
- написать Skill Ledger;
- проверить branch/status artifact repository; в sidecar режиме также снять immutable source snapshot и выполнить `workspace-verify`.
- спросить путь до `.env` для Jira/Confluence/Git/GitLab/MCP tokens, если путь не подтвержден existing rules;
- объяснить, что `.env` нужен для воспроизводимых helper scripts и MCP/REST access, а secret values не будут печататься или копироваться;
- разрешить ответ `пропустить enterprise`, если пользователь не хочет настраивать интеграции сейчас.

Запрещено:

- создавать `codex-skills/`;
- читать `templates/skills/*`;
- генерировать `AGENTS.md`.
- спрашивать про deep scan до завершения Phase 0.5. Сначала нужно закрыть enterprise setup: pass или skipped.

## Phase 0.5: Enterprise Scaffold And Probes

Обязательные действия, если пользователь дал env path:

- создать `.tmp/`;
- проверить, что в toolkit существуют:
  - `templates/enterprise-scripts/integration-env.template.sh`;
  - `templates/enterprise-scripts/jira-rest.template.sh`;
  - `templates/enterprise-scripts/confluence-rest.template.sh`;
- создать `.tmp/integration-env.sh` из `templates/enterprise-scripts/integration-env.template.sh`;
- создать `.tmp/jira-rest.sh` из `templates/enterprise-scripts/jira-rest.template.sh`;
- создать `.tmp/confluence-rest.sh` из `templates/enterprise-scripts/confluence-rest.template.sh`;
- подставить env path в `.tmp/integration-env.sh`;
- подставить auth modes по умолчанию: `JIRA_AUTH_MODE=as-is`, `CONFLUENCE_AUTH_MODE=as-is`;
- сделать scripts executable;
- проверить наличие required variable names без вывода values:
  - Jira: `JIRA_BASE_URL`, `JIRA_TOKEN`;
  - Confluence: `CONFLUENCE_BASE_URL`, `CONFLUENCE_TOKEN`;
  - Git/GitLab/MCP variables по project/user policy;
- выполнить read-only probes для включенных systems:
  - Jira: `./.tmp/jira-rest.sh /rest/api/2/myself`;
  - Confluence: `./.tmp/confluence-rest.sh /rest/api/user/current`;
- если probe возвращает 401/403 из-за auth format, разрешен install-only fallback по auth modes: `as-is`, `bearer`, `basic`;
- после первого successful probe записать winning auth mode в `.tmp/integration-env.sh`, enterprise docs и generated access skills;
- записать configured method в enterprise docs и generated access skills: helper-only, required variable names, winning auth mode, probe, permissions, fail-fast; абсолютный env path оставить только в ignored `.tmp/integration-env.sh`.

Если probe не проходит:

- остановись и сообщи точную причину: env path missing, variable missing, expired/invalid token, DNS/network blocked, 401/403/404, unexpected response shape;
- если это auth format error, можно попробовать только install-only auth mode fallback из разрешенного списка `as-is`, `bearer`, `basic`;
- не пробуй fallback transport methods: MCP/curl/direct REST/другой helper, если они не являются configured method;
- если пользователь исправил env, повтори тот же configured probe;
- если пользователь написал `пропустить`, пометь integration skipped/unavailable и продолжай без active Jira/Confluence skills.

Если `templates/enterprise-scripts/*` отсутствуют:

- это stale/incomplete toolkit copy, а не проблема целевого проекта;
- остановись с blocker и перечисли missing template files;
- попроси обновить/восстановить toolkit;
- не пытайся вручную сочинять helper scripts;
- не спрашивай deep scan, пока enterprise setup не получил pass или skipped.

Запрещено:

- печатать secret values;
- копировать tokens в docs/skills;
- переключаться на curl/MCP/direct REST вместо helper;
- оставлять несколько runtime auth modes после setup. После success должен остаться один winning auth mode;
- считать enterprise setup готовым без helper files на диске.

## Phase 0.6: Deep Scan Decision

Эта фаза начинается только после Phase 0.5 со статусом `pass` или `skipped`.

Обязательные действия:

- спросить, запускать ли deep scan проекта;
- объяснить, что deep scan нужен для RAG базы, карты проекта, risk register, refactor plan и project-specific senior skills;
- предупредить, что deep scan может занять время и потратить токены;
- если пользователь хочет пропустить deep scan, предупредить: без него не будет полноценной RAG базы, карты проекта и refactor plan, а generated skills будут менее конкретными и более общими;
- продолжать degraded install только после явного подтверждения.

Запрещено:

- спрашивать deep scan одновременно с env path;
- требовать подтверждение deep scan, если enterprise setup еще заблокирован;
- продолжать full bootstrap без явного решения пользователя по deep scan.

## Phase 1: Existing Rules Merge

Обязательные действия:

- найти existing agent rules: `AGENTS.md`, `.codex`, `codex-skills`, `.cursor`, `.claude`, `CLAUDE.md`, `.github/copilot-instructions.md`, docs с local rules;
- запустить `existing-rules-merge`;
- составить local skills inventory для `codex-skills/skills/*`, `.codex/skills/*` и других agent surfaces;
- составить authority matrix: trigger/mode/layer -> authoritative source -> generated behavior;
- зафиксировать merge result в `docs/agent-system/existing-rules-merge.md` или выбранном docs path.

Выход из фазы:

- known existing rules перечислены;
- existing local skills перечислены с authority и decision;
- generated behavior для каждого конфликтующего trigger/mode/layer определен;
- conflicts/gaps записаны.
- unresolved conflicts по router/mode/enterprise/review/commit authority отсутствуют или bootstrap остановлен.

Запрещено:

- переходить к discovery/docs/skills без authority matrix, если local skills/rules найдены;
- перезаписывать existing local skills;
- создавать generated skill с тем же name/path без explicit merge decision;
- генерировать router, который игнорирует authoritative local skills.

## Phase 2: Full Discovery

Обязательные действия:

- запустить `project-discovery`;
- прочитать stack/runtime manifests;
- прочитать package/dependency manifests and lockfiles;
- определить source roots, entry points, modules/domains, commands, tests, CI/deploy, enterprise evidence;
- собрать preliminary critical flows.
- учесть результат Phase 0.5: configured helper-only enterprise methods или skipped/unavailable gaps.

Запрещено:

- писать финальные docs/RAG/skills;
- читать `templates/skills/*`;
- объявлять discovery как research complete.

Выход из фазы:

- discovery evidence покрывает stack, commands, source roots, entry points, modules, tests/CI/deploy.

## Phase 3: Full Research-Code-Review

Обязательные действия:

- создать `docs/agent-system/research-workspace/` по `research-working-memory.md`;
- создать `docs/agent-system/research-workspace/forms/`;
- запустить `node reusable-agent-system-toolkit/scripts/bootstrap.js create-model .`;
- запустить `node reusable-agent-system-toolkit/scripts/bootstrap.js create-research .`; task graph строится из modules, entry points и capabilities canonical project model;
- закрывать research через `docs/agent-system/research-workspace/research-tasks.json`: каждая task получает `complete`, `not-applicable` с evidence или blocker/gap;
- заполнить research forms из `templates/research-forms/*`;
- создать и вести `research-plan.md`, `research-notes.md`, `evidence-log.md`, `error-log.md`, `decisions.md`;
- перечитывать `research-plan.md` перед major phase transitions;
- записывать в `evidence-log.md` concrete evidence по каждому research pass;
- записывать в `error-log.md` сбои чтения, команд, probes, blocked checks и переносить их в gaps/current-state;
- запустить `deep-project-audit` в scope = весь проект;
- выполнить `deep-research-execution-algorithm.md` как основной маршрут research;
- выполнить matrix из `full-project-research.md`;
- выполнить adversarial protocol из `adversarial-codebase-research.md`;
- выполнить layer classification по применимым слоям проекта;
- выполнить defect hunt matrix по применимым defect classes;
- проверить architecture, data-flow, dependencies/libraries, security, performance, testing/CI, code quality, domain risks;
- проверить performance/resource leaks с concrete evidence или explicit gaps;
- trace critical flows цепочками `entry -> state/service/composable -> repository/server route -> DTO/API/persistence/external system -> error/auth/cache behavior`;
- отделить confirmed findings, hypotheses и gaps.
- собрать пакет привязок для skills: проектные привязки, локальные антипаттерны, подсказки поиска source, commands/checks, risk/refactor links.
- сохранить skill payload в research forms: какие project hooks должны попасть в code-review, debugging, refactor, stack/domain skills.

Запрещено:

- переходить к docs/skills на основе samples/tree/file counts;
- генерировать skills;
- читать `templates/skills/*`.

Выход из фазы:

- full research evidence есть;
- `research-tasks.json` существует и все tasks закрыты как `complete` или `not-applicable` с evidence/gap;
- research forms заполнены project evidence;
- layer classification есть;
- defect hunt matrix есть;
- dependency/library review есть;
- security/performance/testing review есть;
- resource leak review есть или gaps явно записаны;
- critical flows traced;
- gaps не блокируют построение RAG.
- есть material для generated skills: проектные привязки, локальные антипаттерны, подсказки поиска source и checks by blast radius.
- файлы рабочей памяти существуют и содержат evidence/errors/decisions, если deep scan включен.

## Phase 4: Research Documentation

Обязательные действия:

- загрузить `project-docs-generator`;
- прочитать файлы рабочей памяти из `docs/agent-system/research-workspace/`;
- прочитать заполненные forms из `docs/agent-system/research-workspace/forms/`;
- прочитать `research-docs-blueprint.md`;
- загрузить docs templates, включая `full-project-research-report.template.md`;
- создать или обновить docs path;
- создать `full-project-research-report.md`;
- создать `research-evidence-pack.md`;
- создать `risk-register.md`;
- создать инженерный `refactor-plan.md` с phases, safe slices, evidence, checks и success criteria;
- создать `smoke-checklist.md`;
- создать `current-state.md` и `research-worklog.md`;

Запрещено:

- читать `templates/skills/*`;
- создавать `codex-skills/skills/*`;
- писать `AGENTS.md`.

Выход из фазы:

- required docs существуют на диске и не пустые;
- `full-project-research-report.md` на русском и содержит stack, architecture, data-flow, dependency/library review, security, performance, testing/CI, findings, gaps, refactor recommendations;
- `full-project-research-report.md` содержит layer classification и defect hunt matrix;
- `research-evidence-pack.md` содержит defect classes, checked evidence paths, findings, gaps и coverage по применимым слоям;
- `refactor-plan.md` содержит контекст, оценку, риски, принципы, phases/slices, examples, checks.
- full report и evidence pack не являются коротким конспектом: они сохраняют module inventory, hot spots, critical flow traces, boundary/contract review, dependency usage evidence и tests/CI evidence.
- `research-worklog.md` ссылается на workspace evidence и переносит ошибки/gaps из `error-log.md`.

## Phase 5: RAG Base And Maps

Обязательные действия:

- создать `knowledge-base.md`;
- создать `knowledge-index.md`;
- создать `project-map.md`;
- создать `architecture-map.md`;
- создать `stack-profile.md`;
- связать RAG с `full-project-research-report.md` и `research-evidence-pack.md`.
- записать пакет привязок для skills в RAG: где искать source, какие локальные антипаттерны не копировать, какие preferred patterns использовать, какие risks/refactor items учитывать.

Выход из фазы `Docs/RAG Ready`:

Все файлы существуют и имеют project-specific content:

```text
full-project-research-report.md
research-evidence-pack.md
knowledge-base.md
knowledge-index.md
project-map.md
architecture-map.md
risk-register.md
refactor-plan.md
smoke-checklist.md
stack-profile.md
current-state.md
research-worklog.md
```

Если хотя бы одного файла нет, он пустой или generic, остановись. Не переходи к skills.

## Phase 6: Stack Standards

Обязательные действия:

- выполнить выбор seeds по `skill-seed-library.md` и `skill-seeds/manifest.json`;
- если подключены external libraries, прочитать external manifest/index до выбора external seeds;
- разделить seeds на `selected`, `recommended`, `skipped`;
- подтвердить selected seeds через dependency/path/stack/RAG evidence;
- записать выбор seeds в `stack-profile.md`, `knowledge-index.md` или bootstrap summary;
- запустить `stack-engineering-standards`;
- строить standards только из `stack-profile.md`, RAG, research report и selected seeds;
- записать stack-quality implications для future skills.

Запрещено:

- генерировать stack skills без RAG.
- копировать seed в final standard без адаптации к проекту.
- выбирать stack seed без dependency/path/stack evidence.
- читать все external `SKILL.md` подряд вместо отбора через index/manifest.

## Phase 7: Skills Assembly

Эта фаза начинается только после `Docs/RAG Ready`.

Перед любым чтением `templates/skills/*` или `generated-skill-catalog.md` проверь artifact gate: перечисли required docs и убедись, что они существуют. Если нет - остановись и вернись к Phase 4/5.

Если перед Phase 7 был context compaction, interruption или resume, сначала перечитай `project-skills-assembler/SKILL.md`, `docs/agent-system/bootstrap-state.json`, `docs/agent-system/skill-inputs/index.json` если он существует, и этот раздел. Продолжать skills assembly по памяти запрещено.

Нулевое правило фазы: full-install quality/stack/domain skills не пишутся и не генерируются руками. Агент заполняет structured inputs, toolkit компилирует markdown. Для каждого skill допустим только один путь:

```text
project-model + seed-selection -> target skill -> docs/agent-system/skill-inputs/<skill-name>.json -> extract-seed-playbooks.js -> render-skills.js -> skill-registry.json -> render-operational-skills.js -> router
```

Финальный `SKILL.md` создается только скриптом `render-skills.js`.

Обязательные действия:

- запустить `project-skills-assembler`;
- прочитать `skill-generation-blueprint.md`;
- прочитать `skill-seed-library.md` и результат выбора seeds;
- first-read для generated skills: `knowledge-base.md` -> `knowledge-index.md` -> scoped docs/source;
- после full skill render запустить `node reusable-agent-system-toolkit/scripts/bootstrap.js render-operational .`; operational skills и router собираются из фактического registry;
- `render-operational` в том же детерминированном шаге создает или обновляет managed-блок корневого `AGENTS.md`; entrypoint не откладывается на ручную генерацию;
- корневой `AGENTS.md` обязан направлять любую новую задачу в `codex-skills/skills/workflow-router/SKILL.md` до чтения source и первого repo/browser/network/auth/git action, независимо от системного списка `Available skills`;
- запустить `node reusable-agent-system-toolkit/scripts/create-skill-inputs.js .`;
- запустить `node reusable-agent-system-toolkit/scripts/extract-seed-playbooks.js .` после создания inputs;
- заполнить каждый `docs/agent-system/skill-inputs/<skill-name>.json` как `schemaVersion: 2` project-specific playbook form и поставить `status: "ready"`;
- для каждого selected seed использовать уже созданный `docs/agent-system/seed-extractions/<skill-name>.json` и адаптировать `seedExtractions[]`: `seedId`, `sourcePath`, `sectionsUsed`, `rulesTaken`, `rulesRejected`, `projectAdaptation`; не писать seed extraction общими словами;
- собрать skills только командой `node reusable-agent-system-toolkit/scripts/render-skills.js . <skill-name>` для каждого skill или общей командой после заполнения всех inputs;
- для каждого selected quality/stack/domain skill structured input должен содержать typed objects: `seedExtractions`, `ragRoutes`, `projectHooks`, `criticalFlows`, `localRisks`, `workflowSteps`, `layerChecks`, `gates`, `stopConditions`, `resultFormat`;
- не создавать grouped assembly files вроде `stack-skills.md`, `stack-and-domain.md`, `quality-skills.md` или `all-skills.md`; stack/domain skills собираются отдельными файлами;
- для selected external seed прочитать его `SKILL.md` и только нужные bundled resources;
- сгенерировать обязательные quality playbooks: `code-review-and-quality`, `debugging-and-error-recovery`, `refactor-engineering`;
- собрать stack/domain skills через render соответствующего `.full.template.md`, а не свободным summary: triggers, RAG route, seed adaptation, project context, risks, workflow, checks, gates, stop conditions, result format;
- создать `codex-skills/references` как operational support для skills: playbooks, retrieval hints, local patterns, project examples, commands/checks;
- language marker scan обязателен.
- language marker scan должен быть настоящей `rg` command из `generated-system-validation.md`; placeholder вместо команды запрещен.
- deterministic validator обязателен: `node reusable-agent-system-toolkit/scripts/validate-generated-agent-system.js .`.
- build pipeline check обязателен: `node reusable-agent-system-toolkit/scripts/check-bootstrap-state.js .`.
- создать вычисляемый report командой `node reusable-agent-system-toolkit/scripts/bootstrap.js quality-report .`: skill assembly discipline и skill senior quality должны быть `10/10`.

Цикл сборки skill:

1. Заполни `docs/agent-system/skill-inputs/<skill-name>.json`.
2. Убедись, что это v2 input: `seedExtractions` и ключевые секции являются объектами с source/evidence/action/output, а не строками.
3. Не создавай `SKILL.md` вручную.
4. Запусти `render-skills.js . <skill-name>`.
5. Если renderer вернул missing fields, дополни JSON и повтори.
6. Проверь generated `SKILL.md` как compiled artifact.

Выход из фазы:

- quality playbooks существуют и являются заполненными full templates с workflow, gates, stop conditions, checks и result format;
- quality/stack skills указывают selected seeds или причину неприменимости seed;
- для каждого full-install quality/stack/domain skill существует adaptation sheet в `docs/agent-system/skill-assembly/`;
- для каждого full-install quality/stack/domain skill существует structured input в `docs/agent-system/skill-inputs/`;
- для каждого generated role skill существует matching assembly sheet с тем же basename: `docs/agent-system/skill-assembly/<skill-name>.md`;
- каждый assembly sheet содержит `Render Source Matrix` и не менее 10 `Section Render` blocks;
- quality playbooks покрывают обязательные роли из `skill-generation-blueprint.md`: `Не использовать когда`, `Быстрый Маршрут По RAG`, seed adaptation, project context, `Проектные Привязки`, `Локальные Антипаттерны И Риски`, `Проверки По Слою`;
- stack skills адаптированы к real stack и risks из RAG;
- UI skill, если применим, задает production UI bar: accessibility, responsive, visual polish, design system, state boundaries, browser/runtime guards;
- backend skill, если применим, задает production backend bar: validation, auth/authz, transactions, idempotency, safe errors, observability;
- references добавляют skill-specific examples/patterns/retrieval hints and не копируют docs.
- stack/domain skills имеют проверяемую seed adaptation trace и project-specific роли, а не generic wrappers.
- финальный `SKILL.md` является clean render одного target full template, а не кратким custom skill с приклеенными template sections;
- deterministic validator прошел и его вывод записан в validation report.
- `bootstrap-quality-report.md` показывает `10/10` для skill assembly discipline и skill senior quality.

Запрещено:

- читать `templates/skills/*` до artifact gate;
- создавать generic skills из catalog без project evidence;
- создавать English служебные headings/instructions.
- генерировать full-install quality/stack skills без результата выбора seeds;
- копировать seed как final skill;
- писать `SKILL.md` с нуля без full template и adaptation sheet;
- писать краткий custom skill перед render target full template;
- использовать один grouped assembly sheet для нескольких stack skills;
- создавать compact assembly summary вместо `skill-adaptation-sheet.template.md`;
- оставлять в rendered skill cross-reference placeholders вместо текста секции;
- генерировать project-local skill для каждого external seed без stack/domain отбора;
- считать skill готовым, если он состоит только из обязательных чтений, пяти bullets и формата результата;
- считать skill готовым, если seed только указан названием, но не разобран и не адаптирован через project evidence;
- считать validation clean, если language scan command была placeholder или не запускалась;
- считать validation clean, если deterministic validator не запускался или упал;
- писать stack/domain skill как generic wrapper без triggers, RAG route, seed adaptation, project context, risks, workflow, checks, gates и result format;
- писать quality skill как краткое резюме template без project evidence;
- генерировать senior playbook без `Проектные Привязки` и `Локальные Антипаттерны И Риски`;
- пропускать `codex-skills/references` в full install;
- копировать `docs/agent-system/*` в `codex-skills/references/*` под другим именем;
- генерировать code-review/debug/refactor behavior только внутри `review-checklist` без отдельных playbooks.

## Phase 8: Validation

Обязательные действия:

- запустить `generated-system-validation`;
- заполнить или обновить `docs/agent-system/bootstrap-quality-report.md`;
- проверить `bootstrap-quality-report.md` по `bootstrap-quality-contract.md`: full install успешен только если каждая категория `10/10`;
- запустить `bootstrap-acceptance-checklist`;
- проверить language marker scan;
- проверить no surrogate coverage;
- проверить layer classification и defect hunt matrix;
- проверить security/performance/resource leak evidence;
- проверить, что skills ссылаются на RAG и research docs.
- проверить quality playbook depth.
- проверить, что skill references не дублируют docs.
- проверить, что enterprise helpers созданы, executable и отражены в access-policy skills, если enterprise setup включен.
- проверить degraded install marker, если deep scan был пропущен.

Запрещено:

- писать `validation passed` как итог full install, если `bootstrap-quality-report.md` отсутствует или любая категория ниже `10/10`;
- принимать `9/10` как успех. Это repair required.

## Phase 9: Repository Hygiene

Обязательные действия в project-local режиме:

- добавить `reusable-agent-system-toolkit/` в `.gitignore`, если строки еще нет;
- проверить staged files;
- если `reusable-agent-system-toolkit/` staged, выполнить non-destructive unstage только этой папки: `git restore --staged reusable-agent-system-toolkit/`;
- убедиться, что toolkit folder не попадет в commit целевого проекта.

Обязательные действия в sidecar режиме:

- выполнить `workspace-verify` и убедиться, что snapshot всех customer-code репозиториев не изменился;
- выполнить `commit-plan`: docs, RAG, skills и agent runtime разрешены только в artifact repository;
- проверить, что ни один customer-code репозиторий не содержит новых `AGENTS.md`, `.agents`, `.codex`, `codex-skills`, `docs/agent-system` или toolkit paths;
- проверить SSH remote artifact repository и задокументировать `git pull --ff-only` как единственный transport автоматической синхронизации;
- не добавлять toolkit или agent-system paths в `.gitignore` customer-code репозиториев, потому что эти пути там вообще не создаются.

Запрещено:

- удалять `reusable-agent-system-toolkit/` с диска;
- выполнять broad reset/checkout;
- менять unrelated staged files;
- использовать `git add -A` как часть cleanup.

## Нарушения Алгоритма

Считай bootstrap failed и остановись, если:

- агент прочитал `templates/skills/*` до `Docs/RAG Ready`;
- создан `codex-skills/skills/*` до full research report/RAG/refactor plan;
- нет `full-project-research-report.md`;
- нет `knowledge-base.md` или `knowledge-index.md`;
- нет инженерного `refactor-plan.md` с evidence, slices и checks;
- research основан на samples/tree/file counts;
- deep scan заявлен, но workspace рабочей памяти не создан или `evidence-log.md` пустой;
- skills написаны до карты проекта/RAG;
- skills написаны без `docs/agent-system/skill-assembly/<skill-name>.md`;
- `bootstrap-quality-report.md` отсутствует, не заполнен или содержит score ниже `10/10` при full install;
- generated docs/skills не на русском языке.
- enterprise setup включен, но `.tmp/integration-env.sh`, `.tmp/jira-rest.sh`, `.tmp/confluence-rest.sh` не созданы;
- deep scan пропущен, но bootstrap выдает RAG/project map/refactor plan как готовые.
- project-local: `reusable-agent-system-toolkit/` staged или не добавлен в `.gitignore`; sidecar: `workspace-verify`/`commit-plan` не прошли либо найден agent artifact в customer-code репозитории.
- local skills/rules найдены, но нет `existing-rules-merge.md` с inventory и authority matrix;
- generated router/skills игнорируют authoritative local skills.

## Формат Отчета О Фазах

В финале bootstrap обязательно покажи:

```markdown
Bootstrap phases:
- Phase 0 Install Wizard: pass/fail
- Phase 0.5 Enterprise Scaffold And Probes: pass/fail/skipped
- Phase 0.6 Deep Scan Decision: full/degraded/fail
- Phase 1 Existing Rules Merge: pass/fail
- Phase 2 Full Discovery: pass/fail
- Phase 3 Full Research-Code-Review: pass/fail
- Phase 4 Research Documentation: pass/fail
- Phase 5 RAG Base And Maps: pass/fail
- Phase 6 Stack Standards: pass/fail
- Phase 7 Skills Generation: pass/fail
- Phase 8 Validation: pass/fail
- Phase 9 Repository Hygiene: pass/fail
- Algorithm violations: none/list
```
