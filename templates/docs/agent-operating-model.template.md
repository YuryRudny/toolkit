# Agent Operating Model

## Назначение

Опиши, как AI agents должны работать в этом repository.

## Entry Point

Вся обычная работа начинается с `workflow-router`.

Перед deep docs/source reading обычная работа должна читать `knowledge-base.md` и `knowledge-index.md`, если они существуют и не stale для задачи.

## Skill Ledger

Перед первым repo/browser/network/auth/local-server/git action напиши:

- selected skill;
- почему он требуется;
- загружен ли он уже.

## Modes

| Mode | Trigger | Required skills | Output |
|---|---|---|---|
| Development | Task/issue request | | |
| Refactor | "refactor", refactor plan | | |
| Research | "ресерч", "research", audit request, карта проекта | | Findings, gaps, docs updates |
| Review | "review", "check" | | |
| Merge | "merge", sync target branch | | |
| Summary | report/summary request | | |

## Universal Gates

- Не обходить existing project rules.
- Не редактировать files до pre-change checks.
- Подключать stack-quality skill для touched layer: UI, state/data, backend, API, database, testing, security/performance.
- Не копировать unsafe local pattern как норму; исправлять локально в scope или записывать risk/refactor gap.
- Не заявлять passed checks, если они не запускались.
- Не скрывать dirty worktree или unrelated changes.
- Не превращать hypotheses в confirmed findings.
- При trigger "ресерч" не переспрашивать scope серией вопросов, если можно безопасно начать research всего проекта.
- Не завершать Research mode поверхностным summary по стеку вместо evidence-based findings и docs updates.
- При "продолжи ресерч/bootstrap" читать current-state/research-worklog и продолжать с незакрытого gap/slice.
- После bootstrap/regeneration запускать generated system validation.
- Обновлять knowledge base/index после research/refactor/bootstrap, если изменились architecture, critical flows, commands, risks или enterprise access.

## Final Response Contract

Каждый delivery после edits должен включать:

- что изменено;
- какие checks запускались;
- gaps/blockers;
- touched files/flows.
