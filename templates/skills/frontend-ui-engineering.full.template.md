---
name: frontend-ui-engineering
description: Senior playbook для frontend UI этого проекта. Используй при изменении страниц, компонентов, форм, stateful UI, responsive behavior и client/runtime boundaries.
---

# Frontend UI Engineering

## Обзор

Создавай и проверяй UI как production interface: доступность, состояния, responsive, визуальная цельность, локальный design system, performance и runtime safety важнее быстрого “сверстать”.

## Когда использовать

- Изменяются pages/components/layouts/forms.
- Меняется UI state, data fetching, rendering, browser API usage.
- Есть риск accessibility/responsive/visual regression.
- Нужно исправить unsafe UI pattern в touched area.

## Не использовать когда

- Нет frontend/UI слоя.
- Задача только backend/data/infra.
- Existing local UI skill authoritative.

## Обязательные Чтения

- `docs/agent-system/knowledge-base.md`
- `docs/agent-system/knowledge-index.md`
- `docs/agent-system/project-map.md`
- `docs/agent-system/stack-profile.md`
- `docs/agent-system/risk-register.md`
- `codex-skills/references/frontend-ui-playbook.md`

## Быстрый Маршрут По RAG

- UI component/page: <UI route>.
- Form/state flow: <state route>.
- HTML/rendering/security: <security route>.
- Browser/runtime: <performance/resource route>.

## Использованные Seeds

| Seed | Source | Что взято | Адаптация | Что отброшено |
| --- | --- | --- | --- | --- |
| <seed> | <library/path> | <UI quality structure> | <project stack/design/risk evidence> | <framework-specific non-applicable parts> |

## Карта Контекста Проекта

- Components/pages/layouts: <paths>.
- Styling/design system: <paths/tokens>.
- State/data: <stores/composables/queries>.
- Runtime boundaries: <SSR/client/mobile/browser>.

## Проектные Привязки

- <preferred component pattern>.
- <design system convention>.
- <local source example>.
- <source search hint>.

## Локальные Антипаттерны И Риски

| Risk | UI area | Evidence | Rule |
| --- | --- | --- | --- |
| <RISK_ID> | <area> | <path> | <action> |

## Планка Качества

- Все user-facing states продуманы: loading, empty, error, disabled, success, permission.
- Интерактивные элементы доступны с клавиатуры, имеют labels/focus behavior.
- Layout работает на project breakpoints или 320/768/1024/1440.
- Нет text overflow, clipped controls, overlapping content.
- Browser APIs используются только в client-safe lifecycle/guards.
- Effects/listeners/timers/subscriptions имеют cleanup/cancellation.
- Новый UI следует локальному visual language, а не generic AI-looking стилю.

## Порядок работы

1. Найди соседний локальный pattern для page/component/form.
2. Прочитай RAG route и risks для affected flow.
3. Определи states, permissions, locales и responsive breakpoints.
4. Проверь runtime boundary: SSR/client/mobile/browser.
5. Реализуй минимальное изменение без нового generic visual language.
6. Исправь obvious unsafe/fragile UI code в touched area или запиши risk/refactor gap.
7. Проверь accessibility/responsive/state smoke.

## Проверки По Слою

- Accessibility: semantic elements, keyboard, focus, ARIA only when needed.
- States: loading/empty/error/disabled/success/permission.
- Responsive: project breakpoints или 320/768/1024/1440.
- Runtime: browser APIs, hydration, stale async, cleanup.
- Content: locale text length, unsafe HTML, media fallback.
- Performance: heavy dependencies, repeated renders/watchers.

## Контрольные gates

- Не добавляй raw HTML rendering без trust/sanitize decision.
- Не копируй inaccessible custom controls.
- Не создавай новый visual system без причины.
- Не оставляй listener/timer/subscription cleanup gap.

## Условия остановки

- Design/behavior requirement неясен.
- UI depends on missing API/role/test data.
- Runtime boundary неясен, а risk высокий.
- Accessibility/security issue found in touched area but fix out of scope.

## Формат результата

```markdown
UI результат:
- Components/pages:
- States:
- Accessibility:
- Responsive:
- Runtime/security:
- Проверки:
- Gaps/blockers:
```
