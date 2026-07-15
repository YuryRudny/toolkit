---
name: code-review-and-quality
description: Проводит senior-ревью кода для изменений в проекте. Используй перед merge, после реализации, при проверке кода агента/человека и при оценке качества рефакторинга.
---

# Ревью Кода И Контроль Качества

## Обзор

Проводь ревью как senior engineer: оценивай не стиль ради стиля, а корректность, архитектуру, безопасность, тестируемость, производительность и соответствие локальным правилам проекта.

Одобрять можно только изменение, которое улучшает общее состояние кодовой базы или безопасно решает задачу без ухудшения ключевых quality gates. Не блокируй код потому, что ты написал бы иначе. Блокируй, если есть риск сломанного поведения, security issue, data loss, архитектурного drift или непроверенного critical path.

## Когда использовать

- Перед merge/push/PR/MR.
- После реализации любой нетривиальной задачи.
- После bug fix, чтобы проверить root cause и regression coverage.
- При ревью кода, написанного другим агентом или человеком.
- При оценке refactor slices и архитектурных изменений.

## Не использовать когда

- Пользователь просит только краткий статус без ревью.
- Нет diff/scope/требования и невозможно восстановить expected behavior из Jira/docs/source.
- Нужно сначала провести research всего проекта: тогда маршрутизируй в `research-audit`.

## Обязательные Чтения

- `docs/agent-system/knowledge-index.md`
- `docs/agent-system/knowledge-base.md`
- `docs/agent-system/current-state.md`
- `docs/agent-system/risk-register.md`
- `docs/agent-system/refactor-plan.md`
- `codex-skills/references/code-review-playbook.md`
- `docs/agent-system/existing-rules-merge.md`, если файл существует
- routed stack/domain skill для затронутого слоя

## Быстрый Маршрут По RAG

Заполни при генерации:

- Feature/bug task -> читать `<RAG_ROWS>`.
- UI change -> читать `<UI_RAG_ROWS>`.
- Backend/API/data change -> читать `<BACKEND_RAG_ROWS>`.
- Security/performance/dependency change -> читать `<RISK_RAG_ROWS>`.
- Unknown scope -> `knowledge-index.md` -> affected source -> routed stack skill.

## Карта Контекста Проекта

Заполни при генерации:

- Основные source roots:
- Critical flows:
- High-blast-radius files:
- Existing local rules/skills:
- Команды проверки:

## Проектные Привязки

Заполни при генерации из research evidence:

- Хорошие локальные patterns, которые нужно сохранять:
- Опасные локальные patterns, которые нельзя копировать:
- Risk/refactor IDs, которые должен помнить reviewer:
- Source retrieval hints:

## Локальные Антипаттерны И Риски

Заполни при генерации:

| Pattern/risk | Evidence | Почему важно | Что делать reviewer |
|---|---|---|---|
| `<RISK_ID>` | `<PATH_OR_FLOW>` | `<IMPACT>` | `<ACTION>` |

## Порядок работы

1. Пойми требование: Jira/issue/spec/commit message/описание изменения.
2. Определи scope diff и затронутые flows.
3. Сначала проверь тесты: есть ли они, что защищают, ловят ли регрессию.
4. Проверь реализацию по пяти направлениям.
5. Сверь код с локальными patterns и existing rules.
6. Отдели blocker от suggestion: не создавай шум.
7. Если находишь очевидный unsafe/fragile code в touched area, предложи конкретное исправление или risk/refactor entry.
8. Сформируй результат с приоритетом, evidence и проверками.

## Пять Направлений Ревью

### Корректность

- Требование выполнено полностью?
- Edge cases обработаны: `null`, пустые данные, границы диапазонов, permissions, stale state?
- Ошибочные сценарии обработаны, а не только happy path?
- Нет race conditions, duplicate side effects, off-by-one, inconsistent state?
- Тесты проверяют behavior, а не случайные implementation details?

### Читаемость И Простота

- Названия объясняют intent без устного контекста?
- Поток выполнения простой, без лишней вложенности и “умных” трюков?
- Абстракции оправданы реальным повторением, а не желанием обобщить заранее?
- Нет мертвого кода, временных compatibility слоев и TODO без владельца?
- Код можно сопровождать следующему агенту через RAG/source evidence?

### Архитектура

- Сохраняются boundaries проекта?
- Зависимости направлены правильно?
- Новый pattern оправдан или есть existing local pattern?
- Shared component/service не получил domain-specific behavior случайно?
- Refactor отделен от behavior change, если риск большой?

### Безопасность И Надежность

- Input валидируется на границах?
- Auth/authz проверяется server-side там, где требуется?
- Нет secret leaks в code/docs/logs/errors?
- Нет unsafe rendering, SQL/command/path injection, SSRF/open redirect?
- External data считается недоверенным?
- Ошибки полезны для debug, но не раскрывают sensitive details?

### Производительность

- Нет N+1, unbounded queries, request floods, retry storms?
- Нет тяжелых render/effect/watch loops?
- Large lists/media/dependencies обработаны осознанно?
- Не добавлена тяжелая dependency ради малого использования?
- Performance claims подтверждены evidence или помечены как gap?

## Проверки По Слою

Заполни при генерации применимые проверки из stack/domain skills:

- UI:
- State/data/API:
- Backend/domain:
- Database/persistence:
- Security/privacy:
- Performance/resource lifecycle:
- Testing/CI:

## Приоритеты Замечаний

| Уровень | Когда ставить | Действие |
|---|---|---|
| Critical | Security/data loss/broken core behavior | Блокировать |
| Important | Реальный риск регрессии, architecture drift, missing critical test | Исправить до merge |
| Suggestion | Улучшение maintainability без явного риска | Можно обсудить |
| Nit | Мелочь, не покрытая formatter/linter | Не шуметь без пользы |

## Контрольные gates

- Не ставь автоматическое `LGTM`.
- Не комментируй стиль, который уже должен ловить formatter/linter.
- Не требуй broad rewrite вне scope MR.
- Не игнорируй known risks из `risk-register.md`.
- Не принимай “потом почистим” для security/data integrity/correctness.
- Не удаляй сомнительный dead code молча: перечисли и запроси отдельное решение, если он вне scope.

## Условия остановки

- Невозможно понять требование или expected behavior.
- Diff не соответствует локальному branch/MR context.
- Нет доступа к critical evidence: Jira/spec/contracts/tests.
- Изменение high-risk, но проверки невозможно запустить или заменить smoke evidence.
- Обнаружен security/data loss blocker.

## Формат результата

```markdown
Ревью кода:
- Scope изменения:
- Evidence по требованию:
- Проверенные файлы/flows:
- Замечания:
  - [Critical/Important/Suggestion/Nit] ...
- Тесты/проверки:
- Обновления risk/refactor:
- Вердикт:
```
