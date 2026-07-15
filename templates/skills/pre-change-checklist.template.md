---
name: pre-change-checklist
description: Gate перед file edits. Используй перед любыми code/docs edits, чтобы проверить область, dirty worktree, затронутую область, stack-quality и risk.
---

# Чеклист Перед Изменением

## Порядок работы

1. Проверь branch/status и unrelated changes.
2. Прочитай `knowledge-base.md` и `knowledge-index.md`, если они есть, чтобы выбрать областьd docs/skills без full rediscovery.
3. Зафиксируй область и затронутые потоки.
4. Определи затронутый слой: UI, state/data, backend, API, database, infra, docs.
5. Загрузи релевантные stack/domain skills.
6. Проверь риски затронутой области:
   - небезопасные локальные patterns;
   - shared радиус влияния;
   - data/API contract risk;
   - security/performance risk;
   - required tests/smoke.
7. Если локальное исправление unsafe code безопасно и в область, включи его в план.
8. Если исправление шире область, запиши risk/refactor gap.

## Условия остановки

- dirty worktree содержит unrelated changes, которые нельзя отделить;
- затронутый слой не имеет нужного stack-quality skill;
- high-risk change без план подтверждения/проверки;
- работа поверх unsafe code может привести к data loss/security issue.

## Формат результата

```markdown
Подготовка к изменению:
- Область изменения:
- Затронутые файлы/потоки:
- Skills:
- Риски:
- Запланированные проверки:
- Пробелы/блокеры:
```
