---
name: stack-quality-skill
description: Senior playbook для задач в конкретном слое проекта. Используй при разработке, ревью и рефакторинге `<STACK_AREA>`, чтобы применять локальную архитектуру, quality gates и безопасные улучшения в затронутой зоне.
---

# `<STACK_AREA>` Engineering

## Обзор

Работай с `<STACK_AREA>` как strong senior engineer: сначала пойми локальную архитектуру и RAG-контекст проекта, затем меняй код маленькими проверяемыми шагами, не копируя хрупкие junior-level patterns.

Цель skill не в том, чтобы повторить общие best practices. Цель - применить лучшие инженерные практики именно к этому проекту: его стеку, ограничениям, проблемным зонам, существующим правилам и реальным flows из research artifacts.

## Когда использовать

- Задача меняет код в `<STACK_AREA>`.
- Нужно написать, отрефакторить или проверить реализацию в этом слое.
- Нужно оценить архитектурное решение, тесты, безопасность или производительность в этом слое.
- Агент видит в зоне задачи хрупкий, небезопасный или чрезмерно сложный код.

## Не использовать когда

- Задача не затрагивает `<STACK_AREA>`.
- Слой не применим к проекту по research evidence.
- Existing local skill имеет authority для этой зоны и `existing-rules-merge.md` требует route/wrap вместо нового поведения.

## Обязательные Чтения

- `docs/agent-system/knowledge-index.md`
- `docs/agent-system/knowledge-base.md`
- `docs/agent-system/stack-profile.md`
- `docs/agent-system/project-map.md`
- `docs/agent-system/architecture-map.md`
- `docs/agent-system/risk-register.md`
- `docs/agent-system/refactor-plan.md`
- `docs/agent-system/stack-engineering-standards.md`
- `docs/agent-system/existing-rules-merge.md`, если файл существует

## Быстрый Маршрут По RAG

Заполни при генерации:

- Feature/change in `<STACK_AREA>` -> `<RAG_ROWS>`.
- Bug in `<STACK_AREA>` -> `<DEBUG_RAG_ROWS>`.
- Refactor in `<STACK_AREA>` -> `<REFACTOR_RAG_ROWS>`.
- Security/performance in `<STACK_AREA>` -> `<RISK_RAG_ROWS>`.

## Карта Контекста

Перед изменением кода найди в RAG и source:

- entry points затронутого flow;
- соседние файлы и локальные patterns;
- shared contracts, DTO, schemas, composables, services, repositories или components;
- tests/smoke checks, которые уже защищают flow;
- risk/refactor items, связанные с этой зоной;
- existing local skills/rules, которые имеют authority для этой области.

Если RAG устарел или не покрывает зону задачи, не делай вид, что контекст полный: обнови knowledge docs в рамках research/refactor flow или зафиксируй gap.

## Проектные Привязки

Заполни при генерации из research evidence:

- Source areas:
- Entry points:
- Critical flows:
- Preferred local patterns:
- Команды/проверки:
- Existing local rules/skills:

## Локальные Антипаттерны И Риски

Заполни при генерации:

| Pattern/risk | Подтверждение | Почему важно | Что делать при работе |
|---|---|---|---|
| `<RISK_ID>` | `<PATH_OR_FLOW>` | `<IMPACT>` | `<ACTION>` |

## Планка Качества

Код считается приемлемым, если он:

- корректно реализует требование и покрывает edge cases;
- сохраняет понятные boundaries между слоями;
- использует типы, contracts и runtime validation там, где данные приходят извне;
- не добавляет новые `any`, unsafe casts, magic strings или positional assumptions без причины;
- явно обрабатывает loading, empty, error, permission, cancellation и retry states там, где они применимы;
- не ухудшает security posture: нет secret leaks, XSS/injection risks, auth bypass, unsafe logging;
- не ухудшает performance на hot paths;
- тестируем и имеет проверку, соответствующую blast radius;
- читается другим инженером без устного объяснения автора;
- не увеличивает архитектурный долг без записи в risk/refactor docs.

## Порядок работы

1. Определи точный область задачи и затронутые flows.
2. Прочитай RAG first: `knowledge-index.md` -> `knowledge-base.md` -> областьd docs.
3. Найди локальные patterns в соседнем коде, но оцени их через safety/correctness.
4. Составь короткий change plan: что меняется, какие contracts задеты, какие проверки нужны.
5. Внеси минимальное связное изменение.
6. Если в touched area виден очевидный unsafe/fragile код, выбери один вариант:
   - исправь локально, если это безопасно и не расширяет область;
   - запиши risk/refactor gap с evidence, если нужен отдельный slice;
   - остановись с blocker, если продолжение создаст риск security/data loss/regression.
7. Добавь или обнови тесты, если change влияет на behavior.
8. Запусти проверки по blast radius.
9. Обнови docs/RAG, если изменились архитектура, flow, risk или способ проверки.

## Контрольные gates

- Нельзя писать поверх неизвестного shared behavior без чтения callers/consumers.
- Нельзя усиливать плохой локальный pattern только ради согласованности.
- Нельзя добавлять зависимость без проверки существующих alternatives, размера, поддержки и security risk.
- Нельзя менять public contract без compatibility notes и проверки consumers.
- Нельзя считать UI/API/backend flow проверенным без evidence.
- Нельзя скрывать test/security/performance gaps: запиши их явно.

## Проверки По Слою

Заполни этот блок при генерации skill под конкретный stack. Не оставляй generic bullets.

### Frontend UI

- design system/tokens/components соблюдены;
- semantic HTML и keyboard accessibility работают;
- focus handling есть для dialogs/drawers/popovers/menus;
- loading, empty, error, disabled, success и permission states покрыты;
- responsive behavior проверен на project breakpoints или 320/768/1024/1440;
- state boundaries разделяют server data, form draft, UI state и derived state;
- effects/watchers/subscriptions/timers имеют cleanup/cancellation/stale-response policy;
- нет generic AI-looking UI, text overflow, clipped controls, overlapping elements.

### Backend/API

- transport layer тонкий, domain logic не размазана по controllers;
- input валидируется на boundaries;
- auth/authz проверяется server-side рядом с action/data access;
- response/error contracts стабильны и безопасны;
- multi-step writes имеют transaction/compensation/idempotency;
- retries имеют backoff, limits и cancellation;
- logs/metrics/tracing дают debugging context без secrets.

### Data/Database

- migrations совместимы с rollout/rollback plan;
- constraints/indexes защищают invariants;
- нет N+1, unbounded queries и silent partial writes;
- DTO/domain/database mapping явный;
- breaking data changes имеют migration и smoke plan.

### Testing

- bug fix имеет regression test или documented reason why not;
- domain logic покрыта unit tests;
- API/persistence boundary покрыты integration/contract tests;
- UI behavior покрыт component/browser/manual smoke;
- critical user journeys имеют e2e или smoke checklist.

### Security/Performance

- нет secrets в code/docs/logs;
- user-controlled input/output валидируется и экранируется;
- permissions/data exposure проверены;
- dependency/security-sensitive changes имеют evidence;
- hot paths не получают лишние network/render/db loops.

## Распространенные Антипаттерны

| Антипаттерн | Почему плохо | Что делать |
|---|---|---|
| “Так уже написано рядом” | Плохой pattern становится нормой | Следуй локальной архитектуре, но исправляй safety/correctness gaps |
| Broad rewrite вместо slice | Растет риск регрессии | Делай маленький проверяемый refactor slice |
| Новый shared helper без ownership | Общая абстракция тащит domain assumptions | Оставь локально или оформи explicit contract |
| Silent catch/retry | Ошибки исчезают, state становится недостоверным | Логируй безопасно, возвращай понятный error state |
| Тест только happy path | Регрессии живут в edge cases | Добавь negative/edge/regression checks |

## Условия остановки

- RAG/docs противоречат source или existing local rules.
- Изменение затрагивает shared contract с непонятным blast radius.
- Нужно менять security/auth/data integrity без достаточного evidence.
- Локальный pattern небезопасен, а исправление выходит за область.
- Нельзя воспроизвести bug или подтвердить fix.
- Проверки недоступны, а риск изменения высокий.

## Формат результата

```markdown
Инженерный результат:
- Затронутая зона:
- Подтверждение из RAG/source:
- Локальные patterns:
- Что изменено:
- Unsafe/fragile code в область:
- Проверки:
- Обновленные docs/RAG:
- Пробелы/блокеры:
```
