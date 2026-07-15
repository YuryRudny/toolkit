# Stack Standards Guide

Используй этот guide для генерации stack-specific coding standards.

## Сначала discovery

Перед написанием standards определить:

- language и framework versions;
- package manager/build tool;
- existing lint/type/test tools;
- style system/design system;
- state management и data fetching;
- API framework и validation;
- database/ORM/migrations;
- auth/session model;
- deployment/runtime;
- existing team conventions.

## Правила адаптации

- Предпочитать existing project patterns новым libraries.
- Использовать terminology и folders проекта.
- Держать examples в целевом stack.
- Делать standards проверяемыми через review/checklists.
- Отделять general engineering rules от domain-specific rules.
- Фиксировать senior-quality bar: агент не копирует unsafe local patterns как норму.
- Для touched area требовать: inspect -> improve unsafe local code if safe -> document risk if out of scope -> verify.

## Разделы standards

Каждый generated standard skill должен содержать:

- purpose и triggers;
- required reads;
- workflow;
- quality bar;
- gates;
- stop conditions;
- checks;
- output format.
- touched-area remediation rule;
- risk/refactor documentation rule.

## Stack areas

Frontend:

- component architecture;
- state/data flow;
- accessibility;
- responsive layout;
- loading/error/empty states;
- visual polish;
- browser smoke.
- rule: если агент меняет UI рядом с отсутствующими loading/error/empty/disabled/accessibility states, он должен добавить их в scope или записать gap.

Backend:

- boundaries and services;
- API contracts;
- validation;
- transactions;
- idempotency;
- errors/retries;
- observability;
- security.
- rule: если агент меняет action/API рядом с отсутствующей validation/auth/transaction/idempotency защитой, он должен исправить в scope или записать blocker/risk.

Data:

- migrations;
- indexes;
- constraints;
- transaction boundaries;
- data integrity;
- rollback/compatibility.

Testing:

- unit tests for pure logic;
- component/controller tests for integration boundaries;
- contract tests where API shape matters;
- e2e smoke for critical user flows;
- regression tests for risk register items.
- rule: checks выбираются по blast radius, а не по удобству.
