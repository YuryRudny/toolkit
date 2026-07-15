---
name: project-skills-generator
description: Deprecated compatibility wrapper. Используй только чтобы перенаправить старый вызов на project-skills-assembler; full-install skills рендерятся через assembler, per-skill assembly sheet и full templates.
---

# Project Skills Generator

## Deprecated Wrapper

Этот skill больше не создает project-local skills.

Правильный маршрут:

```text
Docs/RAG Ready -> seed selection -> project-skills-assembler -> per-skill assembly sheet -> full template render -> project-local SKILL.md
```

## Порядок работы

1. Не читай старые templates и не пиши `SKILL.md` свободным текстом.
2. Открой `reusable-agent-system-toolkit/skills/project-skills-assembler/SKILL.md`.
3. Продолжай только по `project-skills-assembler`.
4. Если `project-skills-assembler` отсутствует, остановись с blocker: toolkit copy stale/incomplete.

## Условия остановки

- Пользователь или другой skill требует full-install skills, но `project-skills-assembler` отсутствует.
- `Docs/RAG Ready` не пройден.
- Нет selected seeds/library base skills для full-install quality/stack/domain skills.

## Формат результата

```markdown
Project skills generator:
- Status: deprecated wrapper
- Redirected to: project-skills-assembler
- Blockers:
```
