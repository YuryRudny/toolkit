# Индекс Знаний

Используй как routing table для RAG-like базы: тип задачи -> что читать первым -> какие source/docs открыть -> какие skills и проверки обязательны.

| Тип задачи/topic | Читать сначала | Потом читать | Source/source code | Skills | Обязательные проверки | Stop/gap |
|---|---|---|---|---|---|---|
| Новая feature | `knowledge-base.md` | `project-map.md`, `architecture-map.md`, `risk-register.md` | entry points и modules из нужного flow | `project-authority`, stack/domain skills | lint/typecheck/tests по blast radius | нет trace chain для flow |
| UI component | `knowledge-base.md` | stack profile, design system docs, project map | component tree, state/composables, API consumers | frontend/UI skill, `pre-change-checklist`, `review-checklist` | accessibility, responsive, state, browser smoke | нет design/state evidence |
| Backend/API | `knowledge-base.md` | architecture map, API contracts, risk register | route/controller/service/repository/schema | backend/API skill | unit/integration/contract/security checks | неясны auth/validation/transaction boundaries |
| Database/migration | `knowledge-base.md` | architecture map, migrations/schema docs, refactor plan | migrations, schema, repositories, queries | database safety skill | migration/rollback/compatibility/index checks | нет rollback или data-loss оценки |
| Auth/security | `knowledge-base.md` | risk register, enterprise integrations, security section research report | auth/session/permission checks, logging, env config | security/backend/frontend skill по layer | secret/logging/authz/input validation checks | нельзя подтвердить permission model |
| Performance | `knowledge-base.md` | dependency watchlist, performance section research report | hot paths, heavy deps, cache/network/query points | stack performance skill | profiler/build/bundle/API checks по stack | нет baseline или hot-path evidence |
| Dependencies | `knowledge-base.md` | full research report, evidence pack, stack profile | manifests, lockfile, usage search results | stack-quality/dependency review skill | audit freshness, usage count, replacement check | нет lockfile/usage evidence |
| Research | `knowledge-base.md` | project map, risk register, research worklog | source areas not yet covered | research-audit | evidence collection and docs update | нет coverage/depth pass |
| Refactor | `knowledge-base.md` | refactor plan, risk register, current state | files/patterns из выбранного slice | refactor-mode, stack/domain skills | checks by slice, smoke, regression coverage | slice не связан с risk/evidence |
| Enterprise task | `knowledge-base.md` | enterprise integrations | configured scripts/docs only | access policy skills | configured probes only | нет confirmed access method |
| Merge/publish | `knowledge-base.md` | current state, evidence pack, acceptance checklist | diff/touched files | semantic-commit-flow, review-checklist | diff/checks/evidence/branch status | есть незакрытые blockers |

## Правила Обновления

- Добавляй новый row, если в проекте есть отдельный домен/flow с собственными checks.
- Не оставляй generic `project map` без конкретного source/source code пути.
- Если задача требует повторного deep research, явно укажи stop/gap и нужное evidence.
