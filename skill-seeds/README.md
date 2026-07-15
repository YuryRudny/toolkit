# Skill Seeds

Эта папка содержит встроенную библиотеку seed playbooks для `reusable-agent-system-toolkit`.

Seed - не готовый project-local skill. Это качественный scaffold, который помогает генератору писать skills уровня senior engineer после deep research.

## Правило Использования

Во время full bootstrap агент обязан:

1. Дождаться `Docs/RAG Ready`.
2. Прочитать `skill-seeds/manifest.json`.
3. Выбрать seeds по dependency/path/stack/RAG evidence.
4. Записать `selected`, `recommended`, `skipped` и evidence.
5. Прочитать `SEED.md` только для selected seeds.
6. Смешать seed с RAG, project map, risk register, refactor plan, existing rules и stack profile.
7. Сгенерировать русскоязычный project-local skill и skill-specific reference.

## Запрещено

- Копировать `SEED.md` в `codex-skills/skills` как финальный skill.
- Выбирать stack seed без evidence.
- Оставлять англоязычные runtime instructions в generated skills.
- Подменять deep research библиотекой seeds.
- Генерировать skill, который можно перенести в другой проект без потери смысла.

## Как Добавлять Seed

1. Создай папку в подходящей категории.
2. Добавь `SEED.md` на русском языке.
3. Опиши назначение, quality bar, проверки и обязательную адаптацию под проект.
4. Добавь запись в `manifest.json`:
   - `id`;
   - `category`;
   - `path`;
   - `detect`;
   - `targets`;
   - `priority`.
5. Проверь, что seed не дублирует уже существующий.

## Стартовые Категории

- `architecture` - code review, refactor.
- `frontend` - UI quality, Next.js, Tailwind.
- `backend` - NestJS.
- `testing` - MSW.
- `validation` - Zod.
- `mobile` - Capacitor.

## External Library

Полные импортированные библиотеки лежат здесь:

```text
skill-seeds/external/agent-skills-main/
skill-seeds/external/ai-agents-skills-main/
```

Индексы:

- `skill-seeds/external/agent-skills-main.manifest.json`
- `skill-seeds/external/agent-skills-main.index.md`
- `skill-seeds/external/ai-agents-skills-main.manifest.json`
- `skill-seeds/external/ai-agents-skills-main.index.md`

Внутри 110 импортированных top-level skills источника `agent-skills-main`. Тестовая фикстура `skill-creator/fixtures/broken-skill` не включена в рабочий manifest как отдельный seed.

Внутри 9 импортированных top-level skills источника `ai-agents-skills-main`, плюс общие `agents`, `docs`, `prompts`, `references`. Этот источник предпочтителен для core quality playbooks, потому что он уже русскоязычный и содержит более плотные engineering workflows.

Использование:

- curated seeds из корневого `manifest.json` имеют приоритет для core quality skills;
- `ai-agents-skills-main` имеет приоритет для core quality, review, debugging, frontend UI, MR review, spec-driven и CI/CD playbooks;
- `agent-skills-main` используется как широкий источник stack/domain playbooks;
- external skill можно читать только после `Docs/RAG Ready` и выбора по evidence;
- generated output все равно должен быть на русском и project-specific.
