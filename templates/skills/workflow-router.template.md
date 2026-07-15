---
name: workflow-router
description: Главный диспетчер режимов работы агента. Используй в начале любой задачи, при смене scope и перед repo/browser/network/auth/local-server/git actions.
---

# Маршрутизатор Работы

## Обзор

Выбери режим, mandatory skills, gates и stop conditions. Не решай задачу без routing.

## Порядок работы

1. Напиши Skill Ledger.
2. Для обычной работы сначала прочитай `docs/agent-system/knowledge-base.md` и `docs/agent-system/knowledge-index.md`, если они существуют.
3. Определи mode по triggers.
4. Загрузи минимальный mandatory skill set.
5. Если scope меняется, rerun router.
6. Перед финалом после edits применяй `review-checklist`.

## Режимы

### Research Mode

Триггеры: `ресерч`, `research`, `глубокий анализ`, `найди слабые места`, `карта проекта`.

Правила:

- default scope = весь проект;
- не переспрашивай scope серией вопросов, если можно безопасно начать;
- не редактируй code по умолчанию;
- если docs отсутствуют, research должен создать/обновить project map, risk register, refactor plan, smoke checklist, current state/worklog;
- не завершай summary по стеку без findings/gaps.

Обязательные skills: `general`, `project-authority`, `research-audit`, `review-checklist`.

### Development Mode

Триггеры: issue/task request, bugfix/feature request, Jira key если настроено.

Обязательные skills: `general`, `project-authority`, `pre-change-checklist`, relevant stack/domain skills, `review-checklist`.

### Refactor Mode

Триггеры: `рефактор`, `refactor`, `следующий slice`, работа по refactor plan.

Обязательные skills: `general`, `project-authority`, `refactor-mode`, relevant stack/domain skills, `pre-change-checklist`, `review-checklist`.

### Review Mode

Триггеры: `ревью`, `review`, `проверь`, review diff/plan/findings.

Обязательные skills: `general`, `review-checklist`, relevant stack/domain skills.

### Merge/Publish Mode

Триггеры: `мерже`, `merge`, commit, push, sync branch.

Обязательные skills: `general`, `semantic-commit-flow`, `evidence-pack`, `review-checklist`, git/merge flow skill.

### Summary Mode

Триггеры: отчет, summary, status.

Обязательные skills: `general`.

## Универсальные Условия Остановки

- Нужный skill не загружен.
- Knowledge base отсутствует или stale для задачи, но агент пытается не читать source/docs evidence.
- Enterprise access нужен, но policy skill не загружен.
- Stack-quality skill нужен, но не выбран.
- Research output становится stack summary.
- Code edit начинается без pre-change checklist.
- Final delivery после edits без review checklist.
