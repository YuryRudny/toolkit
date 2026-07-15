# Bootstrap 10/10 Quality Contract

Используй этот reference в первом bootstrap, deep research, docs generation, skills assembly, validation и acceptance.

Цель - не "формально установить toolkit", а получить систему уровня strong senior engineer, которую можно отдать другой команде без ручной доводки.

## Главный Принцип

Bootstrap считается full-success только если каждая категория ниже получила `10/10`.

Если любая категория ниже 10:

1. Не называй bootstrap готовым.
2. Не пиши `validation passed` как финальный статус.
3. Вернись в конкретную фазу, которая дала низкий score.
4. Исправь артефакты.
5. Повтори quality report.

`9/10` - это не "почти готово". Это `needs repair`.

## Категории 10/10

| Категория | 10/10 означает | Если меньше 10 |
| --- | --- | --- |
| Research depth | Проект изучен через inventory, hot spots, critical flow traces, contract/boundary review, defect hunts, dependencies, security/performance/testing и refactor opportunities | вернуться в `deep-project-audit` |
| Evidence quality | Findings, gaps, risks and refactor slices имеют concrete paths/functions/configs/commands или explicit blocker | вернуться в research workspace/forms |
| RAG usefulness | `knowledge-base.md` и `knowledge-index.md` позволяют следующему агенту быстро найти source, risks, skills and checks без full rediscovery | вернуться в `project-docs-generator` |
| Risk/refactor value | `risk-register.md` и `refactor-plan.md` содержат actionable risks, triggers, owners/skills, checks, slices, examples and success criteria | вернуться в docs generation |
| Skill assembly discipline | Каждый full quality/stack/domain skill создан через one target skill -> selected seed -> `schemaVersion: 2` skill input -> renderer -> per-skill assembly sheet -> final skill | вернуться в `project-skills-assembler` |
| Skill senior quality | Skills похожи на senior playbooks: trigger, non-trigger, RAG route, seed adaptation, project hooks, local risks, workflow, layer checks, gates, stop conditions, output format; ключевые секции не являются строковыми списками без evidence/action/output | вернуться к v2 skill input и rerender |
| Operational references | `codex-skills/references/*` добавляют retrieval hints, local examples, bad/good patterns and command recipes, а не копируют docs | пересобрать references |
| Language/runtime clarity | Runtime prose на русском; английский только для paths/commands/API/code identifiers | перевести generated docs/skills |
| Existing rules/enterprise hygiene | Existing local rules preserved/merged; enterprise helper status truthful; toolkit ignored/not staged | вернуться в merge/enterprise/hygiene phase |
| Re-run safety | Следующий агент может начать с router/RAG/skills и получить такое же поведение без повторного объяснения пользователем | усилить AGENTS/router/knowledge index |

## Research 10/10 Rubric

Research получает `10/10`, только если выполнено всё:

- Каждый применимый top-level source layer имеет module inventory row.
- Для каждого high-risk layer есть минимум один critical flow trace.
- Trace содержит concrete chain: entry -> component/controller/handler -> state/service/composable -> repository/client/server route -> DTO/schema/API/persistence/external system -> error/auth/cache behavior -> checks/gaps.
- Defect hunts выполнены по categories: correctness/domain, architecture/ownership, data/API/contracts, security/privacy, performance/resource, type/runtime safety, testing/CI/observability, dependencies/supply chain.
- Findings разделены на confirmed / hypothesis / gap.
- Dependency review содержит direct dependency usage evidence, heavy/rare/security-sensitive candidates, audit freshness.
- Security review содержит trust boundaries, auth/authz authority, input/output validation, secrets/logging.
- Performance review содержит hot paths, cache/concurrency, listener/timer/subscription/file/resource lifecycle.
- Testing/CI review содержит real commands, test existence, CI blocking/non-blocking behavior, smoke gaps.
- Research workspace и forms заполнены не summary, а evidence rows.

## Docs/RAG 10/10 Rubric

Docs/RAG получают `10/10`, только если:

- `full-project-research-report.md` можно дать разработчику как полноценный research-code-review report.
- `research-evidence-pack.md` сохраняет evidence tables и coverage reasoning, а не только выводы.
- `knowledge-base.md` краткий, но содержит entry points, critical flows, high-risk areas, dependency watchlist, commands, retrieval rules.
- `knowledge-index.md` маршрутизирует task types к docs -> source paths -> skills -> checks -> stop/gap.
- `risk-register.md` содержит ID, severity, affected area, trigger, impact, owner/skill, required checks, status.
- `refactor-plan.md` содержит phases/slices, examples, checks, success criteria and stop conditions.
- `smoke-checklist.md` содержит realistic manual/automated checks by critical flow.
- `current-state.md` честно фиксирует gaps/blockers and unavailable checks.

## Skills 10/10 Rubric

Full quality/stack/domain skill получает `10/10`, только если:

- Есть matching `docs/agent-system/skill-assembly/<skill-name>.md`.
- Assembly sheet заполнен по `skill-adaptation-sheet.template.md`.
- Assembly sheet содержит `Render Source Matrix` and `Section Render` для секций target template.
- `Final text for SKILL.md` у каждой секции готов к переносу без "см. выше" или дописывания.
- Skill создан как clean render одного `.full.template.md`.
- Skill содержит project paths/flows/risk IDs/commands, а не generic advice.
- Skill явно говорит, когда использовать и когда не использовать.
- Skill сначала ведет агента через RAG/source route, затем к layer-specific checks.
- Skill заставляет исправлять unsafe touched-area code или писать risk/refactor gap.
- Skill содержит gates/stop conditions and result format usable in real tasks.

## Minimum Skill Set For Full Install

Full install не может быть `10/10` без этих skills:

- `workflow-router`
- `project-authority`
- `pre-change-checklist`
- `review-checklist`
- `research-audit`
- `code-review-and-quality`
- `debugging-and-error-recovery`
- `refactor-engineering`
- at least one real stack/domain skill for each applicable layer:
  - frontend UI;
  - frontend state/data;
  - backend/API/Nitro/server;
  - testing;
  - security/performance;
  - mobile shell, if evidence exists.

## Quality Report Requirement

В конце full bootstrap создай `docs/agent-system/bootstrap-quality-report.md`.

Отчет должен содержать:

- score по каждой категории;
- concrete evidence paths;
- repair actions, если score < 10;
- итог: `Full bootstrap quality: 10/10` только если все категории 10.

Если есть gaps из-за внешних систем, они не обязаны снижать score, если:

- gap честно записан;
- affected workflow имеет fail-fast behavior;
- skills/RAG знают, как действовать при этом gap.

## Repair Loop

Если score ниже 10:

| Failed category | Вернуться в фазу | Что исправить |
| --- | --- | --- |
| Research depth/evidence | deep-project-audit | forms, flow traces, defect hunts, dependency/security/performance/testing rows |
| RAG usefulness | project-docs-generator | knowledge index, source routing, risk/refactor links |
| Risk/refactor value | project-docs-generator | triggers, impact, checks, slices, examples |
| Skill assembly discipline | project-skills-assembler | per-skill assembly sheets, Render Source Matrix, Section Render |
| Skill senior quality | project-skills-assembler | project hooks, workflow, gates, layer checks |
| Operational references | project-skills-assembler | retrieval hints, examples, command recipes |
| Language/runtime clarity | generated-system-validation | Russian runtime prose |
| Existing rules/enterprise hygiene | existing-rules-merge / enterprise setup | authority matrix, helper policy, skipped/pass status |

Не спрашивай approval между repair steps, если пользователь уже разрешил full bootstrap.
