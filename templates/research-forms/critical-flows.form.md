# Critical Flows Form

Заполняй на русском. Каждый поток должен иметь trace chain по реальным файлам.

## Flow Inventory

| Flow | User/system entry | Business value | Risk level | Evidence |
| --- | --- | --- | --- | --- |

## Flow Trace

Для каждого critical flow заполни:

```markdown
### <Flow name>

- Entry:
- UI/CLI/API/worker route:
- State/service/composable/domain layer:
- Repository/server route/adapter:
- DTO/schema/contract:
- External system/persistence:
- Error/auth/cache behavior:
- Tests/smoke:
- Risks/refactor links:
- Gaps:
```

## Cross-flow Shared Areas

| Shared area | Flows affected | Risk | Evidence |
| --- | --- | --- | --- |
