---
name: testing-strategy
description: Определяет проверки по blast radius для этого проекта. Используй при любых behavior changes, bug fixes, refactor slices и release/merge decisions.
---

# Testing Strategy

## Обзор

Выбирай проверку по риску изменения. Если automated tests отсутствуют или заблокированы, не делай вид, что качество подтверждено: используй smoke checklist и записывай gap.

## Когда использовать

- Изменяется behavior.
- Нужно выбрать tests/smoke перед merge.
- Bug fix требует regression protection.
- Local/CI checks blocked.

## Не использовать когда

- Задача только текстовая и не влияет на code behavior.
- Проверки уже определены authoritative local rule.

## Обязательные Чтения

- `docs/agent-system/knowledge-base.md`
- `docs/agent-system/current-state.md`
- `docs/agent-system/smoke-checklist.md`
- `docs/agent-system/risk-register.md`
- `codex-skills/references/testing-playbook.md`

## Быстрый Маршрут По RAG

- Critical flow: <smoke route>.
- UI behavior: <UI smoke route>.
- API/data behavior: <contract smoke route>.
- Tooling/CI: <current-state route>.

## Использованные Seeds

| Seed | Source | Что взято | Адаптация | Что отброшено |
| --- | --- | --- | --- | --- |
| <seed> | <library/path> | <CI/testing gates> | <project commands/smoke gaps> | <non-existent test commands> |

## Карта Контекста Проекта

- Declared commands: <commands>.
- CI checks: <files>.
- Critical flows: <flows>.
- Known blockers: <blockers>.

## Проектные Привязки

- <command/smoke>.
- <test location или gap>.
- <manual scenario>.

## Локальные Антипаттерны И Риски

| Risk | Testing gap | Evidence | Required action |
| --- | --- | --- | --- |
| <RISK_ID> | <gap> | <path/command> | <action> |

## Порядок работы

1. Определи blast radius.
2. Найди existing automated checks.
3. Если checks blocked, зафиксируй blocker и выбери smoke.
4. Для bug fix добавь regression protection или documented reason why not.
5. Не называй checks green без фактического запуска.

## Проверки По Слою

- Unit/domain.
- Contract/API.
- Component/browser.
- E2E/manual smoke.
- Build/lint/typecheck.
- CI/release.

## Контрольные gates

- No “tests passed” without command output.
- No high-risk merge with only trivial smoke.
- No bug fix without regression plan.

## Условия остановки

- Required environment/test data missing.
- Check blocker makes risk unacceptable.
- Test strategy requires product/domain decision.

## Формат результата

```markdown
Проверки:
- Blast radius:
- Automated:
- Smoke:
- Blocked:
- Regression protection:
- Residual risk:
```
