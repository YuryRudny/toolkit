# Seed: Capacitor Mobile Shell

## Назначение

Используй если research подтвердил Capacitor, `android/`, `ios/` или `@capacitor/*`.

## Области Проверки

- Platform permissions in iOS/Android config.
- Plugin lifecycle and native bridge error handling.
- Keyboard/safe-area/status-bar behavior.
- Deep links and app state transitions.
- Offline/network state.
- Push notifications and privacy-sensitive permissions.
- App store review preflight.
- Performance across webview/native bridge.

## Quality Gates Для Mobile Shell

- Test on physical devices for native/plugin changes.
- Do not assume browser API behavior equals native shell behavior.
- Handle permission denied/unavailable states.
- Avoid blocking startup with heavy JS/native calls.
- Keep native config changes explicit and reviewed.

## Обязательная Адаптация Под Проект

При генерации добавь:

- Capacitor version;
- enabled platforms;
- plugin list;
- native build commands;
- mobile-specific smoke checks;
- known platform gaps.
