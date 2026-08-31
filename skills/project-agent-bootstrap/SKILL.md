---
name: project-agent-bootstrap
description: Запускает внедрение reusable AI-agent operating system в одном репозитории или отдельном sidecar workspace. Используй, когда нужно создать project-specific skills, RAG/docs, workflow modes, audit и stack-specific engineering rules без загрязнения customer-code репозиториев.
---

# Project Agent Bootstrap

## Path-First Launch Contract

Bootstrap поддерживает два явных режима.

В `project-local` режиме toolkit находится внутри единственного целевого проекта. До любых действий агент принимает current working directory как project root и проверяет файл:

```text
./reusable-agent-system-toolkit/skills/project-agent-bootstrap/SKILL.md
```

Если файл существует, агент читает именно его и продолжает по этому алгоритму. Не используй `tool_search`, `~/.codex`, plugins или `node_modules/reusable-agent-system-toolkit`, если локальный файл уже есть.

В `sidecar-workspace` режиме current working directory является Git-корнем внутреннего artifact repository и содержит `workspace.json`. Toolkit разрешено держать в отдельном sibling Git repository, но его `path` и `remote` должны быть явно зафиксированы в `workspace.json`. Customer-code репозитории также перечислены в manifest как sibling Git roots. Все RAG/docs/skills/runtime записываются только в artifact repository; customer-code репозитории во время bootstrap являются read-only evidence sources.

Если нет ни локального `./reusable-agent-system-toolkit/skills/project-agent-bootstrap/SKILL.md`, ни валидного `workspace.json` с доступным toolkit path, bootstrap не запускается. Запрещено создавать `.codex/skills`, `codex-skills`, `docs/agent-system` или ближайший эквивалент в customer-code репозитории.

### Sidecar Safety Contract

При наличии `workspace.json` этот контракт имеет приоритет над project-local шагами ниже:

1. Artifact repository — единственная write target для agent-system артефактов.
2. До discovery выполни `workspace-snapshot`, затем `create-workspace-model`; обычный `create-model` в sidecar режиме запрещён.
3. Во всех документах используй logical source paths `repo://<repository-id>/<path>`, не абсолютные пути конкретной машины.
4. После каждого генерационного этапа выполни `workspace-verify`. Любое изменение HEAD или worktree customer repository блокирует bootstrap.
5. Не создавай и не меняй в customer repositories `AGENTS.md`, `.agents`, `.codex`, `codex-skills`, `docs/agent-system`, `.gitignore` или toolkit files.
6. Перед завершением выполни `render-workspace-runtime`, `commit-plan` и `workspace-verify`.
7. Git routing строгий: customer code отправляется только в remote соответствующего customer repository; RAG/docs/skills/rules/runtime — только в artifact remote.

## Обзор

Используй этот skill как первую точку входа после копирования toolkit в целевой репозиторий. Он управляет discovery, audit, documentation, merge существующих правил и генерацией project-local skills.

Этот skill не устанавливает generic rules вслепую. Он должен адаптировать систему под целевой репозиторий и сохранить существующие project rules.

Нулевое правило bootstrap: full-install quality/stack/domain skills не пишутся свободно. После RAG они рендерятся по строгому assembly pipeline: один target skill, один selected base skill, один per-skill assembly sheet, один full template render, один финальный `SKILL.md`.

Исполняемое правило bootstrap: последовательностью фаз управляет `scripts/bootstrap.js`, а структурированным источником истины служит `docs/agent-system/project-model.json`. Markdown references объясняют инженерные решения, но не заменяют команды orchestrator и не могут самостоятельно переводить фазу в `complete`.

## Исполняемый Контур

Используй единый entrypoint. Для project-local режима:

```bash
node reusable-agent-system-toolkit/scripts/bootstrap.js <command> .
```

Для sidecar режима запускай entrypoint из manifest toolkit path, оставляя `.` artifact root:

```bash
node ../reusable-agent-system-toolkit-source/scripts/bootstrap.js <command> .
```

Основные команды по порядку:

```text
init -> security-audit -> set-install-mode -> workspace-snapshot -> create-workspace-model -> create-research -> sync-research
-> create-skill-inputs -> extract-seeds -> render-skills
-> render-operational -> build-registry -> quality-report -> validate
-> render-workspace-runtime -> workspace-verify -> commit-plan
```

Завершай текущую фазу только командой:

```bash
node reusable-agent-system-toolkit/scripts/bootstrap.js complete-phase . <phase>
```

State machine проверяет prerequisites и отклоняет переход вне порядка. Не редактируй `bootstrap-state.json` вручную.

## Обязательные Чтения

- `reusable-agent-system-toolkit/MANIFEST.md`
- `reusable-agent-system-toolkit/README.md`
- `reusable-agent-system-toolkit/references/bootstrap-strict-algorithm.md`
- `reusable-agent-system-toolkit/references/research-mode-guide.md`
- `reusable-agent-system-toolkit/references/deep-bootstrap-research.md`
- `reusable-agent-system-toolkit/references/full-project-research.md`
- `reusable-agent-system-toolkit/references/deep-research-execution-algorithm.md`
- `reusable-agent-system-toolkit/references/research-working-memory.md`
- `reusable-agent-system-toolkit/references/research-docs-blueprint.md`
- `reusable-agent-system-toolkit/references/adversarial-codebase-research.md`
- `reusable-agent-system-toolkit/references/agent-knowledge-base.md`
- `reusable-agent-system-toolkit/references/skill-generation-blueprint.md`
- `reusable-agent-system-toolkit/references/skill-seed-library.md`
- `reusable-agent-system-toolkit/references/bootstrap-acceptance-checklist.md`
- `reusable-agent-system-toolkit/references/generated-system-validation.md`
- `reusable-agent-system-toolkit/references/bootstrap-quality-contract.md`
- `reusable-agent-system-toolkit/references/untrusted-content-security.md`
- `reusable-agent-system-toolkit/skills/project-skills-assembler/SKILL.md`

## Порядок работы

1. Напиши Skill Ledger до первого repo action, запусти `node reusable-agent-system-toolkit/scripts/bootstrap.js init .`, затем `node reusable-agent-system-toolkit/scripts/bootstrap.js security-audit .`. Любая ошибка integrity/security audit означает поврежденную или небезопасную копию toolkit; остановись до install wizard и покажи точный finding.
2. Проверь branch/status. В sidecar режиме отдельно проверь artifact remote и каждый customer-code remote по `workspace.json`, затем создай source snapshot. Все переходы фаз выполняй через `bootstrap.js complete-phase`.
3. Запусти install wizard до discovery:
   - объясни, что `.env` нужен агенту только для настройки воспроизводимого доступа к Jira, Confluence и Git/GitLab/MCP;
   - попроси путь до `.env` с токенами/URL для enterprise integrations, если путь еще не известен из existing project rules;
   - явно скажи, что secret values не будут печататься или копироваться в docs/skills: полный env path хранится только в ignored `.tmp/integration-env.sh`, а в tracked docs/skills записываются helper path и имена required variables;
   - разреши пользователю написать `пропустить enterprise`, если подключение сейчас не нужно.
   - не спрашивай про deep scan в этом же сообщении. Deep scan question разрешен только после enterprise setup `pass` или `skipped`.
4. Если пользователь дал env path:
   - проверь, что toolkit содержит `templates/enterprise-scripts/integration-env.template.sh`, `templates/enterprise-scripts/jira-rest.template.sh`, `templates/enterprise-scripts/confluence-rest.template.sh`;
   - если этих templates нет, остановись: это stale/incomplete toolkit copy. Сообщи missing files и попроси обновить toolkit. Не сочиняй helper scripts вручную и не спрашивай deep scan до устранения blocker или explicit `пропустить enterprise`;
   - создай `.tmp/integration-env.sh`, `.tmp/jira-rest.sh`, `.tmp/confluence-rest.sh` из `templates/enterprise-scripts/*`;
   - подставь env path только в ignored `.tmp/integration-env.sh`; не записывай абсолютный env path в tracked docs, skills, reports или RAG;
   - подставь auth modes по умолчанию: `JIRA_AUTH_MODE=as-is`, `CONFLUENCE_AUTH_MODE=as-is`;
   - сделай scripts executable;
   - проверь наличие required variable names без вывода values;
   - выполни read-only probes только для включенных систем: Jira `./.tmp/jira-rest.sh /rest/api/2/myself`, Confluence `./.tmp/confluence-rest.sh /rest/api/user/current`;
   - если probe вернул 401/403 из-за auth format, попробуй install-only auth mode fallback в рамках того же helper: `as-is`, `bearer`, `basic`;
   - если один mode сработал, запиши winning auth mode в `.tmp/integration-env.sh`, `enterprise-integrations.md` и access-policy skill. После этого runtime fallback запрещен;
   - если env path неверный, variable отсутствует, token протух, DNS/network/probe сломан или все auth modes вернули ошибку, остановись и сообщи точный blocker. Если пользователь исправит env, повтори configured probe/fallback. Если пользователь пишет `пропустить`, пометь integration skipped/unavailable и продолжай без нее.
5. Если пользователь пропустил enterprise setup, не генерируй active Jira/Confluence access skills; запиши gap и fail-fast правило.
6. Только после enterprise setup `pass` или `skipped` спроси, запускать ли глубокое сканирование проекта:
   - объясни, что deep scan нужен для RAG базы, карты проекта, risk register, refactor plan, smoke checklist и stack-specific senior skills;
   - предупреди, что это может занять время и потратить токены;
   - если пользователь говорит пропустить, предупреди, что без deep scan не будет полноценной RAG базы, карты проекта и refactor plan, а скилы будут менее конкретными и более общими. Попроси подтвердить degraded install.
7. Собери существующие agent instructions:
   - `AGENTS.md`;
   - `.codex/`, `codex-skills/`;
   - `.cursor/`, `.cursorrules`;
   - `.claude/`, `CLAUDE.md`;
   - `.github/copilot-instructions.md`;
   - project docs с engineering rules.
8. Собери enterprise integration evidence:
   - Jira project keys, issue links, existing Jira rules;
   - Confluence links/page ids and existing Confluence rules;
   - Git remotes, default base branch, branch naming и GitLab/MR policy;
   - configured `.tmp/*` helper scripts, approved env source, доступность connector/MCP, не печатая secrets.
9. Запусти `existing-rules-merge`, чтобы классифицировать текущие rules до новых записей.
   - Он обязан создать inventory локальных skills/rules и authority matrix.
   - Если есть unresolved conflicts по router/mode/enterprise/review/commit authority, остановись до генерации docs/skills.
   - Existing local skills нельзя перезаписывать; их нужно preserve, route to, wrap или augment только по merge decision.
10. Если deep scan разрешен, следуй full фазам из `bootstrap-strict-algorithm.md`. Запусти read-only `project-discovery`, чтобы собрать stack, commands, architecture, tests, domains, critical flows и enterprise integration config. На этом шаге не создавай финальные docs/skills и не читай `templates/skills/*`.
    - В project-local режиме после merge/discovery запусти `create-model`; в sidecar режиме — только `create-workspace-model` после `workspace-snapshot`.
    - Используй `project-model.json` как canonical topology/capability model.
    - Не отмечай discovery завершенным, пока model не содержит modules, entry points, manifests, capabilities и existing rules inventory.
11. Если deep scan разрешен, создай `docs/agent-system/research-workspace/` по `research-working-memory.md`: `research-plan.md`, `research-notes.md`, `evidence-log.md`, `error-log.md`, `decisions.md`. Веди эти файлы во время всего research.
    - Запусти `node reusable-agent-system-toolkit/scripts/bootstrap.js create-research .`.
    - Закрывай topology tasks через `complete-research-task` или `skip-research-task` с evidence.
    - После каждого research pass запускай `sync-research`; JSON, Markdown и project model обновляются вместе.
12. Если deep scan разрешен, запусти `deep-project-audit` в bootstrap research scope: default scope = весь проект. Это должен быть full project research-code-review по `research-working-memory.md`, `deep-research-execution-algorithm.md`, `full-project-research.md`, `adversarial-codebase-research.md` и `templates/research-forms/*`: inventory проекта, hot spots, critical flow traces, contract/boundary review, dependency usage review, layer classification, defect hunts, security, performance/resource leaks, testing/CI, domain risks, refactor opportunities. Audit сначала заполняет research forms, и только потом из них собираются final docs/RAG.
13. Если deep scan разрешен, сформируй full project research report на русском и research evidence pack по `deep-bootstrap-research.md` + `full-project-research.md` + `adversarial-codebase-research.md` + файлы рабочей памяти, затем проверь coverage/depth criteria:
   - stack/runtime/manifests/lockfiles covered;
   - module inventory done;
   - hot spots and blast radius checked;
   - layer classification done;
   - defect hunts done for applicable layers;
   - dependency/library review done: heavy packages, one/two-place usage candidates, outdated/deprecated/security-sensitive candidates, offline/network audit gaps;
   - top-level modules covered;
   - entry points covered;
   - critical flows traced цепочками `entry -> state/service/composable -> repository/server route -> DTO/API/persistence/external system -> error/auth/cache behavior`;
   - data/API contracts covered;
   - shared high-risk areas checked;
   - auth/security/async/cache/CI/deploy covered or marked not applicable with evidence.
   - performance/resource leak classes checked or marked not applicable with evidence.
   - пакет привязок для skills готов: проектные привязки, локальные антипаттерны, подсказки поиска source, commands/checks, risk/refactor links.
   - `research-workspace/evidence-log.md` содержит concrete evidence по research passes.
   - `research-workspace/error-log.md` перенесен в gaps/current-state, если были ошибки или blockers.
   - `research-workspace/forms/*.md` заполнены из `templates/research-forms/*`: module inventory, critical flows, boundaries/contracts, defect hunt, dependencies, security, performance/resource, testing/CI, refactor candidates.
   - `sampled`, `reviewed by tree`, file counts и shallow `rg` output не считаются coverage pass.
14. Если coverage/depth validation не пройдена, остановись до генерации final RAG/skills и сообщи blockers.
15. Если deep scan разрешен, запусти `project-docs-generator`, чтобы создать/обновить project docs из research evidence по `research-docs-blueprint.md`: full project research report, research evidence pack, agent knowledge base, knowledge index, project map, architecture map, risk register, refactor plan, smoke checklist, current state/worklog и `enterprise-integrations.md`, если есть Jira/Confluence/GitLab workflow.
16. Если deep scan пропущен, создай только minimal install docs: `enterprise-integrations.md`, `current-state.md`, minimal `stack-profile.md`, minimal `AGENTS.md`/router с явным `degraded install` marker. Не называй RAG/project map/refactor plan готовыми.
17. Если deep scan разрешен, проверь artifact gate `Docs/RAG Ready` из `bootstrap-strict-algorithm.md`: required docs существуют на диске, не пустые и project-specific. Если gate failed, остановись и не переходи к skills.
18. После `Docs/RAG Ready` выполни выбор seeds по `skill-seed-library.md` и `skill-seeds/manifest.json`: выбери применимые встроенные и external seed playbooks по dependency/path/stack evidence, existing rules authority и RAG. Если есть external library, сначала читай ее manifest/index, а selected `SKILL.md` открывай только после отбора. Запиши `selected/recommended/skipped` в stack profile, knowledge index или bootstrap summary. Не копируй seed как готовый skill.
19. Запусти `stack-engineering-standards`, чтобы создать stack-specific engineering-quality guidance из RAG и выбранных seeds; при degraded install пометь standards как preliminary и не создавай stack-specific senior standards.
20. Только после `Docs/RAG Ready` и выбора seeds запусти `project-skills-assembler`, чтобы собрать active project-local skills через build pipeline:
   - `node reusable-agent-system-toolkit/scripts/bootstrap.js create-skill-inputs .`;
   - `node reusable-agent-system-toolkit/scripts/bootstrap.js extract-seeds .`;
   - для каждого target skill отдельно заполни `docs/agent-system/skill-inputs/<skill-name>.json` по `schemaVersion: 2`: RAG routes, project hooks, critical flows, local risks, workflow steps, layer checks, gates, stop conditions, result format;
   - поставь `status: "ready"` только после замены общих заготовок на project-specific evidence из RAG/source;
   - рендери по одному skill командой `node reusable-agent-system-toolkit/scripts/bootstrap.js render-skills . <skill-name>` либо всю очередь после заполнения всех v2 inputs;
   - после full skills запусти `node reusable-agent-system-toolkit/scripts/bootstrap.js render-operational .`; router будет скомпилирован из фактического `skill-registry.json` и не сможет ссылаться на отсутствующие skills;
   - эта же команда обязана создать или обновить managed-блок корневого `AGENTS.md`; отдельное ручное создание entrypoint запрещено;
   - проверь, что `AGENTS.md` требует читать `codex-skills/skills/workflow-router/SKILL.md` до исходников, команд и git/network действий, даже если project-local skills отсутствуют в системном `Available skills`;
   - `node reusable-agent-system-toolkit/scripts/check-bootstrap-state.js .`.
   Не пиши full-install `SKILL.md` руками. Markdown skills и assembly sheets должен создавать renderer из structured inputs. При degraded install разрешены только minimal generic skills с `degraded install` warning и обязательным future research gate.
21. Создай `docs/agent-system/bootstrap-quality-report.md` командой `node reusable-agent-system-toolkit/scripts/bootstrap.js quality-report .`.
   - Баллы вычисляет toolkit из project model, research task graph, RAG, registry и skill inputs; не выставляй их вручную.
   - Каждая категория должна получить `10/10` для full install.
   - Если любая категория ниже 10, не завершай bootstrap: вернись в указанную repair phase и исправь артефакты.
   - `Full bootstrap quality: 10/10` можно писать только если все категории 10.
22. Проверь generated system командой `node reusable-agent-system-toolkit/scripts/bootstrap.js validate .` и по `generated-system-validation.md`. Успешная проверка обязана создать `docs/agent-system/validation-result.json` со status `passed`.
23. Выполни language marker scan из `generated-system-validation.md` по generated skills/docs. Английские служебные headings/instructions (`Required Reads`, `Workflow`, `Stop Conditions`, `Do not`, `Read only`, `Use for` и т.п.) = fail.
24. Проверь bootstrap результат по `bootstrap-acceptance-checklist.md`.
25. Проверь generated skill frontmatter, unfinished placeholder markers, trace выбора seeds и enterprise fail-fast gates.
26. Выполни final repository hygiene:
   - в project-local режиме добавь `reusable-agent-system-toolkit/` в `.gitignore`, если такой строки еще нет;
   - проверь staged files;
   - если `reusable-agent-system-toolkit/` случайно staged, убери только эту папку из index командой `git restore --staged reusable-agent-system-toolkit/` или эквивалентным non-destructive unstage;
   - не удаляй toolkit с диска и не трогай unrelated staged files.
   - в sidecar режиме не меняй customer `.gitignore`; выполни `render-workspace-runtime`, `workspace-verify` и `commit-plan` в artifact repository.
27. Заверши short operating summary: generated files, active skill path, выбранные seeds, checks, gaps, bootstrap phases, quality score и next steps.

## Контрольные gates

- Не перезаписывай existing project rules без merge note.
- Не игнорируй existing local skills. `existing-rules-merge.md` с inventory и authority matrix обязателен до discovery/docs/skills.
- Не создавай stack-specific standards, пока stack не подтвержден файлами проекта.
- Не создавай audit findings без evidence.
- Не создавай финальные docs, RAG базу, `AGENTS.md` или project-local skills до прохождения deep bootstrap research coverage gate.
- Не создавай skills/maps/modes до полного русскоязычного research report, RAG базы и refactor plan.
- Не читай `templates/skills/*` и `generated-skill-catalog.md` до прохождения `Docs/RAG Ready`.
- Не генерируй project-local skills, которые дублируют или конфликтуют друг с другом.
- Не генерируй skill с тем же name/path, что existing local skill, без explicit merge decision.
- Не генерируй активные Jira/Confluence/GitLab skills без project-local config: метод доступа, источник credentials, probe, permissions и fail-fast правила.
- Не оставляй Jira/Confluence/GitLab helpers на уровне устного описания: если enterprise setup включен, `.tmp/integration-env.sh`, `.tmp/jira-rest.sh`, `.tmp/confluence-rest.sh` должны быть созданы из toolkit templates и записаны в project-local docs/skills.
- Не разрешай агенту перебирать Jira/Confluence/GitLab transport fallback methods. Во время install setup можно перебрать только auth modes `as-is`, `bearer`, `basic` внутри одного helper, затем записать working mode и остановить дальнейший fallback.
- Не спрашивай и не запускай deep scan, пока enterprise setup не завершен статусом `pass` или `skipped`.
- Не запускай deep scan без явного согласия пользователя на время/токены.
- Не называй degraded install полноценным bootstrap: без deep scan нет полноценной RAG базы, project map, risk register, refactor plan и project-specific senior skills.
- Не завершай первый bootstrap без agent knowledge base, knowledge index, project map, architecture map, risk register, refactor plan, smoke checklist и current state/worklog. Если артефакт нельзя создать, запиши blocker/gap.
- Не превращай первый bootstrap в поверхностное summary по стеку. Stack discovery - только вход в глубокий research.
- Не превращай full research docs в короткий конспект. Full report и evidence pack должны сохранять flow traces, defect hunt details, dependency usage evidence и concrete source examples.
- Не веди deep research только в чате. Файлы рабочей памяти из `research-working-memory.md` обязательны для полного deep scan.
- Не называй coverage passed, если critical flows не traced через реальные files.
- Не называй coverage passed, если layer classification или defect hunts отсутствуют.
- Не называй coverage passed, если security/performance/resource leak review заменены generic текстом.
- Не называй coverage passed, если source modules/entry points/data contracts отмечены как `sampled`, `reviewed by tree`, `file list` или только count-based evidence.
- Не называй coverage passed, если research не дал пакет привязок для skills для будущих playbook skills.
- Не генерируй full-install skills без `skill-generation-blueprint.md`, `Проектные Привязки`, `Локальные Антипаттерны И Риски` и operational references.
- Не генерируй full-install skills свободным текстом. Используй `project-skills-assembler`, per-skill `skill-adaptation-sheet.template.md` и соответствующий `.full.template.md`.
- Не создавай full-install skill, пока в `docs/agent-system/skill-assembly/<skill-name>.md` не заполнен `Final text for SKILL.md` для каждой секции target full template.
- Не называй generated system clean, если `docs/agent-system/skill-assembly/<skill-name>.md` отсутствует для любого full-install quality/stack/domain skill или содержит compact/grouped summary вместо `Render Source Matrix`.
- Не называй full bootstrap готовым, если `docs/agent-system/bootstrap-quality-report.md` отсутствует или любая категория в нем ниже `10/10`.
- Не генерируй full-install quality/stack skills без выбора seeds по `skill-seed-library.md` и `skill-seeds/manifest.json`.
- Не копируй seed playbook как финальный project-local skill: seed должен быть адаптирован через RAG, project map, risks, refactor plan и existing rules.
- Не выбирай seed без dependency/path/stack evidence, кроме seeds с `alwaysForFullInstall=true`.
- Не читай все external skills подряд: используй external manifest/index и progressive disclosure.
- Не называй выбор seeds пройденным, если `selected/recommended/skipped` не записаны в docs или bootstrap summary.
- Не называй generated system validation clean, если language marker scan нашел английские служебные headings/instructions в generated skills/docs.
- Не останавливайся за approval между research и генерацией, если coverage/depth validation passed: первый bootstrap должен сам пройти до RAG/docs/skills.
- В project-local режиме не допускай попадания `reusable-agent-system-toolkit/` в commit целевого проекта. В sidecar режиме toolkit и agent-system являются отдельными внутренними Git repositories, а customer-code repositories должны остаться без agent artifacts.
- Не называй систему готовой, пока validation не прошла или gaps не записаны явно.
- Не называй bootstrap успешным, если acceptance checklist failed.

## Условия остановки

- Repository ownership или write permissions неясны.
- Existing rules конфликтуют с user instructions и нет безопасного merge path.
- Existing local skills найдены, но inventory/authority matrix не созданы.
- Проект нельзя изучить достаточно для определения stack и commands.
- Enterprise integration нужна для задач проекта, но метод доступа или credentials policy не подтверждены.
- Toolkit требует enterprise helper templates, но `templates/enterprise-scripts/*` отсутствует. Это stale/incomplete toolkit copy; остановись и попроси обновить toolkit.
- Пользователь дал env path, но файл отсутствует, required variables отсутствуют, token/header format не работает или probe возвращает auth/permission/unexpected response. Остановись и попроси исправить env или явно написать `пропустить`.
- Пользователь не подтвердил deep scan и не подтвердил degraded install после предупреждения о последствиях.
- Невозможно безопасно построить project map или определить critical flows по repository evidence.
- Deep bootstrap research coverage/depth criteria не пройдены.
- Full project research-code-review не покрывает stack/dependencies/architecture/data-flow/security/performance/testing/refactor opportunities.
- Artifact gate `Docs/RAG Ready` не пройден.
- `templates/skills/*` были прочитаны до создания full research report/RAG/refactor plan.
- Выбор seeds не выполнен или выбранные seeds не подтверждены project evidence.
- Selected seed невозможно адаптировать без generic текста.
- Coverage/depth pass основан на sampling/tree review/file counts вместо concrete trace evidence.
- Deep scan не создал или не обновлял `docs/agent-system/research-workspace/*`.
- Deep scan не заполнил `docs/agent-system/research-workspace/forms/*` по `templates/research-forms/*`.
- Сгенерированные skills превращаются в generic text без project evidence.
- Сгенерированные skills/docs содержат английские служебные headings/instructions при русской policy.
- Generated system validation failed.
- В project-local режиме `reusable-agent-system-toolkit/` невозможно добавить в `.gitignore` или невозможно безопасно unstage без затрагивания unrelated staged files.
- В sidecar режиме `workspace-verify` или `commit-plan` обнаружил изменение customer repository либо agent artifact в Git заказчика.

## Формат результата

```markdown
Результат bootstrap:
- Active skills path:
- Existing rules merged:
- Docs generated:
- Skills generated:
- Stack standards:
- Enterprise integrations:
- Research artifacts:
- Research evidence pack:
- Coverage/depth validation:
- Agent knowledge base:
- Repository hygiene:
- Проверки:
- Gaps/blockers:
```
