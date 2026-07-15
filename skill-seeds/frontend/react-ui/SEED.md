# Seed: Frontend UI Quality

## Назначение

Используй для `frontend-ui-engineering` и `frontend-ui-playbook.md` в проектах с UI.

Seed stack-neutral: React/Vue/Nuxt/Next/Svelte/Angular. При генерации адаптируй под конкретный framework, дизайн-систему и локальные компоненты.

## Планка Production UI

- UI решает задачу пользователя без hidden instructions.
- Есть loading, empty, error, disabled, success и permission states.
- Контролы доступны с клавиатуры и имеют accessible names.
- Layout стабилен на mobile/tablet/desktop breakpoints.
- Long labels, i18n text и data-heavy states не ломают верстку.
- Side effects/watchers/effects/listeners/timers имеют cleanup/cancellation.
- Browser-only APIs защищены от SSR/server execution.
- UI не копирует generic AI-looking visual language поверх existing design system.

## Проверка Компонентов

- Компонент имеет понятный owner и responsibility.
- Server data, form draft, UI state и derived state разделены.
- Shared component не получает domain-specific behavior без explicit contract.
- Heavy visual libraries используются только при реальной ценности.
- Forms валидируют boundary и показывают ошибки рядом с action.

## Accessibility Проверки

- Semantic HTML before ARIA.
- Focus trap/restore для modal/drawer/popover, если применимо.
- Icon-only buttons имеют accessible labels.
- Custom controls поддерживают keyboard interaction.
- Error messages связаны с fields.

## Responsive И Visual Проверки

- 320/768/1024/1440 или project breakpoints.
- Нет text overflow, clipped controls, incoherent overlap.
- Skeleton/loading размеры не вызывают layout shift.
- Touch targets достаточны для mobile.

## Обязательная Адаптация Под Проект

При генерации добавь:

- component/page roots;
- design system/tokens/components;
- локальные UI risks;
- browser/runtime gates;
- smoke checklist;
- i18n/locale constraints.
