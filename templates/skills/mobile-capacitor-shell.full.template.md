---
name: mobile-capacitor-shell
description: Senior playbook для Capacitor/mobile shell проекта. Используй при изменении mobile build, native plugins, platform config, web/native boundaries и release smoke.
---

# Mobile Capacitor Shell

## Обзор

Mobile shell проверяется как отдельная runtime surface: web behavior может работать, но native wrapper, permissions, plugins, deep links, assets или platform config могут ломаться отдельно.

## Когда использовать

- Есть Capacitor/Ionic/native shell evidence.
- Меняется mobile config, plugins, assets, build/copy/open scripts.
- UI/runtime behavior должен работать в native shell.

## Не использовать когда

- Проект не имеет mobile/native shell.
- Изменение не влияет на mobile runtime.

## Обязательные Чтения

- `docs/agent-system/knowledge-base.md`
- `docs/agent-system/stack-profile.md`
- `docs/agent-system/current-state.md`
- `codex-skills/references/mobile-capacitor-playbook.md`

## Быстрый Маршрут По RAG

- Mobile config: <stack route>.
- Runtime/browser API: <UI/runtime route>.
- Release/build: <testing/current-state route>.

## Использованные Seeds

| Seed | Source | Что взято | Адаптация | Что отброшено |
| --- | --- | --- | --- | --- |
| <seed> | <library/path> | <Capacitor gates> | <project native config/scripts> | <plugin-specific parts without evidence> |

## Карта Контекста Проекта

- Capacitor config: <path>.
- Native projects: <paths>.
- Scripts: <commands>.
- Plugins/permissions: <evidence>.

## Проектные Привязки

- <platform config>.
- <build/copy/open command>.
- <runtime boundary>.

## Локальные Антипаттерны И Риски

| Risk | Mobile area | Evidence | Rule |
| --- | --- | --- | --- |
| <RISK_ID> | <area> | <path> | <action> |

## Порядок работы

1. Проверь, влияет ли изменение на native shell.
2. Прочитай config/scripts/native project evidence.
3. Проверь browser API assumptions относительно native runtime.
4. Запусти или запиши blocker для доступных mobile build/copy/open checks.
5. Update smoke/release notes if platform behavior changes.

## Проверки По Слою

- Config и app ids.
- Plugins и permissions.
- Assets/deep links.
- Build/copy/open commands.
- Native runtime smoke.

## Контрольные gates

- Нет plugin/permission change без platform evidence.
- Нет browser-only assumption в native shell.
- Нет release claim без mobile smoke или blocker.

## Условия остановки

- Native project unavailable.
- Platform credentials/profiles missing.
- Plugin behavior нельзя проверить, а risk высокий.

## Формат результата

```markdown
Mobile shell:
- Affected platform:
- Config/plugins:
- Runtime boundary:
- Проверки:
- Gaps/blockers:
```
