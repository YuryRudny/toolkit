---
name: stack-engineering-standards
description: Готовит stack-specific engineering-quality payload для project-skills-assembler. Используй после discovery/RAG, чтобы определить frontend UI, backend, API, database, testing, security, performance, accessibility, observability и framework-specific quality contracts под реальный stack.
---

# Stack Engineering Standards

## Обзор

Подготовь coding standards payload, который заставляет будущие project-local skills работать как опытный инженер с сильным вкусом и production judgment. Standards должны быть специфичны для target stack и project conventions.

Этот skill не создает финальные `codex-skills/skills/*/SKILL.md`. Он готовит вход для `project-skills-assembler`: stack areas, selected seeds, project evidence, quality contracts и target skill list. Финальные skills рендерятся только через per-skill assembly sheet и full template.

## Обязательные Чтения

- `reusable-agent-system-toolkit/references/stack-standards-guide.md`
- `reusable-agent-system-toolkit/references/senior-engineering-quality.md`
- `reusable-agent-system-toolkit/references/frontend-ui-engineering.md`
- `reusable-agent-system-toolkit/references/backend-engineering.md`
- `reusable-agent-system-toolkit/references/skill-seed-library.md`
- `reusable-agent-system-toolkit/skill-seeds/manifest.json`
- manifest/index files для каждой external library из `reusable-agent-system-toolkit/skill-seeds/manifest.json`

## Порядок работы

1. Начни со stack profile из `project-discovery`.
2. Выполни или прочитай выбор seeds:
   - если `project-skills-assembler` еще не запускался, выбери seeds по `skill-seed-library.md`;
   - если selection уже записан в stack profile/knowledge index/bootstrap summary, используй его;
   - stack standards нельзя строить из seed без project evidence;
   - seed не копируется в standard, а задает quality scaffold.
   - external library используй через index/manifest и открывай только selected `SKILL.md`.
3. Определи применимые standards:
   - frontend UI;
   - frontend state/data;
   - backend/API;
   - database;
   - async/jobs/queues;
   - auth/security;
   - testing;
   - performance;
   - observability.
4. Адаптируй каждый standard к реальным frameworks:
   - Vue, React, Angular, Svelte и т.д.;
   - Node, Java, PHP, Python, Go и т.д.;
   - SQL/NoSQL/cache/queue stack;
   - local component libraries и design systems.
5. Запиши target skills для последующего render assembly:
   - `frontend-ui-engineering`, только если user-facing UI есть;
   - `backend-engineering`, только если backend есть;
   - `api-contract-safety`, если API contracts важны;
   - `database-safety`, если есть migrations или persistence;
   - `testing-strategy`;
   - `security-performance-review`.
6. Для каждого target skill зафиксируй senior-quality contract:
   - агент уважает local patterns, но не копирует unsafe/junior-level code;
   - если плохой код в зоне задачи можно безопасно исправить, skill требует исправить его;
   - если исправление шире scope, skill требует risk/refactor entry;
   - high-risk work поверх unsafe code должен останавливаться blocker-ом.
7. Передай payload в `project-skills-assembler`; router/pre-change/review links добавляются после render финальных skills.

## Планка качества

Stack standards payload должен объяснять, как писать code, который:

- readable и idiomatic для stack;
- accessible, если UI есть;
- resilient к edge cases и bad data;
- performant для production paths;
- testable и observable;
- aligned with existing project patterns;
- улучшает явно unsafe/fragile код в зоне задачи;
- фиксирует architectural/security/performance/test gaps, если исправление выходит за scope;
- не выглядит как generic AI boilerplate.

## Контрольные gates

- Не генерируй frontend UI rules для backend-only проекта.
- Не копируй React examples в Vue проекты и наоборот.
- Не придумывай design system; сначала найди existing tokens/components.
- Не рекомендуй libraries, которых нет в проекте, без clear reason.
- Не скрывай missing tests или accessibility gaps.
- Не нормализуй плохой local pattern как best practice. Если local convention небезопасен, отметь conflict и выбери safe remediation path.
- Не создавай финальный stack skill напрямую; для этого есть `project-skills-assembler`.
- Не передавай stack skill в assembler без gates для touched-area review, security/performance risk и test strategy.
- Не передавай stack skill в assembler без результата выбора seeds для full install.
- Не копируй seed как текст standard; адаптируй его через real project paths, flows, risks, checks и conventions.
- Не выбирай stack seed только по названию папки: нужны dependency/config/source evidence или stack profile evidence.
- Не загружай всю external library в контекст ради одного stack standard.

## Формат результата

```markdown
Стандарты по стеку:
- Stack area:
  Seeds:
  Target skill/reference:
  Project evidence:
  Key rules:
  Gaps/blockers:
```
