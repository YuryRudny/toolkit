---
name: review-checklist
description: Финальный quality gate после edits или для review. Проверяет корректность, архитектуру, качество по стеку, безопасность, performance, tests и evidence.
---

# Чеклист Ревью

## Находки Сначала Для Review

Если пользователь просит review, сначала выводи findings по severity.

## Финальный Gate После Edits

Проверь:

- task scope выполнен;
- unsafe patterns в затронутой зоне не размножены;
- stack-quality skill применен;
- архитектурные boundaries не ухудшены;
- data/API contracts безопасны;
- auth/security/logging не ухудшены;
- performance hot paths не ухудшены;
- tests/checks соответствуют blast radius;
- gaps/blockers записаны явно.

## Условия остановки

- high-risk gap скрыт;
- checks не запускались, но названы passed;
- security/performance claim без evidence;
- shared change без blast-radius review.

## Формат результата

```markdown
Ревью:
- Находки:
- Проверки:
- Stack-quality gates:
- Пробелы/blockers:
- Затронутые файлы/flows:
```
