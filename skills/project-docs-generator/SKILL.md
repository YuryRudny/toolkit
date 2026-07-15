---
name: project-docs-generator
description: Генерирует project documentation, необходимую для reusable agent operating system. Используй после discovery и audit, чтобы создать overview, architecture map, risk register, refactor plan, current state, smoke checklist, domain map и agent operating model для любого проекта.
---

# Project Docs Generator

## Обзор

Создай документацию, которая делает проект понятным будущим агентам и инженерам. Docs должны отражать repository evidence, а не generic templates.

## Обязательные Templates

- `reusable-agent-system-toolkit/templates/docs/project-overview.template.md`
- `reusable-agent-system-toolkit/templates/docs/full-project-research-report.template.md`
- `reusable-agent-system-toolkit/templates/docs/knowledge-base.template.md`
- `reusable-agent-system-toolkit/templates/docs/knowledge-index.template.md`
- `reusable-agent-system-toolkit/templates/docs/research-evidence-pack.template.md`
- `reusable-agent-system-toolkit/templates/docs/project-map.template.md`
- `reusable-agent-system-toolkit/templates/docs/architecture-map.template.md`
- `reusable-agent-system-toolkit/templates/docs/risk-register.template.md`
- `reusable-agent-system-toolkit/templates/docs/refactor-plan.template.md`
- `reusable-agent-system-toolkit/templates/docs/smoke-checklist.template.md`
- `reusable-agent-system-toolkit/templates/docs/agent-operating-model.template.md`
- `reusable-agent-system-toolkit/templates/docs/stack-profile.template.md`
- `reusable-agent-system-toolkit/templates/docs/enterprise-integrations.template.md`
- `reusable-agent-system-toolkit/templates/docs/current-state.template.md`
- `reusable-agent-system-toolkit/templates/docs/research-worklog.template.md`
- `reusable-agent-system-toolkit/templates/docs/existing-rules-merge.template.md`
- `reusable-agent-system-toolkit/references/agent-knowledge-base.md`
- `reusable-agent-system-toolkit/references/full-project-research.md`
- `reusable-agent-system-toolkit/references/deep-research-execution-algorithm.md`
- `reusable-agent-system-toolkit/references/research-working-memory.md`
- `reusable-agent-system-toolkit/references/research-docs-blueprint.md`
- `reusable-agent-system-toolkit/references/adversarial-codebase-research.md`
- `reusable-agent-system-toolkit/references/skill-generation-blueprint.md`
- `reusable-agent-system-toolkit/references/bootstrap-quality-contract.md`
- `reusable-agent-system-toolkit/templates/docs/bootstrap-quality-report.template.md`

## Порядок работы

1. Прочитай discovery output и audit findings.
   - Для bootstrap обязательно прочитай full project research output, research evidence pack и coverage/depth validation.
   - Если пользователь явно выбрал degraded install без deep scan, full research output может отсутствовать, но все generated docs обязаны иметь marker `Degraded install: deep scan skipped by user` и не должны называть RAG/project map/refactor plan готовыми.
2. Выбери target docs path. Предпочитай existing docs conventions; иначе используй `docs/agent-system/`.
3. Перед записью docs прочитай файлы рабочей памяти из `docs/agent-system/research-workspace/`, если это полный deep scan:
   - `research-plan.md`;
   - `research-notes.md`;
   - `evidence-log.md`;
   - `error-log.md`;
   - `decisions.md`.
   Если полный deep scan заявлен, но workspace отсутствует или `evidence-log.md` пустой, не генерируй финальные docs как будто research полный.
4. Перед записью docs разложи research payload по `research-docs-blueprint.md`.
   Нельзя сжимать full research в short summary. Каждый required template section должен быть заполнен или явно помечен как `не применимо` с evidence.
5. Создай или обнови:
   - full project research report для разработчиков;
   - research evidence pack;
   - agent knowledge base;
   - knowledge index;
   - project map;
   - project overview;
   - architecture map;
   - risk register;
   - refactor plan;
   - current state/worklog;
   - existing rules merge с local skills inventory и authority matrix;
   - research worklog, если discovery/research будет продолжаться;
   - smoke checklist;
   - stack profile;
   - enterprise integrations для Jira/Confluence/Git/GitLab, если discovery нашел такой workflow;
   - domain map для важных modules;
   - agent operating model;
   - initial `bootstrap-quality-report.md`, который позже будет дополнен skills/validation evidence.
   В `knowledge-base.md`, `knowledge-index.md`, `risk-register.md`, `refactor-plan.md` и `project-map.md` обязательно сохрани пакет привязок для skills из research:
   - проектные привязки: реальные directories/files/flows/commands;
   - локальные антипаттерны: confirmed fragile/unsafe patterns;
   - preferred local patterns, если они найдены;
   - подсказки поиска source для основных типов задач;
   - checks by blast radius;
   - links на risk/refactor IDs.
6. Явно отметь gaps там, где evidence отсутствует.
7. Убедись, что docs полезны generated skills:
   - workflow-router и project authority сначала ссылаются на knowledge base/index;
   - project authority skill ссылается на overview и architecture;
   - research skill ссылается на risk register;
   - refactor skill ссылается на plan и worklog;
   - smoke skills ссылаются на smoke checklist.
8. Проверь плотность ключевых документов:
   - `full-project-research-report.md` является long-form отчетом: содержит архитектуру, flows, dependency review, security/performance/testing, findings, gaps и refactor recommendations с concrete evidence;
   - `research-evidence-pack.md` содержит не только итоги, но и module inventory, hot spots, flow traces, boundary/contract review, defect hunts, dependency usage evidence, tests/CI evidence и coverage result;
   - `knowledge-index.md` содержит task -> docs -> source areas -> skills -> checks -> stop/gap;
   - `risk-register.md` содержит trigger/condition, impact, owner/skill, required checks и status по каждому confirmed risk;
   - `knowledge-base.md` содержит entry points, critical flows, high-risk areas, dependency watchlist, commands и retrieval rules;
   - `knowledge-index.md` покрывает feature, UI, backend/API, database/migration, auth/security, performance, dependencies, research, refactor, enterprise task и merge/publish, либо явно отмечает неприменимые слои;
   - dependency sections содержат manifest/lockfile evidence, usage evidence, audit freshness и heavy/rare/security-sensitive candidates.
   - `full-project-research-report.md` содержит layer classification и defect hunt matrix;
   - `research-evidence-pack.md` содержит defect classes, checked evidence paths, findings, gaps и coverage по применимым слоям;
   - security/performance/resource leak sections содержат concrete evidence или explicit blockers/gaps.
   - docs содержат material для `skill-generation-blueprint`: проектные привязки, локальные антипаттерны, подсказки поиска source, commands/checks и risk/refactor links.
   - enterprise docs не помечают Jira/Confluence как unavailable, если discovery подтвердил approved env source и helper-only policy можно создать.
9. Для enterprise setup обязательно проверь:
   - `.tmp/integration-env.sh`, `.tmp/jira-rest.sh`, `.tmp/confluence-rest.sh` существуют, если Jira/Confluence включены;
   - docs содержат helper path, required variable names, probe, read/write boundary и fail-fast policy; абсолютный env path остается только в ignored `.tmp/integration-env.sh`;
   - docs не содержат token values.
10. Убедись, что docs полезны для merge existing local skills:
   - `existing-rules-merge.md` содержит local skills inventory;
   - `existing-rules-merge.md` содержит authority matrix;
   - `knowledge-index.md` и `agent-operating-model.md` ссылаются на authoritative local skills, если они есть;
   - generated docs не объявляют generated skill authoritative там, где authority осталась у existing local skill.
11. Оцени docs/RAG по `bootstrap-quality-contract.md`.
   - `RAG usefulness`, `Risk/refactor value` и docs evidence должны быть `10/10`.
   - Если score ниже 10, вернись к нужному doc и уплотни routing/evidence/risks/refactor/checks.
   - Не переходи к skills, пока docs/RAG score ниже 10.

## Контрольные gates

- Не пиши docs как marketing text.
- Не скрывай uncertainty; записывай gaps.
- Не дублируй длинный контент между docs и skills.
- Не включай secrets, credentials или private tokens.
- Не записывай active enterprise workflow без подтвержденного метода доступа, credential source, probe, permissions и fail-fast rules.
- Если Jira/Confluence/GitLab config неполный, документируй `unavailable` и следующий action вместо guessed fallback.
- Если env source подтвержден пользователем или existing rules, документируй helper-only access method и required variables без secret values.
- Если пользователь пропустил enterprise setup, документируй `skipped by user` и fail-fast правило для Jira/Confluence tasks.
- Если deep scan пропущен пользователем, создай только preliminary/minimal docs и явно запиши последствия: нет полноценной RAG базы, project map, risk register, refactor plan и concrete stack-specific guidance.
- Не принимай research output без layer classification и defect hunt matrix как полноценный deep research.
- Не создавай refactor plan, который не связан с confirmed findings из defect hunts.
- Не завершай bootstrap/research docs без agent knowledge base, knowledge index, project map, risk register и refactor plan. Если нет evidence, создай gap/blocker вместо пустого документа.
- Не завершай bootstrap docs без полного русскоязычного `full-project-research-report.md`.
- Не создавай bootstrap docs/RAG базу из непроверенного shallow discovery. Нужен passed research evidence pack.
- Не создавай RAG/skills source docs, если full research не покрывает stack, dependencies, architecture, data-flow, security, performance, testing и refactor opportunities.
- Не принимай research evidence pack как passed, если coverage основан на `sampled`, `reviewed by tree`, file counts или shallow search output.
- Не создавай project map/RAG из flow summaries без concrete trace chains и source evidence.
- Не создавай docs как пересказ stack; каждый ключевой документ должен содержать flows, risks, evidence или next actions.
- Не превращай `full-project-research-report.md` в короткий конспект. Это отчет для разработчиков, а не README.
- Не сокращай `research-evidence-pack.md` до summary; он должен сохранять evidence tables.
- Не выбрасывай sections из docs templates. Если section не применима, запиши `не применимо` с evidence.
- Не превращай knowledge base в dump всех docs; это компактный retrieval layer.
- Не принимай risk register без trigger/impact/check/status как готовый.
- Не принимай dependency review без usage evidence и audit freshness как готовый.
- Не принимай RAG базу, если `knowledge-index.md` не ведет агента к source/source code и проверкам по основным типам задач.
- Не создавай fake RAG/project map/refactor plan при degraded install.
- Не создавай docs/RAG, которые игнорируют existing local skills или authority matrix.
- Не создавай docs/RAG без пакет привязок для skills. Иначе generated skills снова станут generic.
- Не создавай full research docs без evidence рабочей памяти, если deep scan был включен.

## Условия остановки

- Discovery и audit outputs отсутствуют.
- Existing docs авторитетны и конфликтуют с generated text.
- Target docs path неясен, и запись загрязнит repo.
- Enterprise docs требуются, но discovery не содержит достаточно evidence для безопасной access policy.
- Project map или critical flows нельзя построить по available evidence.
- Knowledge base противоречит project map/risk register/current state.
- Bootstrap research evidence pack отсутствует или coverage/depth validation failed.
- Bootstrap research evidence pack содержит surrogate coverage pass: sampling/tree review/counts вместо concrete traces.
- Full project research report отсутствует, не на русском или не содержит dependency/security/performance/testing/code-review sections.
- Risk/RAG/dependency sections слишком generic: нет actionable risks, routing rows, usage evidence или audit freshness.
- Full report/evidence pack/RAG слишком сжатые и не дают следующему агенту source retrieval, flow traces и defect hunt details.
- Full deep scan заявлен, но `docs/agent-system/research-workspace/evidence-log.md` отсутствует, пустой или не отражен в `research-evidence-pack.md`.
- Research/docs не дают проектные привязки/локальные антипаттерны/подсказки поиска source для generated skills.
- Docs/RAG не дотягивают до `10/10` по `bootstrap-quality-contract.md`.
- Degraded install не подтвержден пользователем, но deep scan пропущен.
- Enterprise setup включен, но helper files отсутствуют или docs не фиксируют helper-only policy.
- Local skills/rules найдены, но `existing-rules-merge.md` отсутствует или не содержит authority matrix.

## Формат результата

```markdown
Сгенерированные/обновленные docs:
- Path:
  Назначение:
  Inputs:
  Gaps/blockers:
```
