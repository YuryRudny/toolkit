# Performance And Resource Review Form

Заполняй на русском. Ищи hot paths, caches, unbounded operations, listeners, timers, subscriptions, global state.

## Hot Paths

| Path/flow | Why hot | Risk | Evidence |
| --- | --- | --- | --- |

## Resource Lifecycle

| Resource type | Files checked | Cleanup/cancellation policy | Finding/gap |
| --- | --- | --- | --- |

## Caches/Concurrency

| Area | Cache/concurrency behavior | Failure mode | Evidence |
| --- | --- | --- | --- |

## Performance Dependencies

| Dependency/pattern | Used where | Risk | Action |
| --- | --- | --- | --- |

## Skill Payload

- Performance gates:
- Resource cleanup gates:
- Smoke/profiling checks:
