# Manifest

## Installation flow

Sidecar workspace определяется наличием `workspace.json` в Git-корне artifact repository. В этом режиме toolkit path берётся из manifest, customer repositories остаются read-only, а все generated artifacts пишутся в artifact repository.

1. Запускай только локальный bootstrap файл из корня целевого проекта: `./reusable-agent-system-toolkit/skills/project-agent-bootstrap/SKILL.md`. Не ищи bootstrap в `~/.codex`, plugins, `node_modules` или соседних проектах; если локального файла нет, остановись без fallback skills.
2. Следуй `bootstrap-strict-algorithm`: фазы нельзя менять местами.
3. Install wizard спрашивает путь до `.env` для Jira/Confluence/GitLab/Figma/MCP access, объясняет зачем он нужен и что secret values не будут печататься или копироваться.
4. В sidecar режиме отрендери `bin/enterprise-mcp.js` и запусти `agentctl integrations configure <env-path>`: команда создаёт ignored local config, устанавливает MCP и выполняет read-only probes. В project-local режиме используй `.tmp/integration-env.sh`, `.tmp/jira-rest.sh`, `.tmp/confluence-rest.sh`. Если probe не работает, остановись с точным blocker или продолжай только после явного `пропустить`.
5. Только после enterprise setup `pass` или `skipped` install wizard спрашивает, запускать ли deep scan. Он обязан предупредить, что scan может занять время и потратить токены.
6. Если пользователь пропускает deep scan, предупреди о последствиях: нет полноценной RAG базы, project map, risk register, refactor plan и concrete stack-specific skills. Продолжай только как `degraded install`.
7. Если deep scan разрешен, используй единый `scripts/bootstrap.js`: создай canonical `project-model.json`, topology-based research task graph, заполни evidence/forms, собери RAG/docs, затем выполни capability-based seed selection, structured skill inputs, seed extraction, full skill render, registry-based operational render, вычисляемый quality report и validation result.
8. Если deep scan пропущен, создай только minimal docs/skills с marker `Degraded install: deep scan skipped by user`; не называй RAG/project map/refactor plan готовыми.
9. В project-local режиме добавь `reusable-agent-system-toolkit/` в `.gitignore` целевого проекта. В sidecar режиме вместо этого выполни `workspace-verify`, сгенерируй `bin/agentctl.js` и `bin/enterprise-mcp.js`, проверь `commit-plan`; customer repositories менять запрещено.

## Не цели

- Не создавать универсальный coding style на все случаи.
- Не заменять существующие team rules без conflict analysis.
- Не генерировать skills, которые просто повторяют общие советы по программированию.
- Не генерировать code review, debugging, refactor и stack skills как короткие чеклисты. В full install это должны быть senior playbooks с workflow, gates, stop conditions, checks и проектные привязки.
- Не создавать `codex-skills/references` как копию `docs/agent-system`.
- Не генерировать stack skills без senior-quality gates для touched-area review, remediation и risk/refactor gaps.
- Не считать generated system готовой без deterministic validation.
- Не считать full bootstrap готовым без `docs/agent-system/bootstrap-quality-report.md` и `Full bootstrap quality: 10/10`.
- Не считать bootstrap готовым без knowledge base/index для последующей token-efficient работы.
- Не генерировать final skills/maps/modes до full research report, RAG базы и passed deep research coverage gate.
- Не генерировать fake RAG/project map/refactor plan, если пользователь пропустил deep scan.
- Не оставлять Jira/Confluence setup на словах: helper scripts должны быть созданы из toolkit templates.
- Не спрашивать deep scan до завершения enterprise/MCP setup.
- Если `templates/enterprise-scripts/*` отсутствуют, это stale/incomplete toolkit copy; остановись и попроси обновить toolkit.
- Не допускать попадания toolkit или agent-system artifacts в customer-code repository; в sidecar режиме они коммитятся только в отдельные внутренние repositories.
- Не читать `templates/skills/*` и `generated-skill-catalog.md` до artifact gate `Docs/RAG Ready`.
- Не считать первый bootstrap завершенным после поверхностного summary по стеку.
- Не считать deep research завершенным без layer classification, defect hunt matrix и evidence по применимым defect classes.
- Не считать deep research завершенным без module inventory, hot spots, critical flow traces, boundary/contract review, dependency usage review и пакет привязок для skills.
- Не считать deep research завершенным без рабочей памяти: `research-plan.md`, `research-notes.md`, `evidence-log.md`, `error-log.md`, `decisions.md`.
- Не генерировать full-install skills свободным текстом. Skills должны рендериться через `project-skills-assembler`: target skill -> selected library skill -> per-skill assembly sheet -> `.full.template.md` -> project-local `SKILL.md`.
- Не писать full-install `SKILL.md` руками: агент заполняет `docs/agent-system/skill-inputs/*.json`, а `render-skills.js` компилирует markdown.
- Не создавать grouped assembly вроде `stack-skills.md`: один full-install target skill = один assembly sheet = один full template render.
- Не генерировать full-install quality/stack skills без выбора seeds из `skill-seeds/manifest.json`.
- Не копировать seed playbooks как готовые project skills: они должны адаптироваться через RAG, project map, risks, refactor plan и existing rules.
- Не генерировать Research mode, который при команде "ресерч" несколько раз переспрашивает scope вместо research всего проекта по умолчанию.
- Не заявлять, что checks пройдены, если они не запускались.
- Не применять frontend-only practices к backend-only проектам и наоборот.
- Не принимать `9/10` как успешный full install: ниже 10 означает repair loop.

## Target layout по умолчанию

```text
codex-skills/
  skills/
    workflow-router/
    project-authority/
    research-audit/
    review-checklist/
    pre-change-checklist/
    stack-quality/
    git-remote-flow/
    code-review-and-quality/
    debugging-and-error-recovery/
    refactor-engineering/
    stack-engineering/
    frontend-ui-engineering/
    backend-engineering/
    testing-strategy/
    security-performance-review/
    domain-.../
  references/
    code-review-playbook.md
    debugging-playbook.md
    refactor-playbook.md
    testing-playbook.md
    security-performance-playbook.md
    frontend-ui-playbook.md
    backend-api-playbook.md
skill-seeds/
  manifest.json
  README.md
  architecture/
  frontend/
  backend/
  testing/
  validation/
  mobile/
  external/
    agent-skills-main.manifest.json
    agent-skills-main.index.md
    agent-skills-main/
    ai-agents-skills-main.manifest.json
    ai-agents-skills-main.index.md
    ai-agents-skills-main/
docs/
  project-model.json
  authority-map.json
  skill-registry.json
  validation-result.json
  agent-operating-model.md
  bootstrap-quality-report.md
  project-overview.md
  full-project-research-report.md
  knowledge-base.md
  knowledge-index.md
  architecture-map.md
  risk-register.md
  refactor-plan.md
  current-state.md
  research-worklog.md
  research-workspace/
    forms/
    research-tasks.json
  skill-inputs/
    index.json
  seed-extractions/
  skill-assembly/
scripts/
  bootstrap.js
  bootstrap-state.js
  create-project-model.js
  create-research-tasks.js
  init-research-workspace.js
  create-skill-inputs.js
  finalize-skill-inputs.js
  extract-seed-playbooks.js
  render-skills.js
  render-operational-skills.js
  create-skill-registry.js
  create-authority-map.js
  generate-quality-report.js
  check-bootstrap-state.js
tests/
  run-tests.js
.tmp/
  integration-env.sh
  jira-rest.sh
  confluence-rest.sh
```

Точный layout можно адаптировать под существующую структуру проекта, но итоговая система должна сохранить router-first поведение и evidence gates.
