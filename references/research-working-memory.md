# Research Рабочая Память

Используй этот reference в `project-agent-bootstrap`, `deep-project-audit` и `project-docs-generator`.

Цель - не дать длинному bootstrap research потерять цель, evidence и ошибки в контексте модели. Агент должен вести рабочую память на диске, а финальные docs/RAG строить из нее, а не из краткой памяти после десятков tool calls.

## Главный Принцип

Для deep scan filesystem используется как внешняя рабочая память:

```text
план research -> заметки -> журнал evidence -> журнал ошибок -> docs/RAG/skills
```

Финальные документы не заменяют рабочие заметки. Рабочие заметки нужны, чтобы агент не потерял детали до момента генерации docs.

## Где Хранить

Во время bootstrap создай рабочую папку:

```text
docs/agent-system/research-workspace/
  research-plan.md
  research-notes.md
  evidence-log.md
  error-log.md
  decisions.md
```

Если проект не хочет держать рабочий workspace постоянно, после успешного bootstrap можно оставить только summary links в `research-worklog.md`, но во время research эти файлы должны существовать.

## research-plan.md

Создай до глубокого research.

Минимальная структура:

```markdown
# План Research

## Цель

## Фазы
- [ ] Phase 1: inventory проекта
- [ ] Phase 2: hot spots и blast radius
- [ ] Phase 3: critical flow traces
- [ ] Phase 4: boundary/contract review
- [ ] Phase 5: defect hunts
- [ ] Phase 6: dependency usage review
- [ ] Phase 7: tests/CI review
- [ ] Phase 8: docs/RAG payload

## Ключевые вопросы

## Текущий статус

## Ошибки/блокеры
```

Правило: перед переходом к новой фазе перечитай `research-plan.md` и обнови статус. Это возвращает цель в активный контекст и снижает риск поверхностного завершения.

## research-notes.md

Сохраняй промежуточные findings во время чтения source.

Минимальная структура:

```markdown
# Research Notes / Рабочие Заметки

## Заметки По Инвентарю Модулей

## Заметки По Hot Spots

## Заметки По Flow Traces

## Заметки По Contracts И Boundaries

## Заметки По Defect Hunts

## Заметки По Dependencies

## Заметки По Tests/CI

## Заметки По Привязкам Для Skills
```

Не складывай сюда весь source. Складывай path, function/component, что прочитано, что это значит и куда это должно попасть.

## evidence-log.md

Это журнал доказательств. Каждая строка должна быть пригодна для переноса в `research-evidence-pack.md`.

```markdown
| Time/phase | Evidence type | Path/command | Что проверено | Result | Next doc |
|---|---|---|---|---|---|
```

Evidence type:

- manifest/config;
- source module;
- entry point;
- flow trace;
- contract;
- security;
- performance/resource;
- dependency;
- test/CI;
- enterprise.

## error-log.md

Не скрывай ошибки и не делай silent retry.

Записывай:

```markdown
| Phase | Error/blocker | Cause | Resolution | Remaining gap |
|---|---|---|---|---|
```

Примеры:

- glob/path read failed;
- command unavailable;
- dependency audit blocked by network;
- Jira/Confluence probe failed;
- runtime smoke impossible;
- file too large, switched to targeted reads.

Ошибки из `error-log.md` должны попасть в `current-state.md`, `research-worklog.md` или gaps, если они влияют на confidence.

## decisions.md

Записывай инженерные решения bootstrap-а:

```markdown
| Decision | Evidence | Alternatives | Why chosen | Affected docs/skills |
|---|---|---|---|---|
```

Примеры:

- Confluence skipped;
- database layer not applicable;
- `frontend-ui-engineering` generated, `database-safety` not generated;
- dependency audit freshness gap accepted;
- refactor slice starts from formation helper.

## Update Rhythm

Обновляй workspace:

- после каждого research pass;
- после каждого confirmed finding;
- после каждого blocker/error;
- перед docs generation;
- перед skills generation.

Перед `project-docs-generator` перечитай:

1. `research-plan.md`;
2. `research-notes.md`;
3. `evidence-log.md`;
4. `error-log.md`;
5. `decisions.md`.

## Что Нельзя Делать

- Нельзя вести research только в чате.
- Нельзя писать финальные docs, если `evidence-log.md` пустой или содержит только file tree/search summary.
- Нельзя скрывать ошибки команд и чтения файлов.
- Нельзя переходить к skills, если `research-notes.md` не содержит skill hooks.
- Нельзя использовать рабочий workspace как замену финальным docs/RAG.

## Итог Для Final Docs

`project-docs-generator` должен явно использовать workspace:

```text
research-plan.md -> research-worklog.md/current-state.md
research-notes.md -> full-project-research-report.md/knowledge-base.md
evidence-log.md -> research-evidence-pack.md
error-log.md -> gaps/current-state.md
decisions.md -> agent-operating-model.md/enterprise-integrations.md/generated skills
```
