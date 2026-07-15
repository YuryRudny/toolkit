# Seed: Refactor Engineering

## Назначение

Используй как базу для `refactor-engineering` и `refactor-playbook.md`.

Seed задает безопасный refactor protocol. В проект переносится только после research: каждый slice должен быть связан с real risk/evidence.

## Принципы

- Сначала characterization behavior, потом restructuring.
- Один refactor slice = одна понятная цель, один protected behavior, один verification path.
- Не смешивай refactor и feature behavior без явной причины.
- Shared contracts меняй только с migration/compatibility plan.
- Dead code удаляй только после usage evidence.
- Broad rewrite запрещен, если локальный slice снижает риск.

## Признаки Нужного Рефактора

- long function/component/class;
- duplicated domain logic;
- feature envy;
- primitive obsession;
- complex conditionals;
- hidden side effects;
- mixed presentation/domain/data/network layers;
- circular dependencies;
- shotgun surgery;
- inconsistent DTO/domain/UI models.

## Шаблон Среза Рефактора

```markdown
Refactor slice:
- Risk ID:
- Source examples:
- Protected behavior:
- Change boundary:
- Steps:
- Checks:
- Rollback/stop condition:
```

## Safety Gates Для Рефактора

- Нет expected behavior -> сначала research/debug.
- Нет verification path для critical flow -> не делать high-risk refactor.
- Public API/DTO/schema changes требуют compatibility notes.
- Shared utility/component changes требуют consumers audit.
- Performance/security-sensitive refactor требует targeted checks.

## Обязательная Адаптация Под Проект

При генерации добавь:

- refactor items из `refactor-plan.md`;
- source examples;
- protected flows;
- available tests/smoke;
- ownership boundaries;
- local anti-patterns.
