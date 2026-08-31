# Generated System Validation

Используй этот reference после `project-skills-assembler` и перед final bootstrap result.

Цель - проверить, что generated project-local agent system реально воспроизводима, а не выглядит готовой только на словах.

## Required Files

Проверь наличие:

- active entry file: `AGENTS.md` или project-specific equivalent;
- active skills path;
- `workflow-router/SKILL.md`;
- core skills: `general`, `project-authority`, `pre-change-checklist`, `review-checklist`, `evidence-pack`, `semantic-commit-flow`;
- quality playbooks: `code-review-and-quality`, `debugging-and-error-recovery`, `refactor-engineering`;
- mode skills: development, refactor, research, review, merge, summary, small scoped change;
- stack-quality skills по stack profile;
- enterprise skills, если включены Jira/Confluence/Git/GitLab;
- enterprise helper scripts `.tmp/integration-env.sh`, `.tmp/jira-rest.sh`, `.tmp/confluence-rest.sh`, если включены Jira/Confluence helper integrations;
- docs artifacts: full project research report, research evidence pack, knowledge base, knowledge index, project map, overview, architecture map, risk register, refactor plan, smoke checklist, stack profile, current state/worklog.
- artifacts рабочей памяти для полного deep scan: `docs/agent-system/research-workspace/research-plan.md`, `research-notes.md`, `evidence-log.md`, `error-log.md`, `decisions.md`.
- existing rules merge artifact with local skills inventory and authority matrix, if existing rules/local skills were found.
- результат выбора seeds: `selected`, `recommended`, `skipped` с evidence и target generated skills/references.
- external seed library artifacts, если library подключена: manifest/index/folder для каждой записи из `skill-seeds/manifest.json.externalLibraries`.
- project-local: `.gitignore` entry for `reusable-agent-system-toolkit/`; sidecar: passed `source-boundary-result.json` and generated `bin/agentctl.js`.

## Skill Frontmatter Validation

Каждый generated `SKILL.md` должен иметь:

```yaml
---
name: skill-name
description: точное предложение с trigger-ами
---
```

Проверь:

- `name` совпадает с folder name;
- `description` объясняет, когда skill использовать;
- нет пустых placeholder-ов;
- нет чужих project names/paths из примеров;
- skill не дублирует authority другого skill.

## Language Validation

Generated skills/docs должны быть на русском языке.

Допустимые исключения:

- file paths;
- commands/scripts;
- env vars;
- framework/library/API names;
- HTTP/Git/Jira/Confluence terms;
- code identifiers.

Проверь:

- overview/workflow/gates/stop conditions написаны по-русски;
- нет длинных англоязычных prose sections;
- templates не оставили English labels вроде `Purpose`, `Workflow`, `Required Reads`, `First Reads`, `Stop Conditions`, `Default Scope`, `Rules`, `Checks`, `Result`, если проект не требует английский;
- final generated system не смешивает язык без причины.
- если generated skill/doc содержит в основном английский prose при русском project/toolkit policy, validation result = fail.

Approved Russian headings для generated skills:

- `## Обзор`
- `## Обязательные Чтения`
- `## Читать Сначала`
- `## Когда использовать`
- `## Не использовать когда`
- `## Быстрый Маршрут По RAG`
- `## Карта Контекста Проекта`
- `## Проектные Привязки`
- `## Локальные Антипаттерны И Риски`
- `## Порядок работы`
- `## Контрольные gates`
- `## Правила`
- `## Проверки`
- `## Проверки По Слою`
- `## Условия остановки`
- `## Формат результата`
- `## Режимы`
- `## Конфигурация`

Запусти language marker scan по generated docs/skills. Любое совпадение в prose/heading/instruction = validation fail, кроме code blocks, tables с техническими именами и явно допустимых API/framework terms.

Нельзя записывать placeholder вроде `<bootstrap language marker pattern>` вместо реальной команды. В validation report обязательно вставь фактически выполненную команду и количество найденных совпадений.

Перед ручным summary обязательно запусти deterministic validator:

```bash
node reusable-agent-system-toolkit/scripts/validate-generated-agent-system.js .
```

Если validator вернул ошибки, generated system не готова. Исправь указанные files и повтори команду. Эта команда проверяет не только headings, но и частые английские runtime-инструкции, которые легко пропустить обычным `rg`: `Stop feature work`, `Review correctness`, `Gates`, `Components`, `Expected result`, `Root cause`, `Fix` и похожие маркеры.

Минимальная команда:

```bash
rg -n '## Required Reads|## First Reads|## Workflow|## Stop Conditions|## Default Scope|## Rules|## Checks|## Result|## Purpose|## Inputs|## Outputs|Do not|Read only|Read touched|Load:|Stop if|Use for|Evidence-based|Mandatory gate|Project-specific authority|Main dispatcher|Commit/publish flow|Identify |Define |Preserve |Avoid |Keep |Check |No new |No secret |No cache |No raw |Areas reviewed|Action:|Trace:|Gaps:|When |For |Findings|Suggestions|Scope:|Evidence:|Validation:|Enterprise integrations|Source evidence|automated tests|manual smoke|affected page|source trust|sanitization|boundary|risk|checks|run `| and | or ' AGENTS.md codex-skills docs/agent-system
```

Если команда вернула строки в generated skills/docs, validation result = fail. Исправь файлы на русский и повтори scan. Разрешенные technical terms должны быть единичными именами технологий/API, а не английскими инструкциями.

```text
## Required Reads
## First Reads
## Workflow
## Stop Conditions
## Default Scope
## Rules
## Checks
## Result
## Purpose
## Inputs
## Outputs
Do not
Read only
Read touched
Load:
Stop if
Use for
Evidence-based
Mandatory gate
Project-specific authority
Main dispatcher
Commit/publish flow
Identify 
Define 
Preserve 
Avoid 
Keep 
Check 
No new 
No secret 
No cache 
No raw 
Areas reviewed
Action:
Trace:
Gaps:
```

Если scan находит такие маркеры, не пиши `validation clean`: исправь generated files на русский или остановись с `Language validation failed`.

Дополнительно проверь выборочно 3-5 generated `SKILL.md`: если `Порядок работы`, `Контрольные gates`, `Проверки` или `Формат результата` содержат английские предложения вместо русских инструкций, validation result = fail даже при чистом marker scan.

Validation report fail markers:

- `Language marker scan: no matches` без настоящей команды и вывода scan.
- Отсутствует вывод `node reusable-agent-system-toolkit/scripts/validate-generated-agent-system.js .`.
- Validator упал, но report всё равно пишет `pass`.
- В report написана команда с placeholder.
- Scan выполнен только по docs, но не по `AGENTS.md` и `codex-skills`.
- Scan пропустил prose-маркеры вида `When touching`, `For new`, `Findings must`, `Run checks`, `No automated tests`.

## Router Validation

`workflow-router` должен явно маршрутизировать:

- `ресерч` / `research` -> Research mode;
- `рефактор` -> Refactor mode;
- `ревью` / `review` / `проверь` -> Review mode;
- `мерже` / `merge` / sync branch -> Merge mode;
- Jira/issue key -> Development/Jira mode, если project config поддерживает tracker;
- commit/push -> publish/merge flow.
- authoritative existing local skills from `existing-rules-merge.md`.

Research validation:

- default scope = весь проект;
- router не требует серию уточнений;
- research требует docs artifacts, если docs отсутствуют;
- shallow stack summary запрещен.

Knowledge base validation:

- router/core skills first-read `knowledge-base.md` and `knowledge-index.md`;
- knowledge index maps major task types to docs/skills/checks;
- knowledge index maps major task types to source/source code areas, not only docs;
- knowledge index covers feature, UI, backend/API, database/migration, auth/security, performance, dependencies, research, refactor, enterprise task, merge/publish or marks non-applicable layers with evidence;
- knowledge base contains entry points, critical flows, high-risk areas, dependency watchlist, commands, retrieval rules and gaps;
- generated skills do not force full rediscovery for ordinary tasks;
- stale/missing knowledge base has a gap/blocker path.

## Stack Quality Validation

Generated quality skills должны быть project-specific senior playbooks. Валидация идет по покрытию ролей и seed adaptation trace, а не по количеству строк.

Для full install каждый quality/stack/domain skill должен быть собран по `seed-adapted-skill.template.md` или concrete template с теми же ролями. Роль считается покрытой только если в ней есть проектное evidence, а не общий текст.

Seed validation для full install:

- `skill-seeds/manifest.json` был прочитан после `Docs/RAG Ready`;
- если `skill-seeds/manifest.json` содержит external libraries, external manifest/index были прочитаны до выбора external seed;
- результат выбора seeds сохранен в `stack-profile.md`, `knowledge-index.md` или bootstrap summary;
- каждый selected seed имеет evidence: dependency, config/source path, stack profile или `alwaysForFullInstall=true`;
- `architecture-code-review` и `architecture-refactor` selected или явно delegated to authoritative local skills;
- stack seeds (`react-ui-quality`, `nextjs`, `tailwind`, `nestjs`, `msw`, `zod`, `capacitor`) selected только при concrete project evidence;
- external seeds selected только по manifest/index evidence и project stack/domain evidence;
- generated quality/stack skills указывают, какие seeds использованы, или почему seed skipped;
- selected seed адаптирован через RAG: project paths, critical flows, risks/refactor items, local patterns, checks;
- seed не скопирован как final `SKILL.md` без project-specific sections.
- для каждого full-install quality/stack/domain skill есть `Seed Adaptation Matrix` в docs/bootstrap summary или краткий trace в самом skill;
- trace показывает: seed source, почему выбран, какие seed sections/ideas взяты, какие project evidence использованы, что отброшено и почему.

Validation fail:

- выбор seeds отсутствует;
- seed выбран только по догадке или названию папки;
- external library загружалась вся подряд вместо progressive disclosure через index/manifest;
- selected seed не связан с generated target;
- final skill переносим в любой другой проект без потери смысла;
- final skill повторяет seed structure без `Проектные Привязки` и `Локальные Антипаттерны И Риски`;
- final skill говорит "использован seed", но не показывает adaptation trace;
- generated skill содержит англоязычные runtime instructions из внешней seed библиотеки.

Обязательные quality playbooks:

- `code-review-and-quality`;
- `debugging-and-error-recovery`;
- `refactor-engineering`.

Проверь каждый из них:

- есть `Когда использовать`;
- есть `Не использовать когда`;
- есть RAG/source first-read policy;
- есть `Быстрый Маршрут По RAG`;
- есть `Использованные Seeds` или ссылка на `Seed Adaptation Matrix`;
- есть `Карта Контекста Проекта`;
- есть `Проектные Привязки` с реальными source paths/flows/commands/risk IDs;
- есть `Локальные Антипаттерны И Риски`;
- есть самостоятельный workflow, а не только ссылки на docs;
- есть quality gates;
- есть `Проверки По Слою`;
- есть stop conditions;
- есть формат результата;
- есть проектные привязки: local rules, risk/refactor docs, stack/domain routing;
- есть instruction исправлять unsafe/fragile code в touched area или записывать risk/refactor gap.

Validation fail:

- skill состоит только из общих bullets без project evidence;
- skill только перечисляет обязательные чтения и формат результата;
- skill не содержит одну из ролей: `Когда использовать`, `Не использовать когда`, `Быстрый Маршрут По RAG`, `Использованные Seeds`, `Проектные Привязки` или `Карта Контекста Проекта`, `Локальные Антипаттерны И Риски`, `Порядок работы`, `Проверки`, `Условия остановки`, `Формат результата`;
- skill не объясняет, как принимать инженерные решения;
- skill не содержит severity/triage/refactor protocol для своей области;
- skill generic настолько, что его можно перенести в любой проект без потери смысла.
- skill не ссылается на skill-specific reference из `codex-skills/references`.
- full install не создал operational references для quality/stack skills.

Для каждого touched layer должны существовать gates:

- frontend UI -> UI/accessibility/state/responsive/visual QA;
- frontend state/data -> server data vs draft/UI/derived state, stale response, cleanup;
- backend/API -> validation, auth, transactions, idempotency, errors;
- database -> migrations, constraints, indexes, rollback/compatibility;
- testing -> checks by blast radius;
- security/performance -> secrets, permissions, injection, logging, hot paths.

Generated skills должны говорить: unsafe/fragile code в зоне задачи нужно исправить в scope, записать risk/refactor gap или остановиться с blocker.

Для `frontend-ui-engineering` дополнительно проверь:

- skill задает production UI bar: accessibility, responsive, visual polish, design system, state boundaries, performance;
- есть запрет на generic AI-looking UI;
- есть keyboard/focus/accessibility gates;
- есть loading/empty/error/disabled/success/permission states;
- есть responsive visual QA на project breakpoints или 320/768/1024/1440;
- есть browser/runtime guard для SSR/client-only APIs, если stack это требует.
- skill покрывает роли: triggers, RAG route, seed adaptation, project UI context, local risks, quality bar, workflow, layer checks, gates, stop conditions и result format. Краткий текст допустим только как clean render target full template, если каждая роль заранее заполнена в per-skill assembly sheet.

Для `backend-engineering` дополнительно проверь:

- skill задает production backend bar: validation, auth/authz, transactions, idempotency, observability, safe errors;
- есть data integrity и concurrency gates;
- есть contract compatibility и migration checks;
- есть testing by blast radius.
- skill покрывает роли: triggers, RAG route, seed adaptation, project backend context, local risks, quality bar, workflow, layer checks, gates, stop conditions и result format. Краткий текст допустим только как clean render target full template, если каждая роль заранее заполнена в per-skill assembly sheet.

Для всех stack/domain skills full install:

- generic wrappers around docs fail validation;
- обязательны sections из `stack-quality.template.md`, если слой применим;
- обязательны selected seeds или причина неприменимости;
- обязательна seed adaptation matrix или краткий trace адаптации в skill;
- обязательны минимум один skill-specific reference и конкретные RAG/source paths;
- если skill можно описать как “прочитай RAG и проверь bullets”, validation fail.

## Валидация Skill References

`codex-skills/references/*` не должны быть копией `docs/agent-system/*`.

В full install ожидаемые operational references:

- `code-review-playbook.md`;
- `debugging-playbook.md`;
- `refactor-playbook.md`;
- `testing-playbook.md`;
- `security-performance-playbook.md`;
- `frontend-ui-playbook.md`, если проект имеет UI;
- `backend-api-playbook.md`, если проект имеет backend/API;
- `data-safety-playbook.md`, если проект имеет database/persistence.

Проверь:

- docs содержат project research/RAG/source of truth;
- skill references содержат operational support для конкретного skill: локальные patterns, examples, command recipes, retrieval hints, stack gotchas, проверочные сценарии;
- каждый reference содержит `Назначение`, `Читать когда`, `Подсказки Поиска Source`, `Проектные Примеры`, `Известные Плохие Patterns`, `Предпочтительные Локальные Patterns`, `Команды И Проверки`, `Связанные risks/refactor items`;
- если reference просто повторяет project map/risk register/stack profile другими словами, его нужно удалить и заменить ссылкой на source doc;
- если skill нуждается в деталях, reference должен добавлять новую прикладную ценность, а не дублировать docs contract.

Validation fail:

- одинаковые headings/sections между `docs/agent-system` и `codex-skills/references` без новой роли;
- reference содержит те же списки risks/flows/dependencies, что docs, но без skill-specific usage;
- generated skills ссылаются на references, которые ничего не добавляют к RAG;
- references существуют только для того, чтобы заполнить каталог.

## Docs Validation

Docs должны быть evidence-based:

- full project research report существует, написан на русском и покрывает stack, architecture, data-flow, dependency/library review, security, performance, testing/CI, findings/gaps и refactor recommendations;
- full project research report является полноценным инженерным отчетом, а не коротким summary: содержит module inventory, hot spots, boundary/contract review, source examples, recommendations and checks;
- full project research report содержит layer classification и defect hunt matrix по применимым слоям;
- research выполняет `deep-research-execution-algorithm`: module inventory, hot spots, critical flow traces, boundary/contract review, defect hunts, dependency usage review, tests/CI review;
- research использует рабочую память: план research, заметки, журнал evidence, журнал ошибок и decisions существуют и отражены в финальных docs;
- research/docs дают пакет привязок для skills: проектные привязки, локальные антипаттерны, подсказки поиска source, commands/checks и risk/refactor links;
- research evidence pack содержит layer classification, defect hunt matrix и coverage result по defect classes;
- research evidence pack содержит подробные evidence tables: source modules, hot spots, entry points, critical flows, contracts, boundary review, dependency usage, commands/CI;
- risk register содержит не только список ID, но и actionable recommendation/status по каждому risk;
- smoke checklist содержит конкретные flows, setup/action/expected/evidence, а не generic checklist;
- knowledge index покрывает major task types и указывает skills/checks;
- research evidence pack содержит coverage/depth result;
- coverage/depth result passed перед созданием финальные docs/skills;
- research evidence pack не засчитывает `sampled`, `reviewed by tree`, `file list`, `rg output`, `enough to generate` или похожие surrogate формулировки как `pass`;
- critical flows имеют trace chains: entry -> state/service/composable -> repository/server route -> DTO/schema/API/persistence/external system -> error/auth/cache behavior;
- каждый `pass` в source modules/entry points/data contracts имеет concrete files/functions/commands/docs, а не только counts;
- project map содержит entry points, modules, critical flows, data contracts, shared high-risk areas;
- knowledge base содержит compact startup context and retrieval rules;
- knowledge index содержит topic -> read first -> skills -> checks;
- risk register содержит severity, evidence, trigger/condition, affected flow/area, impact, recommendation, owner/skill, required checks и status;
- risk register separates confirmed risks from hypotheses/gaps;
- dependency/library review содержит manifest/lockfile evidence, usage evidence, audit freshness, heavy/rare/security-sensitive candidates и replacement decisions;
- security review содержит trust boundaries, sensitive flows и concrete evidence либо explicit gaps;
- performance/resource review содержит проверенные classes: unbounded operations, hot paths, caches/global state и применимые resource leaks;
- refactor plan содержит инженерную структуру: контекст, верхнеуровневую оценку, главные риски, принципы, phased plan/slices, критерии успеха, examples и checks;
- smoke checklist содержит static/runtime/browser/API checks;
- stack profile содержит commands и generated standards needed;
- enterprise integrations не содержат secrets и имеют fail-fast policy.
- existing-rules-merge содержит inventory local skills/rules, authority matrix, merge decisions и unresolved conflicts.

## Existing Local Skills Validation

Если target repo already had local skills/rules:

- existing local skills are inventoried by name/path/description/authority;
- generated skills do not overwrite same paths without explicit merge decision;
- generated router routes to authoritative local skills or documents adapter behavior;
- project-authority preserves project/team-specific rules;
- unresolved authority conflicts block pass;
- existing references used by local skills remain reachable.

Validation fail:

- local skills existed but `existing-rules-merge.md` missing or generic;
- generated skill duplicates local skill authority without merge decision;
- router ignores existing authoritative skill;
- generated system deletes/moves local references without decision.

Docs density fail markers:

- risk register has only `ID/severity/area/evidence/impact/recommendation/status` without trigger, owner and checks;
- knowledge base lacks dependency watchlist or critical flow trace references;
- knowledge index points only to docs and does not point to source/source code areas;
- dependency review says `offline`, `not checked` or `package.json reviewed` without usage evidence and explicit audit freshness gap;
- refactor plan slices are not linked to risk IDs/evidence.
- layer classification отсутствует или содержит только stack summary;
- defect hunt matrix отсутствует;
- defect hunt matrix заполнена generic текстом без files/functions/config evidence;
- security/performance/resource leak sections не содержат проверенных defect classes;
- research не нашел ни одного confirmed risk в сложном проекте и не доказал отсутствие рисков evidence matrix;
- refactor plan не связан с confirmed findings из defect hunts.

## Enterprise Validation

Если включены Jira/Confluence/GitLab:

- есть ровно один configured access method на систему;
- credential source записан без secret values;
- helper files существуют на диске, если method = helper-script;
- access-policy skills указывают helper path, required variable names, winning auth mode и probe; абсолютный env path отсутствует в tracked artifacts;
- есть probe;
- есть read/write permissions;
- fallback guessing запрещен;
- runtime fallback запрещен после setup; install-only auth fallback допустим только если winning mode записан;
- blocker report format задан;
- write actions требуют explicit policy и evidence.

## Repository Hygiene Validation

Проверь:

- project-local: `.gitignore` содержит `reusable-agent-system-toolkit/`, toolkit не staged;
- sidecar: `workspace-verify` и `commit-plan` прошли, customer-code репозитории не содержат agent artifacts;
- cleanup не трогал unrelated staged files;
- toolkit folder не удален с диска.

Validation fail:

- toolkit folder staged;
- project-local `.gitignore` entry missing либо sidecar source-boundary validation failed;
- cleanup выполнен через broad reset/checkout или затронул unrelated staged files.

## Install Mode Validation

Full install:

- deep scan был подтвержден пользователем;
- research evidence pack passed;
- RAG/project map/risk/refactor docs готовы;
- generated skills project-specific.

Degraded install:

- user explicitly skipped deep scan after warning about time/tokens and quality consequences;
- docs/current-state/skills contain `Degraded install: deep scan skipped by user`;
- system does not claim RAG/project map/risk register/refactor plan are complete;
- workflow-router routes `ресерч` to full research mode and recommends it before high-risk tasks;
- generated skills are marked preliminary/general.

Validation fail:

- deep scan skipped but no degraded marker;
- generated skills claim project-specific senior guidance without research evidence;
- missing warning that skills are less concrete without RAG/project map/refactor plan.

## Acceptance Result

```markdown
Generated system validation:
- Required files:
- Skill frontmatter:
- Router:
- Research mode:
- Agent knowledge base:
- Stack-quality gates:
- Enterprise integrations:
- Install mode:
- Repository hygiene:
- Docs:
- Research evidence pack:
- Risk/RAG/dependency density:
- Language:
- Placeholders/generic text:
- Surrogate coverage phrases:
- Result: pass/fail
- Gaps/blockers:
```
