# Skill Generation Blueprint

Используй этот reference в `project-skills-assembler` после `Docs/RAG Ready`.

Цель - рендерить project-local skills как полноценные senior playbooks, а не набор общих правил. Каждый generated skill должен быть построен из research evidence проекта: flows, risks, boundaries, dependencies, local patterns, existing rules и refactor plan.

Если в toolkit есть подходящий seed из `skill-seeds`, используй его как scaffold качества. Seed не заменяет RAG и не является готовым skill: он задает инженерную глубину, направления проверок и baseline workflow, а project docs дают конкретные привязки.

## Главный Принцип

Skill - это не пересказ docs. Skill отвечает на вопрос: "как агент должен работать в этом проекте, чтобы писать и проверять код уровня senior engineer".

Docs/RAG отвечают "что мы знаем о проекте". Skill отвечает "что делать с этим знанием в задаче".

Если skill можно перенести в другой проект почти без изменений, он недостаточно project-specific.

## Линия Сборки Для Каждого Skill

Перед созданием каждого full-install quality/stack/domain skill заполни отдельный файл `docs/agent-system/skill-inputs/<skill-name>.json` по `schemaVersion: 2`.

Внутренняя карта в голове или чате не считается выполнением blueprint. Source-of-truth для сборки - v2 input на диске. `docs/agent-system/skill-assembly/<skill-name>.md` создаёт renderer, а не агент вручную.

```text
1. Назначение skill:
   - какие задачи он маршрутизирует или выполняет;
   - какие слои/flows проекта покрывает;
   - когда его не использовать.

2. Входные evidence:
   - какие docs/RAG sections прочитаны;
   - какие source areas и critical flows связаны со skill;
   - какие risk/refactor IDs должны влиять на работу;
   - какие existing local rules имеют authority.
   - какие selected seeds применимы и почему.

3. Проектные привязки:
   - реальные директории/модули/entry points;
   - реальные локальные patterns, которые стоит сохранять;
   - реальные антипаттерны/тонкие места, которые нельзя копировать;
   - реальные команды/smoke checks.

4. Senior-процесс:
   - порядок действий агента;
   - как собрать context;
   - как принять инженерное решение;
   - что исправить сразу в touched area;
   - что вынести в risk/refactor docs.

5. Планка качества:
   - критерии production-ready результата;
   - layer-specific checks;
   - security/performance/testing/accessibility gates, если применимо.

6. References:
   - какие skill-specific references нужны;
   - что в них лежит: примеры, подсказки поиска, локальные patterns, команды, тонкие места;
   - чем они отличаются от docs/agent-system.
```

## Как Использовать Seed Library

Перед full-install генерацией quality/stack skills прочитай `skill-seed-library.md` и результат выбора seeds.

Правильная схема:

```text
selected seed -> extract-seed-playbooks.js -> concrete extracted scaffold
RAG/project docs -> source truth and project details
existing-rules-merge -> authority and merge boundaries
schemaVersion 2 skill input -> Russian project-local senior playbook render
skill reference -> operational examples, search hints, checks
```

Для каждого generated quality/stack skill укажи в `skill-inputs/<skill-name>.json` и кратко в самом skill:

- какие seeds использованы;
- какие project files/flows подтвердили применимость;
- какие части seed были адаптированы;
- какие seed ideas skipped как неприменимые;
- какие local risks/refactor items усилили skill.

## Матрица Адаптации Seed

Перед рендером каждого quality/stack/domain skill составь матрицу адаптации внутри `docs/agent-system/skill-inputs/<skill-name>.json`: `selectedSeeds`, `seedExtractions`, `seedRejections`, `projectHooks`, `criticalFlows`, `localRisks`, `workflowSteps`, `layerChecks`. `seed-selection.md`, `stack-profile.md`, `knowledge-index.md` и bootstrap summary могут ссылаться на выбор seeds, но не заменяют per-skill v2 input.

Перед render запусти `node reusable-agent-system-toolkit/scripts/extract-seed-playbooks.js .`. Он создает `docs/agent-system/seed-extractions/<skill-name>.json` и заполняет `seedExtractions[]` реальными секциями/rules/gates/result format из selected seed.

`seedExtractions[]` обязателен для каждого selected seed:

```json
{
  "seedId": "external-code-review-and-quality",
  "sourcePath": "skill-seeds/external/ai-agents-skills-main/skills/code-review-and-quality/SKILL.md",
  "sectionsUsed": ["критерии качества", "процесс review", "severity policy"],
  "rulesTaken": ["проверять correctness/architecture/security/performance/tests"],
  "rulesRejected": ["правила чужого стека без evidence"],
  "projectAdaptation": ["связано с R-SEC-1/R-FORM-1 и project hooks"]
}
```

Если seed только указан названием, но нет `docs/agent-system/seed-extractions/<skill-name>.json`, `extractedSections`, `qualityGates`, `rulesTaken` и `projectAdaptation`, библиотека считается неиспользованной.

```markdown
## Seed Adaptation Matrix: <target skill>

| Поле | Значение |
| --- | --- |
| Target skill | |
| Selected seed/source | seed id, library, path |
| Почему выбран | dependency/path/stack/RAG evidence |
| Назначение seed | какие задачи seed решает |
| Триггеры seed | когда seed включается |
| Структура seed | какие секции/этапы/quality gates взяты как пример |
| Проектные evidence | paths, flows, risks, refactor items, commands |
| Что адаптировано | seed idea -> project-specific instruction |
| Что отброшено | seed idea -> почему не применимо |
| Skill references | какие `codex-skills/references/*` нужны |
| Language adaptation | как runtime instructions переведены на русский |
```

Правильная адаптация seed выглядит так:

```text
seed section: "Review correctness, readability, architecture, security, performance"
project evidence: "risk-register.md R-3/R-7, source path src/api/*, smoke API auth flow"
generated skill: "При review API изменений сначала проверь contract/auth/error boundaries в src/api/*, затем..."
```

Неправильно:

```text
seed прочитан -> generated skill: "Проверь корректность, читаемость, архитектуру, безопасность и производительность."
```

Такой текст не использует RAG и не показывает проектную адаптацию.

## Шаблон Сборки Skill

Skill может быть короче или длиннее, но он не может быть shortcut. Качество определяется тем, что финальный `SKILL.md` является clean render одного target full template, а каждая роль ниже заранее заполнена в assembly sheet через `Final text for SKILL.md`.

Обязательные роли для full-install quality/stack/domain skill:

- `Назначение`: какие задачи skill выполняет и где его границы.
- `Триггеры`: когда использовать и когда не использовать.
- `RAG маршрутизация`: какие docs читать первыми и где искать scoped context.
- `Seed adaptation`: какие seeds использованы и как они повлияли на workflow.
- `Project context`: реальные paths, flows, boundaries, commands, local patterns.
- `Risk context`: local antipatterns, risk/refactor IDs, known gaps.
- `Senior workflow`: последовательность действий агента при задаче.
- `Quality bar`: что считается production-ready результатом для слоя.
- `Layer checks`: security/performance/testing/accessibility/data checks по применимому слою.
- `Decision protocol`: что исправлять сразу, что записывать в risk/refactor, когда остановиться.
- `Result format`: как агент должен отчитаться.

Рекомендуемая русская структура:

```markdown
---
name: ...
description: ...
---

# ...

## Обзор

## Когда использовать

## Не использовать когда

## Обязательные Чтения

## Быстрый Маршрут По RAG

## Использованные Seeds

## Карта Контекста Проекта

## Проектные Привязки

## Локальные Антипаттерны И Риски

## Планка Качества

## Порядок работы

## Проверки По Слою

## Контрольные gates

## Условия остановки

## Формат результата
```

Компактность допустима только внутри текста конкретной template section. Не объединяй template sections, не создавай собственную структуру и не заменяй роли общими фразами вроде "прочитай RAG и проверь качество".

Если seed пришел из external library:

- сначала используй external index/manifest;
- открывай только selected external `SKILL.md`;
- bundled references/rules/assets/scripts читай только если они нужны конкретному generated skill;
- переводи runtime-инструкции на русский и адаптируй к проекту;
- не переноси чужие project names, commands, paths или assumptions без evidence.

Запрещено:

- копировать `SEED.md` в `codex-skills/skills`;
- копировать external `SKILL.md` в `codex-skills/skills`;
- оставлять английские runtime instructions из внешних skills;
- выбирать seed без evidence;
- использовать seed вместо project-specific examples;
- считать skill качественным только потому, что seed был прочитан.

`Проектные Привязки` и `Локальные Антипаттерны И Риски` обязательны для full install как роли. Они должны ссылаться на реальные source paths, risk IDs, refactor slices, commands или known gaps. Без этих ролей skill превращается в generic advice.

## Как Адаптировать Templates

Не пересказывай template своими словами без адаптации.

Для каждого generated skill:

1. Открой соответствующий template.
2. Заполни `docs/agent-system/skill-inputs/<skill-name>.json` по `schemaVersion: 2`.
3. Для каждой смысловой роли template заполни typed field:
   - назначение и trigger -> `overview`, `useWhen`, `doNotUseWhen`;
   - RAG/source routing -> `ragRoutes`, `projectHooks`;
   - base input из selected seed/base skill -> `selectedSeeds`, `seedExtractions`, `seedRejections`, `workflowSteps`;
   - project evidence -> `criticalFlows`, `localRisks`, `preferredPatterns`, `antiPatterns`;
   - проверяемый процесс -> `layerChecks`, `gates`, `stopConditions`, `resultFormat`.
4. Сохрани все смысловые роли template, если они применимы.
5. Добавь project-specific blocks из RAG через v2 fields:
   - `Быстрый Маршрут По RAG`;
   - `Карта Контекста Проекта`;
   - `Проектные Привязки`;
   - `Локальные Антипаттерны И Риски`;
   - `Проверки По Слою`.
6. Удали только то, что явно не применимо к проекту, и объясни это внутри секции `Не использовать когда` или `Gaps`.
7. Отрендери `SKILL.md` командой `node reusable-agent-system-toolkit/scripts/render-skills.js . <skill-name>`.
8. Не заменяй detailed process общими bullets без project evidence.

Если template слишком общий, расширяй v2 input недостающими ролями из `Шаблон Сборки Skill`. Используй примерную глубину `code-review-and-quality` из эталонного skill set как образец мышления: критерий одобрения, направления ревью, размер изменений, процесс ревью, severity, dead-code hygiene, проверки и формат результата. Потом привяжи это к конкретным paths/flows/risks проекта. Не добавляй второй custom skill перед renderer output.

## Skill-Specific References

`codex-skills/references` в full install обязателен, но не должен копировать `docs/agent-system`.

Создавай references только как operational support для skills:

- `code-review-playbook.md` - severity rules, review dimensions, project examples, known risky patterns.
- `debugging-playbook.md` - локальные команды, typical failure modes, log/search hints, reproduction patterns.
- `refactor-playbook.md` - refactor slices, protected behaviors, boundary migration hints.
- `frontend-ui-playbook.md`, если есть UI - design system, states, accessibility, responsive/browser guards, local component examples.
- `backend-api-playbook.md`, если есть backend/API - contracts, auth/authz, validation, error/observability, idempotency.
- `testing-playbook.md` - какие проверки запускать по blast radius.
- `security-performance-playbook.md` - local trust boundaries, dependency watchlist, hot paths, resource leak patterns.

Каждый reference должен иметь:

```markdown
# ...

## Назначение

## Читать когда

## Подсказки Поиска Source

## Проектные Примеры

## Известные Плохие Patterns

## Предпочтительные Локальные Patterns

## Команды И Проверки

## Связанные risks/refactor items
```

Если по слою нет evidence, не сочиняй reference. Запиши gap в skill и docs.

## Планка Качества Code Review Skill

`code-review-and-quality` должен содержать:

- критерий одобрения;
- когда использовать;
- пять направлений ревью: корректность, читаемость/простота, архитектура, безопасность, производительность;
- размер и разбиение изменений;
- процесс ревью: понять контекст, сначала тесты, потом реализация, затем severity;
- severity policy;
- dead-code hygiene;
- проектные привязки из RAG;
- known local risks;
- формат результата findings-first.

Короткий skill вида "прочитай RAG, проверь tests, дай findings" недопустим для full install.

## Планка Качества Debugging Skill

`debugging-and-error-recovery` должен содержать:

- правило остановить feature work;
- capture symptom without interpretation;
- reproduction ladder;
- layer isolation;
- failure taxonomy: test/build/type/runtime/flaky/external/CI;
- root cause protocol;
- regression protection;
- cleanup of temporary diagnostics;
- project-specific failure modes from research;
- commands/checks from stack profile.

## Планка Качества Refactor Skill

`refactor-engineering` должен содержать:

- behavior characterization first;
- relation to risk/refactor plan;
- slice design;
- protected behavior;
- caller/consumer audit;
- public contract/migration rules;
- dead-code removal protocol;
- rollback/stop conditions;
- project-specific refactor candidates and examples.

## Планка Качества Stack/Domain Skill

Stack/domain skills должны быть не менее содержательными, чем core playbooks.

Для frontend/UI:

- component/page boundaries;
- design system/tokens/local components;
- loading/empty/error/disabled/success/permission states;
- accessibility and keyboard/focus;
- responsive and visual QA;
- SSR/client guards;
- watcher/effect/timer cleanup;
- content/i18n text length;
- browser verification expectations.

Для backend/API:

- request/response contracts;
- validation boundaries;
- auth/authz invariants;
- transactions/idempotency/concurrency;
- error model and safe logging;
- observability;
- test strategy and migration compatibility.

Для data/database:

- schema constraints;
- migration rollout/rollback;
- indexes/query shape;
- transaction boundaries;
- data loss and backfill risks.

Для security/performance:

- trust boundaries;
- injection/file/upload/rendering risks;
- dependency watchlist;
- hot paths;
- resource leaks;
- cache invalidation and request flood risks.

## Запрет На Копии Docs

Не создавай references как `knowledge-base.md` под другим именем.

Правильная разница:

- docs: "в проекте есть риск R-S1 в `src/components/...`";
- skill reference: "когда работаешь с HTML rendering, сначала ищи `v-html`, затем проверяй sanitizer/upstream contract, затем применяй такой decision tree".

## Формат Отчета Генерации

После генерации покажи:

```markdown
Качество generated skills:
- Skill:
  Seeds:
  Использованный template:
  Проектные привязки:
  References:
  Связи с risk/refactor:
  Почему skill не generic:
```
