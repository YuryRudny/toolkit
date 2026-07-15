# Architecture Map

## System Boundaries

Опиши frontend/backend/API/database/infrastructure boundaries.

## Modules

| Module | Responsibility | Key files | Consumers | Risks |
|---|---|---|---|---|

## Data Flow

Опиши request, response, persistence, cache, queue и event flows.

## Shared Components Or Services

| Component/service | Used by | Contract | Risk level | Required checks |
|---|---|---|---|---|

## Архитектура Rules

- Держи domain boundaries явными.
- Не смешивай transport DTOs, domain models и UI/view models без mapping.
- Предпочитай stable identifiers и explicit contracts вместо positional или text-based lookup.

Адаптируй эти rules под реальный проект.
