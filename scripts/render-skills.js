#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { assertSafeName, assertSafeReference, resolveInside } = require("./lib/path-safety");

const root = path.resolve(process.argv[2] || process.cwd());
const toolkitRoot = path.resolve(__dirname, "..");
const requestedSkill = process.argv[3] || null;
const inputsDir = path.join(root, "docs", "agent-system", "skill-inputs");
const skillsDir = path.join(root, "codex-skills", "skills");
const refsDir = path.join(root, "codex-skills", "references");
const assemblyDir = path.join(root, "docs", "agent-system", "skill-assembly");

const REQUIRED_V2_ARRAYS = {
  seedExtractions: ["seedId", "sourcePath", "sectionsUsed", "rulesTaken", "rulesRejected", "projectAdaptation", "extractedSections"],
  profileRoles: ["id", "title", "purpose", "seedHints", "projectEvidence"],
  ragRoutes: ["label", "path", "when"],
  projectHooks: ["name", "paths", "why"],
  criticalFlows: ["name", "entry", "chain", "risk"],
  localRisks: ["id", "title", "severity", "evidence", "action"],
  workflowSteps: ["step", "action", "evidence", "output"],
  layerChecks: ["layer", "check", "evidence", "verification"],
  gates: ["gate", "trigger", "action"],
  stopConditions: ["condition", "why", "nextAction"],
  resultFormat: ["field", "content"],
};

const FORBIDDEN_PLACEHOLDER_MARKERS = [
  /Перед status=ready/i,
  /уточнить по knowledge-index/i,
  /Flow из RAG/i,
  /Source root/i,
  /заполнить после research/i,
  /заполнить реальные/i,
];

const ENGLISH_RUNTIME_MARKERS = [
  /\b(Read|Run|Use|Never|Stop|Review|Demand|Capture|Reproduce|Fix|Add|Check|Findings|Scope|Evidence|Validation|Blockers)\b/,
  /\bPreferred patterns\b/i,
  /\bAnti-patterns\b/i,
  /\bCritical flows\b/i,
  /\bCommands\/checks\b/i,
];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function text(value) {
  if (Array.isArray(value)) return value.filter(Boolean).join(" -> " );
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function compact(value, limit = 12) {
  if (Array.isArray(value)) return text(value.slice(0, limit));
  return text(value);
}

function normalizeRu(value) {
  return text(value)
    .replace(/\bEvidence\b/g, "Подтверждение")
    .replace(/\bQuality gates\b/g, "Контроль качества")
    .replace(/\bProject evidence\b/g, "Проектное подтверждение")
    .replace(/\bproject evidence\b/g, "проектное подтверждение")
    .replace(/\bUnsafe pattern\b/g, "Небезопасный pattern")
    .replace(/\bmanual smoke\b/g, "ручной smoke")
    .replace(/\btest baseline\b/g, "тестовый baseline")
    .replace(/(^|[^А-Яа-яЁё])можна(?=$|[^А-Яа-яЁё])/g, "$1может")
    .replace(/невозможет/g, "невозможна")
    .replace(/без тестовый baseline/g, "без тестового baseline");
}

function normalizeFlowPart(value) {
  return normalizeRu(value)
    .replace(/^`|`$/g, "")
    .replace(/`/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.;]\s*$/, "");
}
function hasCyrillic(value) {
  return /[А-Яа-яЁё]/.test(text(value));
}

function seedPurpose(seedId) {
  const id = text(seedId);
  if (/review|code-review/i.test(id)) return "senior-подход к ревью: корректность, архитектура, безопасность, performance, тестовая защита";
  if (/typescript/i.test(id)) return "проверки TypeScript boundary: типы, error shape, runtime guards и сложность типов";
  if (/ui|frontend/i.test(id)) return "production UI: состояния, accessibility, responsive, локализация и визуальная дисциплина";
  if (/api|backend/i.test(id)) return "API/server boundaries: validation, auth, errors, contracts, observability";
  if (/capacitor|mobile/i.test(id)) return "mobile shell: native bridge, permissions, build/sync, device smoke";
  if (/test|ci/i.test(id)) return "проверки по blast radius: unit/integration/e2e/smoke и CI gates";
  if (/security|performance/i.test(id)) return "trust boundaries, dependency risks, resource lifecycle и runtime cost";
  if (/debug/i.test(id)) return "debug flow: симптом, воспроизведение, первопричина, минимальный fix, regression check";
  if (/refactor/i.test(id)) return "safe refactor: slice, boundaries, behavior preservation, rollback path";
  return "правила seed используются как reference; в runtime переносится только применимое к проекту";
}

function ruList(values, limit, fallback) {
  const list = (Array.isArray(values) ? values : [values])
    .filter(Boolean)
    .map(normalizeRu)
    .filter(hasCyrillic)
    .slice(0, limit);
  return list.length ? list.join(" -> ") : fallback;
}

function summarizeSeedExtraction(seed) {
  const adapted = ruList(seed.projectAdaptation, 4, "заменить общие примеры на paths, risks, flows и проверки проекта");
  const gates = ruList(seed.qualityGates, 3, "усилить проверку результата, security/performance risk и regression gap");
  return {
    seed: seed.seedId,
    source: seed.sourcePath,
    used: seedPurpose(seed.seedId),
    adapted,
    gates,
  };
}

function bullet(items, render) {
  const arr = Array.isArray(items) ? items.filter(Boolean) : [];
  if (!arr.length) return "- Не заполнено";
  return arr.map((item) => `- ${render ? render(item) : text(item)}`).join("\n");
}

function numbered(items, render) {
  const arr = Array.isArray(items) ? items.filter(Boolean) : [];
  if (!arr.length) return "1. Не заполнено";
  return arr.map((item, index) => `${index + 1}. ${render(item)}`).join("\n");
}

function table(rows, headers) {
  const safeRows = Array.isArray(rows) ? rows : [];
  const head = `| ${headers.map((h) => h.label).join(" | ")} |`;
  const sep = `| ${headers.map(() => "---").join(" | ")} |`;
  if (!safeRows.length) return [head, sep, `| ${headers.map(() => "Не заполнено").join(" | ")} |`].join("\n");
  return [
    head,
    sep,
    ...safeRows.map((row) => `| ${headers.map((h) => text(row[h.key]).replace(/\n/g, "<br>")).join(" | ")} |`),
  ].join("\n");
}

function sectionMap(markdown) {
  const lines = markdown.split(/\r?\n/);
  const sections = new Map();
  let current = null;
  let body = [];

  for (const line of lines) {
    const match = line.match(/^##\s+(.+?)\s*$/);
    if (match) {
      if (current) sections.set(current, body.join("\n").trim());
      current = match[1];
      body = [];
    } else if (current) {
      body.push(line);
    }
  }

  if (current) sections.set(current, body.join("\n").trim());
  return sections;
}

function hasRequiredFields(item, fields) {
  return item && typeof item === "object" && !Array.isArray(item) && fields.every((field) => {
    const value = item[field];
    return Array.isArray(value) ? value.length > 0 : text(value).length > 0;
  });
}

function containsEnglishRuntime(value) {
  const source = typeof value === "string" ? value : JSON.stringify(value || "");
  return ENGLISH_RUNTIME_MARKERS.some((pattern) => pattern.test(source));
}

function stringValues(value, out = []) {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) value.forEach((item) => stringValues(item, out));
  else if (value && typeof value === "object") Object.values(value).forEach((item) => stringValues(item, out));
  return out;
}

function validateInput(input, file) {
  const failures = [];
  const serializedInput = stringValues(input).join("\n");
  for (const pattern of FORBIDDEN_PLACEHOLDER_MARKERS) {
    if (pattern.test(serializedInput)) failures.push(`input contains forbidden placeholder marker ${pattern}`);
  }
  if (input.schemaVersion !== 2) failures.push("schemaVersion must be 2");
  if (input.status !== "ready") failures.push("status must be `ready`");
  if (!input.skillName || !input.title || !input.description) failures.push("skillName/title/description are required");
  try {
    assertSafeName(input.skillName, "skillName");
  } catch (error) {
    failures.push(error.message);
  }

  for (const [key, fields] of Object.entries(REQUIRED_V2_ARRAYS)) {
    const values = input[key];
    if (!Array.isArray(values) || values.length === 0) {
      failures.push(`${key} must contain typed project-specific entries`);
      continue;
    }
    values.forEach((item, index) => {
      if (!hasRequiredFields(item, fields)) {
        failures.push(`${key}[${index}] must be object with fields: ${fields.join(", ")}`);
      }
      if (key !== "seedExtractions" && key !== "profileRoles" && containsEnglishRuntime(item)) {
        failures.push(`${key}[${index}] contains English runtime prose; write Russian prose and keep English only in paths/code/API names`);
      }
    });
  }

  for (const key of ["useWhen", "doNotUseWhen", "qualityBar", "preferredPatterns", "antiPatterns"]) {
    if (!Array.isArray(input[key]) || input[key].length === 0) failures.push(`${key} must contain Russian project-specific entries`);
    if (containsEnglishRuntime(input[key])) failures.push(`${key} contains English runtime prose`);
  }

  if (!input.profileId || !input.profileTitle) failures.push("profileId/profileTitle are required");
  if (input.seedExtractionStatus !== "extracted") failures.push("seedExtractionStatus must be extracted before render");
  if (!input.seedExtractionFile) failures.push("seedExtractionFile is required");
  if (!Array.isArray(input.references) || input.references.length === 0) {
    failures.push("references must contain at least one skill-specific reference");
  } else {
    for (const reference of input.references) {
      try {
        assertSafeReference(reference);
      } catch (error) {
        failures.push(error.message);
      }
    }
  }
  if (input.skillName && input.seedExtractionFile !== `docs/agent-system/seed-extractions/${input.skillName}.json`) {
    failures.push("seedExtractionFile must match skillName");
  }
  return failures.map((failure) => `${path.relative(root, file)}: ${failure}`);
}

function renderRagRoute(route) {
  return `\`${route.path}\` - ${normalizeRu(route.label)}; читать когда: ${normalizeRu(route.when)}; достать: ${normalizeRu(route.extract)}`;
}

function renderHook(hook) {
  return `${normalizeRu(hook.name)}: ${text(hook.paths)}. Зачем: ${normalizeRu(hook.why)}. Проверять: ${normalizeRu(hook.inspect)}`;
}

function renderFlow(flow) {
  const entry = normalizeFlowPart(flow.entry);
  const chain = Array.isArray(flow.chain) ? flow.chain.map(normalizeFlowPart).filter(Boolean).join(" -> ") : normalizeFlowPart(flow.chain);
  const risk = normalizeFlowPart(flow.risk || "risk id не указан");
  const verification = normalizeFlowPart(flow.verification || "подобрать smoke из smoke-checklist");
  return normalizeRu(flow.name) + ": вход `" + entry + "`; цепочка: " + chain + "; риски: " + risk + "; проверка: " + verification;
}
function renderWorkflow(step) {
  return `**${normalizeRu(step.step)}.** ${normalizeRu(step.action)} Основание: ${normalizeRu(step.evidence)}. Выход шага: ${normalizeRu(step.output)}.`;
}

function renderLayerCheck(check) {
  return `${normalizeRu(check.layer)}: ${normalizeRu(check.check)}. Основание: ${normalizeRu(check.evidence)}. Проверка: ${normalizeRu(check.verification)}.`;
}


function roleAction(role, input) {
  const id = text(role.id);
  const riskIds = (input.localRisks || []).map((risk) => risk.id).filter(Boolean).slice(0, 4).join(", ") || "risk-register";
  const flows = (input.criticalFlows || []).map((flow) => flow.name).filter(Boolean).slice(0, 3).join(", ") || "критические потоки";
  const hooks = (input.projectHooks || []).map((hook) => hook.name).filter(Boolean).slice(0, 3).join(", ") || "project hooks";

  if (/approval|severity|result/i.test(id)) return `сформировать verdict по ${riskIds}; каждое замечание должно иметь severity, source-подтверждение и проверку`;
  if (/reviewLenses|architectureReview|securityReview|performanceReview|testingReview/i.test(id)) return `пройти эту линзу на touched area: ${hooks}; не терять flows: ${flows}`;
  if (/uiSurface|component|stateMatrix|accessibility|responsive|visual|unsafeHtml|ssr/i.test(id)) return `проверить UI surface, состояния, accessibility/responsive и runtime risks; связать наблюдения с ${riskIds}`;
  if (/entryBoundary|validation|auth|errorContract|resource|observability/i.test(id)) return `проверить boundary, contract, auth/error/resource behavior и consumers; связать наблюдения с ${riskIds}`;
  if (/symptom|reproduce|rootCause|regression/i.test(id)) return `вести расследование от симптома к первопричина; подтвердить через ${flows} и regression check`;
  if (/slice|baseline|rollback|coupling/i.test(id)) return `держать refactor в safe slice; baseline и rollback должны быть понятны до diff`;
  if (/test|coverage|ci|blast/i.test(id)) return `выбрать минимальную проверку, которая ловит риск; если проверки нет, записать конкретный gap`;
  if (/mobile|native|bridge|permission/i.test(id)) return `проверить web/native contract, permissions, bridge errors и build/sync path`;
  return `применить роль к touched area, подтвердить source/RAG и записать outcome в формате skill`;
}

function roleEvidence(role) {
  const evidence = Array.isArray(role.projectEvidence) ? role.projectEvidence : [role.projectEvidence];
  return evidence.filter(Boolean).map(normalizeRu).join(" -> ") || "RAG/source-подтверждение";
}

function renderProfileRole(role) {
  return `${role.title}: ${normalizeRu(role.purpose)} Опора из seed: ${normalizeRu(role.seedHints)}. Проектная опора: ${normalizeRu(role.projectEvidence)}.`;
}


function operationalWorkflow(input) {
  const name = input.skillName;
  const verify = { step: "Проверка", action: "запустить подходящую команду, выполнить smoke или честно записать gap", evidence: "package scripts, smoke-checklist, risk-register", output: "проверенный результат или остаточный риск" };
  const bySkill = {
    "code-review-and-quality": [
      { step: "Область", action: "определить touched area, consumers, критические потоки и risk ids", evidence: "задача, diff, RAG, source", output: "границы ревью и blast radius" },
      { step: "Линзы ревью", action: "проверить correctness, readability, architecture, security, performance и tests", evidence: "profile roles, risk-register, source neighbors", output: "наблюдения с severity и подтверждение" },
      { step: "Вердикт", action: "отделить blocker/request changes от suggestion/nit", evidence: "impact, exploitability, regression risk", output: "решение approve/request changes/blocker" },
      verify,
    ],
    "frontend-ui-engineering": [
      { step: "UI-поверхность", action: "найти page/layout/components/store/composable и соседние UI patterns", evidence: "project-map, source neighbors, styles", output: "карта UI surface" },
      { step: "Матрица состояний", action: "проверить loading, empty, error, disabled, success, permission, long text и i18n", evidence: "критические потоки, components, smoke-checklist", output: "закрытые states или gaps" },
      { step: "UI качество", action: "проверить accessibility, responsive, SSR/client guards, cleanup и raw HTML trust", evidence: "risk-register, component source, browser/manual smoke", output: "UI наблюдения или локальный fix" },
      verify,
    ],
    "frontend-state-and-data": [
      { step: "Трассировка данных", action: "пройти page/component -> store/composable -> repository/server -> DTO/API", evidence: "architecture-map, source, критические потоки", output: "trace chain и boundary" },
      { step: "State consistency", action: "проверить stale data, duplicate requests, race conditions, loading/error mismatch и unsafe casts", evidence: "stores, repositories, risk-register", output: "state наблюдения или fix" },
      { step: "Boundary guard", action: "добавить guard/normalizer или записать contract gap для external data", evidence: "DTO, runtime usage, error paths", output: "решение по безопасной границе" },
      verify,
    ],
    "backend-engineering": [
      { step: "API boundary", action: "найти route/handler/server util, external calls и consumers", evidence: "architecture-map, server source, project hooks", output: "границы API изменения" },
      { step: "Contract/security", action: "проверить validation, auth authority, error shape, null/empty cases и compatibility", evidence: "DTO/schema, risk-register, consumers", output: "contract/security наблюдения" },
      { step: "Runtime", action: "проверить cache keys, timeout, retries, timers, streams, logging и secret leaks", evidence: "server utils/plugins, performance forms", output: "resource/perf decision" },
      verify,
    ],
    "api-contract-safety": [
      { step: "Producer/consumer map", action: "найти всех producers, consumers и формат данных на boundary", evidence: "repositories, server routes, DTO/types", output: "contract impact map" },
      { step: "Runtime-защита", action: "проверить schema/normalizer/fallback/error contract и backwards compatibility", evidence: "risk-register, source, критические потоки", output: "guard/fix/gap" },
      { step: "Regression path", action: "подобрать проверку, которая ловит contract drift", evidence: "smoke-checklist, package scripts", output: "contract verification" },
      verify,
    ],
    "debugging-and-error-recovery": [
      { step: "Симптом", action: "зафиксировать observable failure, affected flow, environment и last changes", evidence: "issue/logs/browser/API/source", output: "точный симптом" },
      { step: "Repro/первопричина", action: "построить repro или strongest подтверждение trail; пройти data flow, contract, lifecycle, cache", evidence: "commands, logs, source trace", output: "первопричина с файлом и условием" },
      { step: "Исправление", action: "исправить причину минимальным slice, не маскируя симптом", evidence: "diff, neighbors, risk-register", output: "исправление причины" },
      verify,
    ],
    "refactor-engineering": [
      { step: "Baseline", action: "зафиксировать текущее поведение и safety checks до diff", evidence: "source, smoke-checklist, current-state", output: "behavior baseline" },
      { step: "Safe slice", action: "разрезать refactor по boundary, consumers и rollback path", evidence: "refactor-plan, architecture-map", output: "slice plan" },
      { step: "Simplify", action: "снизить coupling/duplication/unsafe pattern без feature creep", evidence: "diff, neighbor patterns, risk-register", output: "упрощение без смены поведения" },
      verify,
    ],
    "testing-strategy": [
      { step: "Радиус влияния", action: "связать изменение с flow, risk ids, consumers и типом регрессии", evidence: "risk-register, критические потоки, source", output: "цель проверки" },
      { step: "Test level", action: "выбрать unit/component/integration/e2e/contract/manual smoke по цене и пользе", evidence: "existing tests, package scripts, CI", output: "план проверки" },
      { step: "Gap discipline", action: "добавить проверку или записать точный gap с причиной и next step", evidence: "CI config, smoke-checklist", output: "regression protection или gap" },
      verify,
    ],
    "security-performance-review": [
      { step: "Boundary map", action: "найти user/external input, secrets, auth, dependencies, cache и resource lifecycle", evidence: "security/performance forms, source", output: "security/perf boundary" },
      { step: "Exploit/regression path", action: "проверить XSS/injection/auth leak/SSRF/secret leak, memory leak, fan-out и bundle/runtime cost", evidence: "source search, dependency review, risk-register", output: "наблюдения с severity" },
      { step: "Mitigation", action: "исправить локально, добавить guard/policy или записать blocker/refactor item", evidence: "risk-register, refactor-plan", output: "решение по mitigation" },
      verify,
    ],
    "mobile-capacitor-shell": [
      { step: "Web/native contract", action: "сверить Nuxt output, capacitor config, ios/android project и routing assumptions", evidence: "capacitor config, package scripts, native folders", output: "mobile build contract" },
      { step: "Native risks", action: "проверить permissions, bridge errors, app state, deep links, safe area, keyboard и offline behavior", evidence: "mobile profile, native config", output: "список mobile-рисков" },
      { step: "Sync/deploy", action: "выбрать generate/cap sync/device smoke или записать невозможность проверки", evidence: "commands, smoke-checklist, platform files", output: "mobile verification path" },
      verify,
    ],
  };
  return bySkill[name] || input.workflowSteps;
}

function specializedProtocol(input) {
  const protocols = {
    "code-review": `## Severity И Verdict Protocol

| Уровень | Критерий | Действие |
| --- | --- | --- |
| Critical | exploitable security/data-loss или сломан critical flow | блокировать merge и указать воспроизведение |
| Important | подтверждённая регрессия, contract drift, architecture boundary violation | исправить до merge |
| Suggestion | измеримое улучшение maintainability без текущей регрессии | оставить как recommendation |
| Nit | мелочь без влияния, которую не ловит formatter/linter | не создавать шум |

Verdict допустим только как \`approve\`, \`request changes\` или \`blocked by missing evidence\`.`,
    debugging: `## Протокол Диагностики

| Стадия | Обязательное evidence | Запрещённый shortcut |
| --- | --- | --- |
| Симптом | exact command/route/input/role/environment | пересказ "не работает" |
| Воспроизведение | stable repro или documented blocker | случайные изменения до repro |
| Локализация | failing layer и последний корректный boundary | исправление первого подозрительного файла |
| Первопричина | causal chain и условие возникновения | маскирующий retry/catch |
| Защита | regression test/smoke/guard | заявление "починено" без проверки |`,
    refactor: `## Safe Slice Protocol

| Шаг | Требуемый результат |
| --- | --- |
| Characterization | поведение до изменения зафиксировано тестом, smoke или trace |
| Boundary | callers/consumers и внешний contract перечислены |
| Slice | одно обратимое изменение без feature work |
| Migration | порядок перехода и совместимость понятны |
| Rollback | определено, как вернуть прежнее поведение |
| Verification | поведение до/после и остаточные риски сопоставлены |`,
    "frontend-ui": `## Матрица Production UI

| Измерение | Что доказать |
| --- | --- |
| Состояния | loading, empty, error, disabled, success, permission |
| Доступность | semantic control, keyboard, focus, label/name, contrast |
| Responsive | project breakpoints, long text, overflow, touch targets |
| Runtime | SSR/client boundary, hydration, cancellation, cleanup |
| Visual system | local tokens/components/states вместо нового generic языка |
| Content safety | locale length, media fallback, trusted HTML decision |`,
    "frontend-state": `## Матрица Data Consistency

| Boundary | Проверка |
| --- | --- |
| Source of truth | один владелец состояния и понятные consumers |
| Request lifecycle | dedup/cancel/stale response/race behavior |
| Contract | runtime normalization, null/error/envelope handling |
| Mutation | authority, optimistic update, rollback, invalidation |
| UI projection | согласованные состояния загрузки, пустого результата, ошибки и доступа |
| Cache | key scope, freshness, invalidation и locale/user boundaries |`,
    "backend-api": `## Матрица Request И Runtime Safety

| Boundary | Проверка |
| --- | --- |
| Input | schema validation, size/format limits, unsafe values |
| Auth | authentication и authorization на authoritative boundary |
| Mutation | transaction/idempotency/concurrency/rollback |
| Output | stable success/error contract без secret leakage |
| Dependencies | timeout, retry budget, circuit breaker, cancellation |
| Observability | structured logs, correlation, metrics, safe context |`,
    testing: `## Матрица Выбора Проверки

| Изменение | Минимальная защита |
| --- | --- |
| Pure logic | unit test с edge cases |
| Component/state | component/integration test состояния и событий |
| API contract | contract/integration test producer-consumer boundary |
| Critical user flow | e2e или воспроизводимый smoke |
| Build/config | clean build и relevant runtime startup |
| Невозможная автоматизация | documented manual evidence и отдельный gap |`,
    "security-performance": `## Threat И Resource Matrix

| Класс | Проверка |
| --- | --- |
| Trust boundary | injection, XSS, SSRF, path/file abuse, deserialization |
| Identity/data | authz, tenant/user scope, PII, secrets, logging |
| Dependency | usage surface, advisory freshness, replacement cost |
| Resource lifecycle | listener/timer/socket/stream/file cleanup |
| Runtime cost | fan-out, N+1, unbounded work, duplicate requests |
| Cache | key isolation, invalidation, stale/error behavior |`,
    "mobile-capacitor": `## Матрица Web И Native Boundary

| Область | Проверка |
| --- | --- |
| Build sync | web output, cap sync/copy, native project consistency |
| Permissions | declaration, runtime request, denial/degraded path |
| Lifecycle | foreground/background/resume and listener cleanup |
| Bridge | unavailable plugin, platform guards, typed errors |
| Device UI | safe area, keyboard, orientation, touch and offline states |
| Release | native build evidence, versioning and rollback path |`,
  };
  return protocols[input.profileId] || `## Специализированный Протокол

Применяй роли профиля \`${input.profileId}\` последовательно и фиксируй evidence/output для каждой роли.`;
}

function renderSkill(input) {
  const seedRows = (input.seedExtractions || []).map(summarizeSeedExtraction);

  return `---
name: ${input.skillName}
description: ${input.description}
---

# ${input.title}

## Обзор

${input.overview}

## Когда использовать

${bullet(input.useWhen)}

## Не использовать когда

${bullet(input.doNotUseWhen)}

## Обязательные Чтения

${bullet(input.ragRoutes, renderRagRoute)}
${bullet(input.references, (reference) => `\`${reference}\` - skill-specific playbook и примеры применения`)}

## Быстрый Маршрут По RAG

${table(input.ragRoutes, [
  { key: "label", label: "Что нужно" },
  { key: "path", label: "Где читать" },
  { key: "when", label: "Когда открывать" },
  { key: "extract", label: "Что достать" },
])}

## Использованные Seeds

${table(seedRows, [
  { key: "seed", label: "Seed" },
  { key: "source", label: "Источник" },
  { key: "used", label: "Что перенесено" },
  { key: "adapted", label: "Как адаптировано под проект" },
  { key: "gates", label: "Какие gates усилены" },
])}

## Профиль Senior Playbook

Профиль: ${input.profileTitle} (${input.profileId}). Ниже рабочие роли, которые агент применяет к touched area вместе с RAG, risk-register и smoke-checklist проекта.

${table((input.profileRoles || []).map((role) => ({
  role: role.title,
  purpose: normalizeRu(role.purpose),
  action: roleAction(role, input),
  evidence: roleEvidence(role),
})), [
  { key: "role", label: "Линза" },
  { key: "purpose", label: "Зачем" },
  { key: "action", label: "Как применять" },
  { key: "evidence", label: "Проектная опора" },
])}

## Карта Контекста Проекта

${bullet(input.projectHooks, renderHook)}

## Критические Потоки

${bullet(input.criticalFlows, renderFlow)}

## Локальные Антипаттерны И Риски

${table(input.localRisks, [
  { key: "id", label: "ID" },
  { key: "title", label: "Риск" },
  { key: "severity", label: "Серьёзность" },
  { key: "evidence", label: "Подтверждение" },
  { key: "action", label: "Действие skill" },
])}

Антипаттерны:

${bullet(input.antiPatterns)}

Предпочтительные локальные patterns:

${bullet(input.preferredPatterns)}

## Планка Качества

${bullet(input.qualityBar)}

${specializedProtocol(input)}

## Порядок работы

${numbered(operationalWorkflow(input), renderWorkflow)}

## Проверки По Слою

${bullet(input.layerChecks, renderLayerCheck)}

Команды и smoke-проверки:

${bullet(input.commands, (command) => `\`${command}\``)}

## Контрольные gates

${bullet(input.gates, (gate) => `${normalizeRu(gate.gate)}: если ${normalizeRu(gate.trigger)}, то ${normalizeRu(gate.action)}.`)}

## Условия остановки

${bullet(input.stopConditions, (condition) => `${normalizeRu(condition.condition)}: ${normalizeRu(condition.why)}. Дальше: ${normalizeRu(condition.nextAction)}.`)}

## Формат результата

\`\`\`markdown
${input.resultFormat.map((field) => `- ${field.field}: ${field.content}`).join("\n")}
\`\`\`
`;
}

function renderAssembly(input) {
  const rendered = renderSkill(input);
  const sectionsByName = sectionMap(rendered);
  const sections = [...sectionsByName.keys()];
  const sectionBlocks = sections.map((section) => {
    const body = sectionsByName.get(section) || "Не заполнено";
    return `## Section Render: ${section}

- Template intent: ${section}
- Base input: ${(input.selectedSeeds || []).join(", ")}
- Проектная опора: ${input.projectHooks.map((hook) => hook.name).concat(input.localRisks.map((risk) => risk.id)).slice(0, 10).join("; ")}
- Итоговый текст для SKILL.md:

\`\`\`markdown
${body}
\`\`\`
`;
  }).join("\n");

  return `# Skill Assembly Sheet

## Target Output

- Target skill name: ${input.skillName}
- Target output path: \`codex-skills/skills/${input.skillName}/SKILL.md\`
- Target full template: ${input.targetTemplate}
- Skill type: compiled full-install skill
- Trigger: ${input.useWhen.join("; ")}
- Не использовать когда: ${input.doNotUseWhen.join("; ")}
- Required skill-specific reference: ${input.references.join(", ")}

## Base Skill From Library

- Selected base skill: ${(input.selectedSeeds || []).join(", ")}
- Library/source path: ${(input.seedExtractions || []).map((seed) => `\`${seed.sourcePath}\``).join(", ")}
- Почему выбран: подтверждение stack и проекта из \`create-skill-inputs.js\` плюс completed research/RAG
- Подтверждение из stack/RAG: ${input.projectHooks.map((hook) => hook.name).join("; ")}
- Opened bundled resources: фиксируется агентом в worklog при установке

## Base Skill Extraction

${table((input.seedExtractions || []).map((seed) => ({
    section: seed.seedId,
    source: seed.sourcePath,
    take: "да",
    why: text(seed.sectionsUsed),
    rules: text(seed.rulesTaken),
    gates: text(seed.qualityGates),
    format: text(seed.resultFormat),
    adapt: text(seed.projectAdaptation),
  })), [
    { key: "section", label: "Base section/rule" },
    { key: "source", label: "Источник seed" },
    { key: "take", label: "Берём" },
    { key: "why", label: "Секции" },
    { key: "rules", label: "Правила" },
    { key: "gates", label: "Gates" },
    { key: "format", label: "Формат" },
    { key: "adapt", label: "Как адаптируем" },
  ])}

## Removed Or Downgraded Base Rules

${bullet(input.seedRejections || ["Чужие stack assumptions, общие советы без проектного подтверждения, правила без проверяемого выхода."])}

## Senior Profile Roles

${table(input.profileRoles || [], [
    { key: "title", label: "Роль" },
    { key: "purpose", label: "Зачем" },
    { key: "seedHints", label: "Опора из seed" },
    { key: "projectEvidence", label: "Проектная опора" },
  ])}

## Карта Проектной Опоры

${table([
    { type: "RAG routes", evidence: input.ragRoutes.map((route) => route.path).join("<br>"), impact: "первые чтения и маршрутизация по задаче" },
    { type: "Project hooks", evidence: input.projectHooks.map((hook) => `${hook.name}: ${text(hook.paths)}`).join("<br>"), impact: "source scope и blast radius" },
    { type: "Critical flows", evidence: input.criticalFlows.map((flow) => flow.name).join("<br>"), impact: "регрессии и smoke-сценарии" },
    { type: "Risks", evidence: input.localRisks.map((risk) => `${risk.id}: ${risk.title}`).join("<br>"), impact: "gates, stop conditions, refactor follow-ups" },
  ], [
    { key: "type", label: "Тип evidence" },
    { key: "evidence", label: "Пути/docs/commands" },
    { key: "impact", label: "Как влияет на skill" },
  ])}

## Render Source Matrix

${table(sections.map((section) => ({
    section,
    base: input.selectedSeeds.join(", "),
    evidence: input.projectHooks.map((hook) => hook.name).concat(input.localRisks.map((risk) => risk.id)).slice(0, 8).join("; "),
    final: "см. Section Render ниже",
  })), [
    { key: "section", label: "Секция шаблона" },
    { key: "base", label: "Секция или правило seed" },
    { key: "evidence", label: "Проектная опора" },
    { key: "final", label: "Итоговый текст для SKILL.md" },
  ])}

${sectionBlocks}
## Reference Render

- Reference path: ${input.references.join(", ")}
- Why reference is needed: быстрые project-specific маршруты, плохие patterns, проверочные команды.
- Retrieval hints: ${input.projectHooks.map((hook) => hook.name).join("; ")}
- Проектные примеры: ${input.criticalFlows.map((flow) => flow.name).join("; ")}
- Known bad patterns: ${input.antiPatterns.join("; ")}
- Preferred local patterns: ${input.preferredPatterns.join("; ")}
- Команды/проверки: ${input.commands.join("; ")}
`;
}

function renderReference(input) {
  const seedRules = (input.seedExtractions || [])
    .flatMap((seed) => (seed.rulesTaken || []).map((rule) => `${seed.seedId}: ${normalizeRu(rule)}`))
    .slice(0, 14);
  const retrievalRecipes = (input.projectHooks || []).map((hook) => {
    const paths = Array.isArray(hook.paths) ? hook.paths.join(" ") : hook.paths;
    return `${normalizeRu(hook.name)}: начать с \`rg --files ${paths}\`, затем найти consumers/imports и проверить ${normalizeRu(hook.inspect)}`;
  });
  return `# ${input.title} Reference

## Назначение

Операционный reference для \`${input.skillName}\`. Он не копирует RAG, а даёт быстрые маршруты по source, рискам и проверкам.

## Когда открывать

- Когда стандартного порядка из SKILL.md недостаточно для выбора техники или source search.
- Когда нужно восстановить методологию выбранного seed без повторного чтения всей библиотеки.
- Когда требуется command recipe для незнакомой touched area.

## Retrieval Recipes

${bullet(retrievalRecipes)}

## Seed-Техники

${bullet(seedRules)}

## Где Брать Актуальные Риски И Flows

- \`docs/agent-system/knowledge-index.md\` - маршрут по типу задачи.
- \`docs/agent-system/risk-register.md\` - актуальные risk IDs и required actions.
- \`docs/agent-system/project-model.json\` - modules, entry points и capabilities.
- \`docs/agent-system/smoke-checklist.md\` - проверки критических потоков.

## Диагностические Вопросы

- Кто владеет состоянием или контрактом в затронутом flow?
- Где находится внешняя trust boundary и выполняется runtime validation?
- Какие consumers разделяют изменяемый модуль и каков blast radius?
- Какая проверка действительно поймает найденный дефект или регрессию?
- Что останется непроверенным и должно быть записано как gap?

## Командные Рецепты

${bullet(input.commands, (command) => `Для соответствующего blast radius использовать \`${command}\`; не объявлять результат passed без exit status/evidence.`)}
`;
}

if (!fs.existsSync(inputsDir)) {
  console.error(`Missing skill inputs dir: ${path.relative(root, inputsDir)}`);
  process.exit(1);
}

const inputFiles = fs.readdirSync(inputsDir)
  .filter((file) => file.endsWith(".json") && file !== "index.json")
  .filter((file) => !requestedSkill || file === `${requestedSkill}.json`)
  .map((file) => path.join(inputsDir, file));

if (requestedSkill && inputFiles.length === 0) {
  console.error(`Missing requested skill input: docs/agent-system/skill-inputs/${requestedSkill}.json`);
  process.exit(1);
}

const failures = [];
const inputs = [];
for (const file of inputFiles) {
  const input = readJson(file);
  failures.push(...validateInput(input, file));
  inputs.push(input);
}

if (failures.length) {
  console.error("Cannot render skills from incomplete structured inputs:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

ensureDir(skillsDir);
ensureDir(refsDir);
ensureDir(assemblyDir);

for (const input of inputs) {
  const skillPath = resolveInside(skillsDir, `${input.skillName}/SKILL.md`, "skill output");
  ensureDir(path.dirname(skillPath));
  fs.writeFileSync(skillPath, renderSkill(input));
  fs.writeFileSync(resolveInside(assemblyDir, `${input.skillName}.md`, "assembly output"), renderAssembly(input));
  for (const reference of input.references || []) {
    assertSafeReference(reference);
    const refPath = resolveInside(refsDir, path.basename(reference), "reference output");
    ensureDir(path.dirname(refPath));
    fs.writeFileSync(refPath, renderReference(input));
  }
}

const registryResult = spawnSync(process.execPath, [path.join(toolkitRoot, "scripts", "create-skill-registry.js"), root], {
  cwd: root,
  stdio: "inherit",
});
if (registryResult.status !== 0) process.exit(registryResult.status || 1);

console.log(`Rendered ${inputs.length} skills from structured v2 inputs.`);
