# Discovery Search Heuristics

Используй этот reference в `project-discovery`, чтобы discovery был повторяемым.

Не запускай expensive или destructive commands. Используй `rg`/`rg --files`.

## Universal File Search

Ищи:

- package/build: `package.json`, `pnpm-lock.yaml`, `yarn.lock`, `package-lock.json`, `vite.config.*`, `next.config.*`, `tsconfig*.json`, `webpack*`, `rollup*`;
- backend: `pom.xml`, `build.gradle`, `go.mod`, `pyproject.toml`, `requirements*.txt`, `composer.json`, `Cargo.toml`;
- CI/deploy: `.github/workflows`, `.gitlab-ci*.yml`, `Dockerfile*`, `docker-compose*.yml`, `k8s`, `helm`, `terraform`;
- tests: `*.test.*`, `*.spec.*`, `__tests__`, `cypress`, `playwright`, `vitest`, `jest`, `pytest`, `junit`;
- docs/rules: `README*`, `docs`, `AGENTS.md`, `.codex`, `codex-skills`, `.cursor`, `.claude`, `.github/copilot-instructions.md`.

## Frontend Search

Ищи:

- entry points: `main.ts`, `main.tsx`, `App.vue`, `App.tsx`, `pages`, `routes`, `router`;
- state: `store`, `stores`, `pinia`, `redux`, `zustand`, `valtio`, `mobx`, `context`;
- data fetching: `api`, `client`, `axios`, `fetch`, `query`, `tanstack`, `swr`;
- UI system: `components`, `shared/ui`, `design-system`, `theme`, `tokens`, `styles`, `tailwind`, `scss`;
- forms: `formik`, `react-hook-form`, `yup`, `zod`, `vee-validate`;
- risky patterns: `any`, `as any`, `unknown as`, `eslint-disable`, `TODO`, `setTimeout`, `setInterval`, `watch(`, `useEffect`, `.at(`, `[index]`.

## Backend Search

Ищи:

- entry points: `main`, `server`, `app`, `controller`, `router`, `handler`;
- domain/services: `service`, `usecase`, `domain`, `application`;
- persistence: `repository`, `entity`, `model`, `schema`, `migration`, `prisma`, `typeorm`, `sequelize`, `hibernate`, `sql`;
- validation: `zod`, `joi`, `class-validator`, `javax.validation`, `pydantic`, `validator`;
- auth/security: `auth`, `permission`, `role`, `policy`, `guard`, `middleware`;
- async/jobs: `queue`, `worker`, `job`, `cron`, `scheduler`, `kafka`, `rabbit`, `redis`;
- risky patterns: `catch`, `retry`, `transaction`, `TODO`, `any`, raw SQL, string concat queries, console/log of payloads.

## API/Data Contract Search

Ищи:

- OpenAPI/Swagger: `openapi`, `swagger`, `api-docs`;
- generated clients: `generated`, `api-client`, `schema`;
- DTO/contracts: `dto`, `request`, `response`, `contract`, `types`;
- migrations and seeds;
- response parsing by array order, labels, display names or magic strings.

## Enterprise Search

Ищи:

- Jira keys in docs/branch names;
- Confluence URLs/page ids;
- GitLab remote/group/project references;
- helper scripts under `.tmp`, `scripts`, `tools`;
- env variable names only, never values.

## Output

Discovery notes should include:

- evidence paths;
- commands found;
- high-risk modules;
- missing evidence;
- suggested generated skills.
