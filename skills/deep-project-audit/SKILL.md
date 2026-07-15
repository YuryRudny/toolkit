---
name: deep-project-audit
description: Проводит evidence-based глубокий аудит любого репозитория перед генерацией project-local agent rules. Используй для поиска architecture drift, fragile logic, type safety issues, race conditions, security risks, performance problems, missing tests и weak ownership boundaries.
---

# Deep Project Audit

## Обзор

Аудитируй проект как senior engineer, который готовит долгоживущую codebase к надежной AI-assisted development. Код по умолчанию не редактируй.

Если audit запускается в bootstrap или пользователь пишет "ресерч" без уточнения scope, default scope = весь проект. Не задавай уточняющие вопросы, если можно безопасно начать research всего проекта и сузить findings по evidence.

## Обязательные Чтения

- `reusable-agent-system-toolkit/references/audit-matrix.md`
- `reusable-agent-system-toolkit/references/adversarial-codebase-research.md`
- `reusable-agent-system-toolkit/references/research-working-memory.md`
- `reusable-agent-system-toolkit/references/deep-research-execution-algorithm.md`
- `reusable-agent-system-toolkit/references/research-mode-guide.md`
- `reusable-agent-system-toolkit/references/deep-bootstrap-research.md`
- `reusable-agent-system-toolkit/references/full-project-research.md`
- `reusable-agent-system-toolkit/references/bootstrap-quality-contract.md`
- `reusable-agent-system-toolkit/templates/research-forms/module-inventory.form.md`
- `reusable-agent-system-toolkit/templates/research-forms/critical-flows.form.md`
- `reusable-agent-system-toolkit/templates/research-forms/boundary-contract-review.form.md`
- `reusable-agent-system-toolkit/templates/research-forms/defect-hunt.form.md`
- `reusable-agent-system-toolkit/templates/research-forms/dependency-review.form.md`
- `reusable-agent-system-toolkit/templates/research-forms/security-review.form.md`
- `reusable-agent-system-toolkit/templates/research-forms/performance-resource-review.form.md`
- `reusable-agent-system-toolkit/templates/research-forms/testing-ci-review.form.md`
- `reusable-agent-system-toolkit/templates/research-forms/refactor-candidates.form.md`

## Порядок работы

1. Начни с результата `project-discovery`.
2. Определи audit scope: весь проект или выбранные modules. Если scope не задан и это bootstrap/research command, бери весь проект.
3. Если audit идет в bootstrap/deep scan, используй `research-working-memory.md`:
   - создай или обнови `docs/agent-system/research-workspace/research-plan.md`;
   - после каждого pass обновляй `research-notes.md` и `evidence-log.md`;
   - ошибки чтения, команд и blocked checks записывай в `error-log.md`;
   - решения о применимости слоев, skipped integrations и generated skills записывай в `decisions.md`;
   - перед major decision перечитывай `research-plan.md`.
4. Создай `docs/agent-system/research-workspace/forms/` и скопируй/заполни research forms из `templates/research-forms/*`. Audit считается готовым к docs только если формы заполнены project evidence.
5. Выполни `deep-research-execution-algorithm.md` как основной маршрут audit:
   - Pass 1: module inventory;
   - Pass 2: hot spots and blast radius;
   - Pass 3: entry points and critical flow traces;
   - Pass 4: contract and boundary review;
   - Pass 5: defect hunts;
   - Pass 6: dependency usage review;
   - Pass 7: tests/CI/local verification;
   - Pass 8: findings to docs/RAG/skill payload.
6. Выполни layer classification из `adversarial-codebase-research.md` и запиши результат в `defect-hunt.form.md`: какие слои проекта применимы, не применимы или неясны, с evidence.
7. Выполни обязательные defect hunts из `adversarial-codebase-research.md` для каждого применимого слоя и запиши их в `defect-hunt.form.md`: correctness/domain logic, architecture/ownership, data/API/contracts, security/privacy, performance/resource leaks, type/runtime safety, testing/CI/observability, dependencies/supply chain.
8. Если audit идет в bootstrap, проверь coverage criteria из `deep-bootstrap-research.md`, `full-project-research.md`, `deep-research-execution-algorithm.md` и `adversarial-codebase-research.md`: stack/runtime, dependencies/libraries, top-level modules, entry points, critical flows, data/API contracts, shared high-risk areas, auth/security, async/cache/concurrency, performance/resource leaks, testing/CI, commands/deploy. `sampled`, `reviewed by tree`, file counts и shallow search output не дают `coverage pass`.
9. Проведи audit по категориям:
   - architecture boundaries;
   - dependency/library risks: heavy, redundant, outdated/deprecated/security-sensitive candidates;
   - business/domain logic;
   - async/race/concurrency risks;
   - type safety and data validation;
   - API and persistence contracts;
   - UI/UX/accessibility, если frontend есть;
   - security/privacy;
   - performance;
   - testing and observability;
   - agent workflow/process risks.
10. Для каждого finding запиши severity, evidence, impact и recommendation.
11. Отдели confirmed findings от hypotheses и gaps.
12. Сформируй full project research report, research evidence pack и coverage result только из заполненных forms/workspace evidence.
13. Оцени research по `bootstrap-quality-contract.md`.
   - `Research depth` должен быть `10/10`.
   - `Evidence quality` должен быть `10/10`.
   - Если любой score ниже 10, вернись в конкретный pass/forms и дополни evidence.
14. Сформируй docs payload для `project-docs-generator`: full research report, research evidence pack, risk register rows, refactor slices, smoke checklist items, project map updates и current-state заметки.
15. Сформируй пакет привязок для skills: какие проектные привязки, локальные антипаттерны, подсказки поиска source, commands/checks и risk/refactor links должны попасть в future assembled skills/references.
16. Передай результаты в `project-docs-generator`. `project-skills-assembler` можно запускать только после `Docs/RAG Ready`, а не напрямую из audit.

## Контрольные gates

- Каждый confirmed finding должен иметь evidence.
- Security/performance claims требуют code, config, dependency или runtime evidence.
- Не считай все smells одинаковыми; ранжируй по blast radius и user/business impact.
- Не предлагай broad rewrites, если есть focused remediation.
- Не завершай research поверхностным summary по стеку. Нужны findings/gaps, project map impact и refactor/smoke follow-up.
- Не смешивай confirmed findings, hypotheses и gaps.
- Не ставь coverage `pass`, если layer classification или defect hunts отсутствуют.
- Не считай security/performance/resource review завершенным, если нет проверенных defect classes и evidence paths.
- Если research не нашел ни одного риска в сложном legacy проекте, coverage должен доказать это evidence matrix. Иначе это gap, не pass.
- Не ставь bootstrap coverage `pass`, если flow trace не показывает concrete path: entry -> state/service/composable -> repository/server route -> DTO/API/persistence/external system.
- Не ставь `pass` по module/entry/contract только потому, что видел tree или sample files.
- В bootstrap нельзя передавать docs/skills generator-ам результат audit без coverage/depth validation.
- В bootstrap нельзя передавать docs/skills generator-ам результат audit без full project research report на русском.
- В bootstrap нельзя передавать docs/skills generator-ам результат audit без пакет привязок для skills: проектные привязки, локальные антипаттерны, retrieval hints, commands/checks.

## Условия остановки

- Audit scope не определен и это не bootstrap/research command, где можно безопасно взять весь проект.
- Evidence слишком слабая для finding.
- Runtime/browser/network checks нужны, но заблокированы и не отмечены как gaps.
- Project docs должны быть обновлены, но target path конфликтует с existing rules.
- Bootstrap coverage criteria не пройдены.
- Bootstrap coverage criteria формально отмечены `pass`, но evidence содержит sampling/tree review/counts вместо traces.
- Dependency/security/performance/testing sections отсутствуют или являются generic text без evidence.
- Layer classification отсутствует.
- Defect hunts отсутствуют или заменены generic checklist text.
- Resource leak/performance/security review не содержит конкретных проверенных classes.
- Deep research execution passes не выполнены или заменены кратким описанием.
- Research не дал material для generated skills: проектные привязки, локальные антипаттерны, подсказки поиска source.
- Bootstrap/deep scan идет без файлов рабочей памяти или `evidence-log.md` пустой.
- Research forms из `docs/agent-system/research-workspace/forms/*` отсутствуют или заполнены generic text без evidence.
- Research не дотягивает до `10/10` по `Research depth` или `Evidence quality` из `bootstrap-quality-contract.md`.

## Формат результата

```markdown
Находки аудита:
- [Severity] Title
  Evidence:
  Impact:
  Recommendation:

Гипотезы:
Gaps/blockers:
Docs payload:
- Full project research report:
- Research evidence pack:
- Coverage/depth validation:
- Layer classification:
- Defect hunts:
- Project map updates:
- Risk register:
- Refactor plan:
- Smoke checklist:
- Skill hooks:
Recommended docs/skills:
```
