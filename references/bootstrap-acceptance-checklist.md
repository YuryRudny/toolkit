# Bootstrap Acceptance Checklist

Используй этот checklist в конце первого запуска toolkit на новом проекте.

Bootstrap считается успешным только если generated system можно использовать следующим агентом без повторного discovery с нуля.

Если пользователь явно выбрал degraded install без deep scan, checklist должен вернуть не `pass`, а `degraded pass`: система установлена, но RAG/project map/refactor plan/senior skills не считаются готовыми.

## Must Exist

- `AGENTS.md` или active project entry file.
- Active skills directory.
- `workflow-router`.
- Research mode с default scope = весь проект.
- Quality playbooks: `code-review-and-quality`, `debugging-and-error-recovery`, `refactor-engineering`.
- Stack-quality skills для реального stack.
- Project docs directory.
- Full project research report.
- Research evidence pack.
- Coverage/depth validation passed.
- Agent knowledge base.
- Knowledge index.
- Project map.
- Risk register.
- Refactor plan.
- Smoke checklist.
- Stack profile.
- Current state/worklog.
- Existing rules merge doc, если existing rules/local skills найдены.
- Enterprise integrations doc, если проект использует Jira/Confluence/Git/GitLab.
- `.tmp/integration-env.sh`, `.tmp/jira-rest.sh`, `.tmp/confluence-rest.sh`, если Jira/Confluence setup включен.
- `.gitignore` содержит `reusable-agent-system-toolkit/`.
- Generated system validation checklist copied or referenced.
- Bootstrap acceptance checklist copied or referenced.
- Bootstrap quality report exists: `docs/agent-system/bootstrap-quality-report.md`.

## Must Be True

- Existing rules были сохранены или merged с решением.
- Existing local skills были inventoried, получили authority decision и не были перезаписаны без решения.
- Install wizard спросил env path или зафиксировал existing env source/skipped enterprise.
- Install wizard объяснил, зачем нужен env, и не печатал secret values.
- Если Jira/Confluence включены, helper scripts созданы из toolkit templates, executable и записаны в docs/access skills.
- Если install setup подбирал auth mode, winning mode записан в `.tmp/integration-env.sh`, `enterprise-integrations.md` и access-policy skill.
- Если helper probe failed, bootstrap остановился с точным blocker или пользователь явно выбрал skip.
- Install wizard спросил deep scan только после enterprise/MCP setup `pass` или `skipped` и предупредил о времени/токенах.
- Если deep scan skipped, пользователь получил предупреждение о последствиях и явно подтвердил degraded install.
- Findings имеют evidence.
- Final docs/skills были созданы только после passed research coverage gate.
- Первый bootstrap сам прошел full research -> docs/RAG -> skills без промежуточного approval, если coverage/depth validation passed.
- Full research report на русском покрывает stack, architecture, data-flow, dependencies/libraries, security, performance, testing/CI, findings, gaps и refactor recommendations.
- Full research включает layer classification и defect hunt matrix по применимым слоям.
- Research evidence pack показывает, какие defect classes проверены: correctness/domain logic, architecture/ownership, data/API/contracts, security/privacy, performance/resource leaks, type/runtime safety, testing/CI/observability, dependencies/supply chain.
- Security/performance/resource leak review содержит concrete evidence или explicit blockers/gaps.
- Refactor plan похож на инженерный план: контекст, оценка, главные риски, принципы, slices/phases, критерии успеха, examples и checks.
- `project-skills-assembler` был запущен только после artifact gate `Docs/RAG Ready`.
- `templates/skills/*` не читались до создания full research report, RAG базы, project maps и refactor plan.
- Coverage/depth pass не основан на `sampled`, `reviewed by tree`, file counts или shallow `rg` output.
- Critical flows имеют trace chains с concrete files/functions/contracts, а не только domain summary.
- Docs не содержат secrets.
- Router не переспрашивает `ресерч`, если можно начать весь проект.
- Router/core skills сначала используют knowledge base/index для обычных задач.
- Router маршрутизирует authoritative existing local skills или documented adapters.
- Generated skills не являются generic boilerplate.
- Generated quality skills являются senior playbooks: есть triggers, RAG/source workflow, seed adaptation trace, quality bar, gates, stop conditions, checks, result format и project-specific hooks.
- `code-review-and-quality` проверяет correctness, readability, architecture, security, performance, tests и severity.
- `debugging-and-error-recovery` требует stop-the-line, reproduction, localization, root cause, regression protection и verification.
- `refactor-engineering` требует behavior protection, small slices, blast radius checks и связь с `risk-register.md`/`refactor-plan.md`.
- `frontend-ui-engineering`, если есть UI, задает production UI bar: accessibility, responsive, visual polish, design system, state boundaries, browser/runtime guards.
- `backend-engineering`, если есть backend/API/workers, задает production backend bar: validation, auth/authz, transactions, idempotency, safe errors, observability.
- Skill references не являются копиями `docs/agent-system`; они дают skill-specific examples/patterns/retrieval hints или не создаются.
- Generated skills/docs прошли language marker scan: нет английских служебных headings/instructions вроде `Required Reads`, `Workflow`, `Stop Conditions`, `Do not`, `Read only`, `Use for`.
- Generated skills не содержат английские prose-инструкции в `Порядок работы`, `Контрольные gates`, `Проверки`, `Формат результата`.
- Risk register, smoke checklist, knowledge index и refactor plan содержат actionable project-specific content, а не только compact placeholder-like summaries.
- Risk register содержит trigger/condition, affected flow/area, owner/skill, required checks и status по каждому confirmed risk.
- Knowledge base содержит entry points, critical flows, high-risk areas, dependency watchlist, commands, retrieval rules и gaps.
- Knowledge index ведет к source/source code областям, skills, checks и stop/gap по основным типам задач.
- Dependency review содержит manifest/lockfile evidence, usage evidence, audit freshness и heavy/rare/security-sensitive candidates.
- Stack-quality gates подключены к pre-change/review.
- Enterprise access не имеет guessing fallback.
- `reusable-agent-system-toolkit/` не staged и не попадет в commit целевого проекта.
- Gaps/blockers записаны явно.
- `bootstrap-quality-report.md` содержит `Full bootstrap quality: 10/10` для full install.
- Каждая категория из `bootstrap-quality-contract.md` имеет score `10/10` или bootstrap не принят.

## Failure Conditions

- Bootstrap дал только stack summary.
- Нет полного русскоязычного research report.
- Нет project map или risk register.
- Нет knowledge base или knowledge index.
- Нет research evidence pack или coverage/depth validation failed.
- Full research не проверил dependencies/libraries/security/performance/testing/refactor opportunities.
- Full research не выполнил layer classification.
- Full research не выполнил defect hunts по применимым слоям.
- Defect hunt matrix отсутствует или заполнена generic текстом без evidence.
- Security/performance/resource leak review заменен общими фразами.
- Research не нашел confirmed risks в сложном проекте и не доказал evidence matrix, что применимые risk classes проверены.
- `project-skills-assembler` запущен до full research report/RAG/refactor plan.
- `templates/skills/*` были прочитаны до `Docs/RAG Ready`.
- Research evidence pack ставит `pass` для областей, где evidence = `sampled`, `reviewed by tree`, file counts или generic summary.
- Critical flows не прослежены до state/service/repository/server route и DTO/API/persistence/external system.
- `workflow-router` отсутствует или не содержит Research mode.
- `research-audit` не требует docs updates.
- Stack skills не привязаны к реальному framework/tooling.
- Quality playbooks отсутствуют или являются краткими чеклистами без senior workflow.
- `frontend-ui-engineering` выглядит как список общих проверок без production UI bar и project hooks.
- `backend-engineering` выглядит как список общих проверок без data integrity/security/observability gates.
- `codex-skills/references` дублирует `docs/agent-system` без новой operational value.
- Generated skills/docs содержат английские служебные headings/instructions при русской policy.
- Generated skills содержат английские prose-инструкции при русской policy.
- Docs слишком короткие/generic для повторной работы агента: нет actionable risks, smoke flows, retrieval paths или refactor slices.
- `bootstrap-quality-report.md` отсутствует или содержит score ниже `10/10` при full install.
- Risk register выглядит как краткий список без trigger/owner/check/status.
- RAG база не помогает выбрать source/source code без повторного full discovery.
- Dependency review не содержит usage evidence или audit freshness.
- Jira/Confluence/GitLab skills сгенерированы без confirmed config.
- Existing local skills/rules были найдены, но нет `existing-rules-merge.md` с inventory/authority matrix.
- Generated skills/router игнорируют authoritative local skills.
- Generated skill перезаписал existing local skill без explicit merge decision.
- Jira/Confluence setup включен, но `.tmp/*` helper scripts отсутствуют.
- `templates/enterprise-scripts/*` отсутствуют в toolkit, но агент пытается продолжать enterprise setup или спрашивает deep scan.
- Deep scan был запрошен до завершения enterprise/MCP setup.
- Env path/token/probe failed, но bootstrap продолжил как будто enterprise access готов.
- Deep scan skipped без предупреждения о потере RAG/project map/refactor plan/concrete skills.
- Degraded install выдан как полноценный bootstrap.
- `.gitignore` не содержит `reusable-agent-system-toolkit/`.
- `reusable-agent-system-toolkit/` остался staged после установки.
- Есть placeholder markers: `TODO`, `TBD`, `<...>`, "заполнить позже" в active skills/docs.

## Result Format

```markdown
Bootstrap acceptance:
- Entry file:
- Skills path:
- Docs path:
- Router/research:
- Quality playbooks:
- Stack-quality:
- Enterprise:
- Install mode: full/degraded
- Repository hygiene:
- Validation:
- Quality:
- Failed checks:
- Next action:
```
