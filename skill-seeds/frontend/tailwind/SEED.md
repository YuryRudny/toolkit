# Seed: Tailwind UI Discipline

## Назначение

Используй только если проект реально использует Tailwind/daisyUI/shadcn-like utility CSS.

## Планка Качества

- Используй design tokens/config вместо случайных цветов и spacing.
- Не создавай one-off utility soup, если есть component/token pattern.
- Responsive variants должны соответствовать project breakpoints.
- Dark/light themes проверяются вместе, если theme существует.
- Class composition должна быть читаемой и не ломать state variants.
- Не добавляй arbitrary values без причины.

## Проверки Ревью

- Consistent spacing scale.
- Accessible color contrast.
- State variants: hover/focus/disabled/error/active.
- No duplicated class blocks across components without extraction plan.
- No layout shift from dynamic content.

## Обязательная Адаптация Под Проект

При генерации добавь:

- Tailwind version/config path;
- component conventions;
- tokens/theme files;
- plugin usage;
- local anti-patterns.
