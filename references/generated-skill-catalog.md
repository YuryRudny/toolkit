# Generated Skill Catalog

Используй этот catalog в `project-skills-assembler` как список target skills. Не пиши skills свободным текстом: каждый full-install quality/stack/domain skill собирается через selected library skill, adaptation sheet и `.full.template.md`.

## Required Core

При генерации используй concrete templates из `reusable-agent-system-toolkit/templates/skills/` как baseline для ключевых skills и `skill-generation-blueprint.md` как алгоритм сборки. Catalog задает состав системы, templates задают минимальное качество реализации, blueprint задает глубину и project-specific адаптацию.

### workflow-router

Маршрутизирует запросы пользователя в режимы. Должен быть первым skill для обычной работы.

Обязательное поведение:

- `ресерч`, `research`, "глубокий анализ", "найди слабые места" сразу включают Research mode;
- если scope не указан, Research mode берет весь проект;
- router не задает серию уточняющих вопросов, если можно безопасно начать research всего проекта;
- для первого bootstrap или missing docs case router требует docs artifacts, а не chat-only отчет.
- для обычных задач router сначала использует `knowledge-base.md` и `knowledge-index.md`, чтобы не тратить токены на повторный full discovery.
- первый bootstrap не генерирует skills/maps/modes до full project research report, RAG base и passed research evidence pack.

Modes:

- development/task mode;
- refactor mode;
- research mode;
- review mode;
- merge mode;
- summary mode;
- small scoped change mode.

### general

Базовое поведение: держать scope, защищать dirty worktree, следовать local rules, запускать checks, честно сообщать gaps.

### project-authority

Project-specific constraints: stack facts, critical flows, secrets policy, build/test commands, architecture boundaries.

Должен ссылаться на agent knowledge base/index как first-read source.

### pre-change-checklist

Gate перед file edits: branch/status, scope, unrelated changes, affected flows, risk patterns, required checks.

### review-checklist

Финальный gate: correctness, architecture, type/runtime safety, security, performance, tests, evidence, gaps.

Должен подключать stack-quality skills по touched layer: frontend/backend/API/data/testing/security/performance.

### evidence-pack

Delivery evidence: commands, tests, browser/network/runtime observations, gaps, blockers, touched flows.

### semantic-commit-flow

Группировка commits по intent; запрещает `git add -A` без анализа.

## Обязательные Quality Playbooks

Эти skills обязательны для full install. Они должны быть самостоятельными senior playbooks: брать quality seed как пример, адаптировать его через RAG/project evidence и давать агенту рабочий процесс принятия решений.

Каждый quality playbook должен покрывать роли. Роли можно держать отдельными секциями или объединять, если они остаются явно проверяемыми:

- `Когда использовать`;
- `Не использовать когда`;
- `Обязательные Чтения`;
- `Быстрый Маршрут По RAG`;
- `Использованные Seeds`;
- `Карта Контекста Проекта`;
- `Проектные Привязки`;
- `Локальные Антипаттерны И Риски`;
- `Планка Качества`;
- `Порядок работы`;
- `Проверки По Слою`;
- `Контрольные gates`;
- `Условия остановки`;
- `Формат результата`.

### code-review-and-quality

Проводит multidimensional review: correctness, readability, architecture, security, performance, testing, severity и verdict.

Обязательное поведение:

- сначала понять requirement и diff scope;
- читать RAG/current risks перед выводами;
- проверять tests до implementation details;
- классифицировать findings по severity;
- не создавать шум style-комментариями, которые ловятся tooling;
- требовать исправить unsafe/fragile code в touched area или записать risk/refactor gap.

### debugging-and-error-recovery

Системно ведет bug/build/test/runtime failure до root cause.

Обязательное поведение:

- stop-the-line при неожиданной ошибке;
- сохранить evidence сбоя;
- воспроизвести или зафиксировать невозможность воспроизведения;
- локализовать layer и сократить failing case;
- исправить root cause, а не симптом;
- добавить regression protection или documented test gap.

### refactor-engineering

Выполняет безопасный refactor slices из `refactor-plan.md` и touched-area risks.

Обязательное поведение:

- защитить behavior before structure change;
- работать маленькими slices;
- отделять refactor от feature changes;
- проверять callers/consumers;
- обновлять RAG/refactor/risk docs при изменении boundaries.

## Modes

### development-mode

Workflow реализации задачи. Если есть Jira/Linear/GitHub Issues, адаптировать под этот tracker.

### refactor-mode

Работает slices из refactor plan/current state/worklog. Предотвращает broad cleanup.

### research-audit

Глубокий анализ без code edits по умолчанию. Findings только evidence-based.

Обязательные свойства generated skill:

- default scope = весь проект, если пользователь просто написал "ресерч";
- no code edits by default;
- layer classification обязательна для full-project research;
- defect hunts обязательны для применимых слоев;
- audit areas: architecture, domain logic, data contracts, async/race, type/runtime safety, UI/accessibility, security/privacy, performance, testing/observability, process risks;
- security/performance/resource leak review требует evidence или explicit gaps;
- если project docs отсутствуют или research идет в bootstrap, создать/обновить project map, risk register, refactor plan, smoke checklist и current state/worklog;
- поверхностное summary по стеку запрещено как финальный результат.

### merge-flow

Закоммитить текущую работу по смыслу, смержить target branch, семантически решить conflicts, провести review touched files.

### summary-mode

Отчеты по работе без изменения кода.

## Domain Skills

Генерировать по результатам discovery:

- frontend-ui-engineering;
- frontend-state-and-data;
- backend-engineering;
- api-contract-safety;
- database-safety;
- auth-security;
- infrastructure-deploy;
- testing-strategy;
- performance-observability;
- domain-specific critical module skills.

## Stack Quality Skills

Генерировать по stack profile:

- `frontend-ui-engineering` - если есть user-facing UI;
- `frontend-state-and-data` - если есть client state/data fetching;
- `backend-engineering` - если есть backend/API/workers;
- `api-contract-safety` - если API contracts важны;
- `database-safety` - если есть persistence/migrations;
- `testing-strategy` - всегда, если в проекте есть исполняемый код;
- `security-performance-review` - всегда для production code.

Каждый stack-quality skill должен:

- быть адаптирован к реальным frameworks/libraries проекта;
- иметь trace адаптации seed: какой seed выбран, что из него взято как пример, какие project evidence использованы, что отброшено;
- покрывать роли: `Когда использовать`, `Не использовать когда`, `Быстрый Маршрут По RAG`, `Карта Контекста Проекта`, `Проектные Привязки`, `Локальные Антипаттерны И Риски`, `Планка Качества`, `Порядок работы`, `Контрольные gates`, `Проверки По Слою`, `Условия остановки`, `Формат результата`;
- требовать touched-area review;
- запрещать копировать unsafe local patterns как норму;
- требовать исправлять локально unsafe/fragile code, если это безопасно и в scope;
- требовать risk/refactor entry, если исправление выходит за scope;
- давать gates для pre-change и final review.

## References И Docs

Docs/RAG artifacts генерировать в project docs path. В full install `codex-skills/references` обязателен как operational support для skills, но references не должны копировать docs.

Project docs:

- project-map.md;
- knowledge-base.md;
- knowledge-index.md;
- full-project-research-report.md;
- research-evidence-pack.md;
- architecture-map.md;
- risk-register.md;
- refactor-plan.md;
- smoke-checklist.md;
- stack-profile.md;
- current-state.md;
- research-worklog.md;
- existing-rules-merge.md;
- generated-system-validation.md;
- bootstrap-acceptance-checklist.md;
- domain-specific maps.

Skill references не должны быть копиями этих docs. Обязательные full-install references:

- `code-review-playbook.md`;
- `debugging-playbook.md`;
- `refactor-playbook.md`;
- `testing-playbook.md`;
- `security-performance-playbook.md`;
- `frontend-ui-playbook.md`, если проект имеет UI;
- `backend-api-playbook.md`, если проект имеет backend/API;
- `data-safety-playbook.md`, если проект имеет database/persistence.

Каждый reference должен содержать operational guidance:

- локальные examples хорошего/плохого pattern;
- command recipes для checks;
- retrieval hints по source areas;
- stack-specific gotchas;
- small decision trees/checklists, которые не дублируют RAG;
- links на risk/refactor items.

## Anti-Duplication Rules

- Router routes. Domain skills не маршрутизируют работу сами.
- Project authority хранит project-wide facts.
- Stack skills хранят engineering standards.
- Domain skills хранят module-specific constraints.
- Review checklist хранит final quality gate.
- Evidence pack хранит delivery proof.
- `codex-skills/references` не зеркалит `docs/agent-system`; если нет новой operational value, skill должен ссылаться прямо на docs.
