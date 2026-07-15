# Seed: Next.js App Router

## Назначение

Используй только если research подтвердил Next.js. Не применяй к Nuxt/Vue проектам.

## Области Проверки

- App Router structure: `app/`, route groups, layouts, loading/error/not-found.
- Server Components vs Client Components boundary.
- Data fetching location and cache semantics.
- Route segment config, revalidation, tags/path invalidation.
- Server Actions and mutation/error/pending states.
- Streaming/Suspense boundaries.
- Bundle size and dynamic imports.
- Hydration mismatch risks.
- Metadata/SEO and OpenGraph generation.

## High-Risk Patterns Next.js

- Over-broad `use client` boundaries.
- Client fetching for initial page data without reason.
- Cache invalidation missing after mutations.
- Barrel imports causing bundle bloat.
- Server function leaking secrets/errors to client.
- Third-party scripts blocking render.

## Обязательная Адаптация Под Проект

При генерации добавь:

- actual Next version;
- route map;
- cache/revalidation strategy;
- server/client boundaries;
- commands and CI checks;
- known route/performance risks.
