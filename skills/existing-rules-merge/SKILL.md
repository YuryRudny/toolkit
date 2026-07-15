---
name: existing-rules-merge
description: Объединяет existing repository agent rules с generated reusable agent system. Используй перед записью AGENTS.md, codex-skills, Cursor, Claude, Copilot или других AI-agent instructions, чтобы не перетереть local policy, не создать дубли и конфликтующие workflows.
---

# Merge Существующих Правил

## Обзор

Защити existing agent instructions целевого проекта. Generated system должен merge-иться с local rules, а не заменять их по умолчанию.

Локальные skills проекта являются first-class source of truth. Если в проекте уже есть `codex-skills/skills/*`, `.codex/skills/*`, `AGENTS.md` или другие agent rules, bootstrap обязан понять их authority и встроить в новую систему. Нельзя молча заменить их generated skills.

## Порядок работы

1. Собери current rules:
   - `AGENTS.md`;
   - `codex-skills/skills/*/SKILL.md`;
   - `codex-skills/references/*`;
   - `.codex/skills/*/SKILL.md`;
   - `.codex/*`;
   - `.cursor/`, `.cursorrules`;
   - `.claude/`, `CLAUDE.md`;
   - `.github/copilot-instructions.md`;
   - README/docs sections про AI или coding conventions.
2. Для каждого local skill составь inventory:
   - skill name и path;
   - frontmatter description/triggers;
   - authority: router, mode, stack/domain, enterprise, review, commit, docs, unknown;
   - обязательные чтения/references;
   - rules/gates/stop conditions;
   - language policy;
   - конфликты с toolkit defaults;
   - уровень качества: keep, needs augmentation, deprecated, duplicate.
3. Классифицируй каждое rule:
   - project-specific;
   - team policy;
   - tool-specific;
   - stack-specific;
   - outdated;
   - duplicate;
   - conflicting.
4. Построй authority matrix:
   - какой skill/rule является authoritative для каждого trigger/mode/layer;
   - какие generated skills должны ссылаться на existing local skill;
   - какие generated skills нельзя создавать, потому что authority уже есть;
   - какие existing skills можно augment/update только с explicit decision;
   - какие conflicts требуют вопроса пользователю.
5. Выбери merge behavior:
   - сохранить как есть;
   - сохранить и маршрутизировать к нему;
   - дополнить in place только если это безопасно и явно обосновано;
   - перенести в project authority skill;
   - перенести в stack/domain skill;
   - обернуть generated adapter skill;
   - сослаться из router;
   - deprecated с объяснением;
   - спросить решение пользователя.
6. Запиши `existing-rules-merge.md` с inventory, authority matrix, решениями и conflicts.
7. Только после этого обновляй active instructions.

## Разрешение конфликтов

- Предпочитай stricter safety rules, если оба правила compatible.
- Предпочитай project-specific rules вместо generic toolkit rules.
- Сохраняй tool-specific syntax для каждого tool.
- Не стирай user/team conventions только потому, что они необычные.
- Если два rules ведут к разным actions, остановись и спроси или запиши blocker.
- Если existing local skill покрывает тот же trigger, что generated skill, не создавай дубликат. Либо route to existing skill, либо создай adapter/wrapper с другим name и clear boundary.
- Если existing local skill слабый, не перетирай его молча. Запиши augmentation proposal: что добавить, почему, куда, какие риски.
- Если existing rules на английском, а project policy требует русский, не переписывай их без решения. Generated wrapper может быть на русском и ссылаться на original.
- Если local skill ссылается на existing references, они должны остаться доступными после bootstrap.

## Контрольные gates

- Не перезаписывай `AGENTS.md` без сохранения existing intent.
- Не перезаписывай `codex-skills/skills/*/SKILL.md` без explicit merge decision.
- Не создавай generated skill с тем же name/path, если local skill уже существует.
- Не создавай generated router, который игнорирует existing local skills.
- Не переносить secrets, credentials, local-only paths или personal preferences в reusable rules.
- Не создавать несколько routers для одной agent surface.
- Не продолжай к `project-skills-assembler`, если unresolved conflicts есть в router/mode/enterprise/review/commit authority.

## Формат результата

```markdown
Merge существующих правил:
- Source:
  Classification:
  Authority:
  Decision:
  Destination:
  Notes/conflicts:

Inventory локальных skills:
- Skill:
  Path:
  Description/triggers:
  Authority:
  Decision:
  Router integration:
  References preserved:

Матрица authority:
- Trigger/mode/layer:
  Authoritative source:
  Generated behavior:
  Conflict status:

Нерешенные конфликты:
```
