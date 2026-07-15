# Frontend UI Engineering

Используй этот reference только если в целевом проекте есть user-facing UI.

## Цель

Создавать интерфейсы промышленного качества: доступные, производительные, визуально отполированные и согласованные с design system проекта. Результат должен выглядеть так, будто его сделал опытный product engineer с хорошим вкусом, а не AI по generic template.

Если агент меняет UI рядом с очевидно плохим UX/accessibility/state кодом, он не должен молча копировать pattern. Безопасные локальные улучшения входят в scope; широкие исправления записываются как risk/refactor gap.

## Adapt To Stack

- Vue: Composition API, existing composables, Pinia/Vuex если есть, project component library, route/data patterns.
- React: hooks, component composition, existing state/data libraries, framework conventions вроде Next.js, если есть.
- Angular: modules/standalone components, services, RxJS patterns, forms, change detection.
- Other frameworks: сначала local conventions, потом generic advice.

Не копировать examples из другого stack.

## Component Architecture

- Держать components сфокусированными на одной responsibility.
- Разделять data/container logic и presentational rendering, когда complexity растет.
- Предпочитать composition вместо excessive prop configuration.
- Не прятать domain-specific behavior в reusable components.
- Использовать stable keys/identifiers.
- Держать side effects в явных lifecycle/effect/composable/service boundaries.
- Если компонент уже смешивает layout, data mapping, validation, persistence и side effects, не усиливать смешение; вынести локальный helper/composable или записать refactor slice.

## State And Data

- Использовать самый простой state model, который решает задачу.
- Разделять server data, form draft state, UI state и derived state.
- Избегать deep prop drilling через components, которые props не используют.
- Чистить effects, subscriptions, timers и debounced work.
- Защищаться от stale responses, которые перезаписывают fresh UI state.
- Не добавлять новый watcher/effect/request без cleanup, cancellation или stale-response policy там, где это применимо.

## Design System

- Найти existing tokens, components, spacing scale, typography, colors и icon system.
- Не придумывать новый visual language.
- Избегать default AI aesthetics: random purple gradients, excessive cards, huge radii, heavy shadows, stock hero layouts.
- Использовать realistic content и long labels для проверки layout.
- Для internal tools сохранять dense operational layouts; не превращать их в marketing pages.

## Accessibility

- Использовать semantic elements до ARIA.
- Все interactive elements должны быть keyboard reachable.
- Icon-only controls должны иметь accessible names.
- Form controls должны иметь labels и error relationships.
- Dialogs, drawers, popovers, menus и route changes требуют focus handling.
- Не полагаться только на color для state.
- Цель - WCAG 2.1 AA, если проект не требует строже.
- Если touched control недоступен с клавиатуры или не имеет label/name, исправь это вместе с задачей, если изменение локальное.

## Responsive And Visual QA

- Проверять breakpoints, принятые в проекте.
- Если project breakpoints неизвестны, минимум учитывать 320, 768, 1024 и 1440 width.
- Не допускать text overflow, clipped controls, overlapping elements и layout shift.
- Проверять loading, empty, error, disabled, success и permission states.
- Для UI claims иметь browser screenshots/manual visual evidence или явно записанный gap.

## Performance

- Избегать expensive computed/render loops на large lists.
- Использовать virtualization для large lists, если проект это поддерживает или это необходимо.
- Избегать request floods из watchers/effects.
- Подбирать image/media loading под project constraints.

## Review checklist

- UI совпадает с existing design patterns?
- Touched UI не копирует unsafe/junior-level pattern?
- State boundaries понятны?
- Async и cleanup paths безопасны?
- Accessibility basics покрыты?
- Long content и narrow screens работают?
- Error и empty states полезные?
- Browser evidence есть или gap записан?
