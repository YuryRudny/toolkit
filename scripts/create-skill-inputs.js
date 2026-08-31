#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = path.resolve(process.argv[2] || process.cwd());
const outDir = path.join(root, "docs", "agent-system", "skill-inputs");

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

function readJson(rel) {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
  } catch {
    return null;
  }
}

function readText(rel) {
  try {
    return fs.readFileSync(path.join(root, rel), "utf8");
  } catch {
    return "";
  }
}

function readToolkitJson(rel) {
  try {
    return JSON.parse(fs.readFileSync(path.join(__dirname, "..", rel), "utf8"));
  } catch {
    return null;
  }
}

function readGeneratedJson(rel) {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
  } catch {
    return null;
  }
}

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if ([".git", "node_modules", ".nuxt", ".output", "dist", "build", "coverage", "reusable-agent-system-toolkit"].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else acc.push(path.relative(root, full));
  }
  return acc;
}

function uniq(values) {
  return [...new Set(values.filter(Boolean))];
}

function firstExisting(candidates) {
  return candidates.filter(exists);
}

function markdownTables(text) {
  const lines = text.split(/\r?\n/);
  const tables = [];
  for (let index = 0; index < lines.length - 1; index += 1) {
    const headerLine = lines[index];
    const separatorLine = lines[index + 1];
    if (!/^\|.+\|$/.test(headerLine) || !/^\|\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?$/.test(separatorLine)) continue;
    const headers = headerLine.split("|").slice(1, -1).map((cell) => cell.trim());
    const rows = [];
    index += 2;
    while (index < lines.length && /^\|.+\|$/.test(lines[index])) {
      const cells = lines[index].split("|").slice(1, -1).map((cell) => cell.trim());
      if (cells.length) rows.push(cells);
      index += 1;
    }
    index -= 1;
    tables.push({ headers, rows });
  }
  return tables;
}

function normalizeHeader(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[`*_]/g, "")
    .replace(/<br\s*\/?>/g, " ")
    .replace(/ё/g, "е")
    .replace(/\s+/g, " ")
    .trim();
}

function tableRowObjects(text) {
  return markdownTables(text).flatMap((table) => {
    const headers = table.headers.map(normalizeHeader);
    return table.rows.map((cells) => {
      const row = {};
      headers.forEach((header, index) => {
        row[header] = cells[index] || "";
      });
      row.__cells = cells;
      row.__headers = headers;
      return row;
    });
  });
}

function valueByHeader(row, candidates) {
  const normalized = candidates.map(normalizeHeader);
  for (const candidate of normalized) {
    if (row[candidate]) return row[candidate];
  }
  const header = row.__headers.find((item) => normalized.some((candidate) => item.includes(candidate) || candidate.includes(item)));
  return header ? row[header] : "";
}

function cleanInline(value) {
  return String(value || "")
    .replace(/<br\s*\/?>/g, "; ")
    .replace(/^[-*]\s+/, "")
    .replace(/`/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.;]\s*$/, "");
}

function extractTableItems(text, idPrefix, limit = 12) {
  const rows = tableRowObjects(text);
  const items = [];
  for (const row of rows) {
    const joined = row.__cells.join(" ");
    const id = joined.match(new RegExp(`\\b${idPrefix}-[A-Z0-9-]+\\b`))?.[0];
    if (!id || items.some((item) => item.id === id)) continue;
    const idIndex = row.__cells.findIndex((cell) => cell.includes(id));
    const severity = cleanInline(valueByHeader(row, ["Severity", "Серьезность", "Серьёзность", "Priority", "Impact", "Приоритет"]))
      || cleanInline(row.__cells.find((cell) => /critical|high|medium|low|крит|выс|сред|низ/i.test(cell)))
      || "не указана";
    const title = cleanInline(valueByHeader(row, [
      "Подтвержденная проблема",
      "Подтверждённая проблема",
      "Finding",
      "Problem",
      "Риск",
      "Описание",
      "Область / flow",
      "Область",
      "Flow",
    ])) || cleanInline(row.__cells[idIndex + 1]) || `${idPrefix}-item`;
    const evidence = cleanInline(valueByHeader(row, ["Evidence", "Подтверждение", "Source evidence", "Факты"]))
      || "docs/agent-system/risk-register.md";
    const action = cleanInline(valueByHeader(row, [
      "Рекомендация",
      "Action",
      "Следующее действие",
      "Обязательные проверки",
      "Next step",
      "Fix",
      "Mitigation",
    ])) || "проверить touched area, исправить локально или записать refactor-gap с владельцем и next step";
    items.push({ id, title, severity, evidence, action });
  }
  return items.slice(0, limit);
}

function extractRisks(text) {
  return extractTableItems(text, "R", 12);
}

function extractGaps(text) {
  return extractTableItems(text, "G", 10);
}

function extractRefactorLinks(text) {
  return extractTableItems(text, "RF", 12);
}

function extractDocBullets(text, limit = 8) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^[-*]\s+\S/.test(line))
    .map((line) => line.replace(/^[-*]\s+/, ""))
    .filter((line) => line.length > 12 && !/template|todo|заполн/i.test(line))
    .slice(0, limit);
}

const packageJson = readJson("package.json") || {};
const deps = { ...(packageJson.dependencies || {}), ...(packageJson.devDependencies || {}) };
const scripts = packageJson.scripts || {};
const files = walk(root);
const projectModel = readGeneratedJson("docs/agent-system/project-model.json") || {};
const capabilities = projectModel.capabilities || {};

const riskRegister = readText("docs/agent-system/risk-register.md");
const refactorPlan = readText("docs/agent-system/refactor-plan.md");
const projectMap = readText("docs/agent-system/project-map.md");
const knowledgeIndex = readText("docs/agent-system/knowledge-index.md");
const smokeChecklist = readText("docs/agent-system/smoke-checklist.md");
const seedSelection = readText("docs/agent-system/seed-selection.md");
const criticalFlowsForm = readText("docs/agent-system/research-workspace/forms/critical-flows.md")
  || readText("docs/agent-system/research-workspace/forms/critical-flows.form.md");
const seedManifest = readToolkitJson("skill-seeds/manifest.json") || {};
const agentSkillsManifest = readToolkitJson("skill-seeds/external/agent-skills-main.manifest.json") || {};
const aiAgentsManifest = readToolkitJson("skill-seeds/external/ai-agents-skills-main.manifest.json") || {};

const evidence = {
  vue: capabilities.vue || !!deps.vue || files.some((file) => file.endsWith(".vue")),
  react: capabilities.react || !!deps.react || files.some((file) => file.endsWith(".tsx") || file.endsWith(".jsx")),
  nuxt: capabilities.nuxt || !!deps.nuxt || files.some((file) => /^nuxt\.config\./.test(file)),
  next: capabilities.next || !!deps.next || files.some((file) => /^next\.config\./.test(file)),
  pinia: !!deps.pinia,
  server: capabilities.server || capabilities.python || capabilities.java || capabilities.go || capabilities.rust || capabilities.dotnet || capabilities.php || capabilities.ruby || files.some((file) => /(^|\/)(server|api|routes|controllers|handlers)\//.test(file)),
  database: capabilities.database || false,
  workers: capabilities.workers || false,
  infrastructure: capabilities.kubernetes || capabilities.terraform || false,
  capacitor: capabilities.capacitor || (!!deps["@capacitor/core"] && (exists("capacitor.config.ts") || exists("capacitor.config.json") || exists("ios") || exists("android"))),
  tests: capabilities.tests || files.some((file) => /(\.spec\.|\.test\.|__tests__|tests\/|e2e\/)/.test(file)),
};

const sourceRoots = uniq((projectModel.sourceRoots || []).length
  ? projectModel.sourceRoots
  : firstExisting(["src", "app", "pages", "server", "api", "packages", "apps", "lib", "shared", "cmd", "internal", "services"]));
const commands = Object.keys(scripts).map((name) => `${name}: ${scripts[name]}`);
const parsedRisks = extractRisks(riskRegister);
const parsedGaps = extractGaps(riskRegister);
const parsedRefactorLinks = extractRefactorLinks(refactorPlan);
const docHints = uniq([
  ...extractDocBullets(projectMap, 5),
  ...extractDocBullets(knowledgeIndex, 5),
  ...extractDocBullets(refactorPlan, 5),
]);

const baseRagRoutes = [
  {
    label: "Текущее знание проекта",
    path: "docs/agent-system/knowledge-base.md",
    when: "перед выбором source scope и перед изменениями",
    extract: "доменные правила, архитектурные границы, известные ограничения",
  },
  {
    label: "Маршруты поиска",
    path: "docs/agent-system/knowledge-index.md",
    when: "когда нужно быстро найти нужный модуль, flow или риск",
    extract: "куда идти по типу задачи и какие документы открыть дальше",
  },
  {
    label: "Карта проекта",
    path: "docs/agent-system/project-map.md",
    when: "когда задача затрагивает незнакомую область",
    extract: "модули, владельцы ответственности, точки входа",
  },
  {
    label: "Риски",
    path: "docs/agent-system/risk-register.md",
    when: "перед review/refactor/debug в touched area",
    extract: "risk id, severity, evidence, обязательное действие",
  },
  {
    label: "План рефакторинга",
    path: "docs/agent-system/refactor-plan.md",
    when: "когда найден системный дефект или архитектурный долг",
    extract: "refactor item, safe slice, проверка поведения",
  },
];

const commonHooks = sourceRoots.slice(0, 8).map((rootPath) => ({
  name: `Корень исходников ${rootPath}`,
  paths: [rootPath],
  why: "точка входа для поиска touched area и соседних patterns",
  inspect: "найти владельца flow, соседние реализации, локальные helpers и тесты",
}));

function fieldLine(block, labels) {
  for (const label of labels) {
    const escaped = label.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
    const match = block.match(new RegExp("^\\s*[-*]\\s*" + escaped + "\\s*:\\s*(.+)$", "im"))
      || block.match(new RegExp("^\\s*" + escaped + "\\s*:\\s*(.+)$", "im"));
    if (match) return cleanInline(match[1]);
  }
  return "";
}

function russianizeSmoke(value) {
  return cleanInline(value)
    .replace(/no automated tests found/gi, "автотесты не найдены")
    .replace(/no automated tests/gi, "автотесты не найдены")
    .replace(/no tests found/gi, "автотесты не найдены")
    .replace(/no tests/gi, "автотесты не найдены")
    .replace(/smoke should cover/gi, "smoke должен покрыть")
    .replace(/should cover/gi, "должен покрыть")
    .replace(/should hit/gi, "должен пройти")
    .replace(/a cached API twice and observe status\/body, logs optional/gi, "cached API дважды, проверить status/body; logs optional")
    .replace(/empty state/gi, "empty state")
    .replace(/pagination/gi, "pagination")
    .replace(/locale route/gi, "locale route");
}

function extractCriticalFlows(text) {
  const blocks = text.split(/\n(?=###\s+)/).filter((block) => /^###\s+/.test(block.trim()));
  return blocks.map((block) => {
    const name = block.match(/^###\s+(.+)\s*$/m)?.[1]?.trim();
    const entry = fieldLine(block, ["Entry", "Вход"]);
    const trace = fieldLine(block, ["Trace", "Цепочка"]);
    const riskLine = fieldLine(block, ["Risks/refactor links", "Risk/refactor links", "Risks", "Risk", "Риски", "Риск"]);
    const verification = fieldLine(block, ["Tests/smoke", "Smoke", "Check", "Проверка"]);
    const sourceTrace = trace || entry;
    if (!name || !sourceTrace) return null;
    const chain = sourceTrace.split(/\s*(?:->|→)\s*/).map(cleanInline).filter(Boolean);
    const riskIds = riskLine.match(/\bR-[A-Z0-9-]+\b/g) || [];
    const refactorIds = riskLine.match(/\bRF-[A-Z0-9-]+\b/g) || [];
    const linkedIds = uniq([...riskIds, ...refactorIds]);
    return {
      name: cleanInline(name),
      entry: entry || chain[0] || sourceTrace,
      chain: chain.length ? chain : [sourceTrace],
      risk: linkedIds.length ? linkedIds.join(", ") : "risk id не указан в critical-flows.form.md",
      verification: verification ? russianizeSmoke(verification) : "подобрать smoke из docs/agent-system/smoke-checklist.md",
    };
  }).filter(Boolean).slice(0, 6);
}

const commonFlows = extractCriticalFlows(criticalFlowsForm);

const fallbackRisks = parsedRisks.length ? parsedRisks : [
  {
    id: "R-TO-FILL",
    title: "Заполнить конкретный риск из risk-register",
    severity: "уточнить",
    evidence: "docs/agent-system/risk-register.md",
    action: "не переводить skill в ready, пока риск не заменён на реальный",
  },
];

const seedPathById = new Map();
for (const seed of seedManifest.seeds || []) {
  seedPathById.set(seed.id, seed.path);
}
for (const seed of agentSkillsManifest.seeds || []) {
  seedPathById.set(seed.id, seed.path);
}
for (const seed of aiAgentsManifest.seeds || []) {
  seedPathById.set(seed.id, seed.path);
  if (seed.originalName) seedPathById.set(`ai-agents ${seed.originalName}`, seed.path);
}

const seedAliases = {
  "code-review-and-quality": "external-code-review-and-quality",
  "debugging-and-error-recovery": "external-debugging-and-error-recovery",
  "frontend-ui-engineering": "external-frontend-ui-engineering",
  "architecture-refactor": "architecture-refactor",
  "architecture-code-review": "architecture-code-review",
  "react-ui-quality": "react-ui-quality",
  "vue-ui": "external-frontend-ui-engineering",
  "typescript": "external-typescript",
  "frontend-state": "external-typescript",
  "pinia": "external-typescript",
  "api-design-principles": "external-api-design-principles",
  "backend-engineering": "external-api-design-principles",
  "testing": "external-ci-cd-and-automation",
  "security": "external-code-review-and-quality",
  "performance": "architecture-code-review",
  "capacitor": "capacitor",
};

function selectedSeedsForSkill(skillName, fallback) {
  for (const row of tableRowObjects(seedSelection)) {
    const target = cleanInline(valueByHeader(row, ["Skill", "Target skill", "Target", "Скилл"]));
    if (!target || target.replace(/`/g, "") !== skillName) continue;
    const raw = valueByHeader(row, ["Primary seeds", "Seeds", "Selected seeds", "Selected seed", "Основные seeds"]);
    const quoted = [...String(raw).matchAll(/`([^`]+)`/g)].map((match) => match[1]);
    const parsed = quoted.length ? quoted : String(raw).split(/\s*,\s*/).map(cleanInline).filter(Boolean);
    if (parsed.length) return uniq(parsed);
  }
  return fallback;
}

function seedPath(seedId) {
  return seedPathById.get(seedId)
    || seedPathById.get(seedAliases[seedId])
    || seedPathById.get(seedId.replace(/^ai-agents\s+/, "external-"))
    || "заполнить sourcePath selected seed";
}

function seedExtraction(seedId, spec) {
  return {
    seedId,
    sourcePath: seedPath(seedId),
    sectionsUsed: [
      "назначение skill и условия включения",
      "порядок работы",
      "инженерная планка качества",
      "формат результата",
    ],
    rulesTaken: [
      `держать фокус на ${spec.focus}`,
      "требовать подтверждение перед выводом",
      "разделять локальное исправление, системный риск и последующее действие",
      "завершать работу проверкой или честно записанным пробелом",
    ],
    rulesRejected: [
      "правила чужого стека без подтверждения зависимостями и исходниками проекта",
      "общие советы без пути к файлу, risk id или проверяемого выхода",
      "копирование seed как финального project-local skill",
    ],
    projectAdaptation: [
      "связать процесс seed с RAG-маршрутами",
      "заменить общие примеры на проектные привязки и критические потоки",
      "привязать gates к risk-register и smoke-checklist",
    ],
    qualityGates: [
      "заполнить через extract-seed-playbooks.js перед render-skills.js",
    ],
    resultFormat: [
      "заполнить через extract-seed-playbooks.js перед render-skills.js",
    ],
    resourcesUsed: [],
    extractedSections: [],
  };
}

function profile(profileId) {
  return readToolkitJson("templates/skill-profiles/" + profileId + ".profile.json")
    || readToolkitJson("templates/skill-profiles/generic.profile.json")
    || { profileId: "generic", title: "Generic Senior Playbook", requiredRoles: [] };
}

function seedExtractionsFor(name, spec) {
  const extracted = readGeneratedJson("docs/agent-system/seed-extractions/" + name + ".json");
  if (extracted && Array.isArray(extracted.seedExtractions) && extracted.seedExtractions.length) {
    return extracted.seedExtractions;
  }
  return spec.seeds.map((seed) => seedExtraction(seed, spec));
}

function commandListFor(skillName) {
  const names = Object.keys(scripts);
  const isMobile = skillName === "mobile-capacitor-shell";
  const allowed = names.filter((name) => {
    if (/ios|android|cap/i.test(name)) return isMobile && evidence.capacitor;
    if (/lint|test|spec|e2e|typecheck|build|generate|preview|analyse|analyze/i.test(name)) return true;
    if (/serve|dev/i.test(name)) return /frontend|debugging|code-review/.test(skillName);
    if (/cache|clear/i.test(name)) return /backend|security|debugging|code-review/.test(skillName);
    return false;
  });
  const projectCommands = allowed.map((name) => `${name}: ${scripts[name]}`);
  if (projectModel.mode === "sidecar-workspace") {
    if (/frontend|testing|code-review|debugging/.test(skillName)) {
      projectCommands.push(
        "frontend-service: npm run lint",
        "frontend-service: npm run type-check",
        "frontend-service: npm run build",
      );
    }
    if (/backend|api-contract|testing|security|code-review|debugging|refactor/.test(skillName)) {
      projectCommands.push(
        "Java service: ./gradlew test",
        "Java service: ./gradlew check",
        "application-service: ./gradlew integrationTest",
      );
    }
  }
  return uniq(projectCommands);
}

function titleForSkill(name, fallback) {
  const map = {
    "frontend-ui-engineering": "Frontend UI Инженерия",
    "frontend-state-and-data": "Frontend State И Data Flow",
    "backend-engineering": "Backend И API Инженерия",
    "api-contract-safety": "Безопасность API Контрактов",
    "testing-strategy": "Стратегия Тестирования",
    "security-performance-review": "Security И Performance Review",
    "mobile-capacitor-shell": "Mobile Capacitor Shell",
  };
  return map[name] || fallback;
}

const catalog = {
  "code-review-and-quality": {
    title: "Ревью Кода И Качество",
    template: "code-review-and-quality.full.template.md",
    description: "Проводит многомерное senior-ревью кода с привязкой к RAG, touched area, рискам и проверкам проекта.",
    seeds: ["architecture-code-review", "external-code-review-and-quality"],
    always: true,
    reference: "code-review-and-quality-playbook.md",
    focus: "качество кода, корректность, архитектура, безопасность, производительность, тесты",
    profileId: "code-review",
  },
  "debugging-and-error-recovery": {
    title: "Отладка И Восстановление После Ошибок",
    template: "debugging-and-error-recovery.full.template.md",
    description: "Ведёт расследование дефектов до root cause, фиксирует регрессионную защиту и проверку исправления.",
    seeds: ["external-debugging-and-error-recovery"],
    always: true,
    reference: "debugging-and-error-recovery-playbook.md",
    focus: "симптом, воспроизведение, причина, минимальный fix, регрессионная проверка",
    profileId: "debugging",
  },
  "refactor-engineering": {
    title: "Инженерный Рефакторинг",
    template: "refactor-engineering.full.template.md",
    description: "Проводит безопасный refactor малыми slices с сохранением поведения и явной проверкой blast radius.",
    seeds: ["architecture-refactor", "external-refactor"],
    always: true,
    reference: "refactor-engineering-playbook.md",
    focus: "архитектурный долг, boundaries, safe slices, rollback path",
    profileId: "refactor",
  },
  "frontend-ui-engineering": {
    title: "Frontend UI Engineering",
    template: "frontend-ui-engineering.full.template.md",
    description: "Создаёт и проверяет production UI с учётом accessibility, responsive, состояний, локализации и проектных компонентов.",
    seeds: ["external-frontend-ui-engineering"],
    when: () => evidence.vue || evidence.react || evidence.nuxt || evidence.next,
    reference: "frontend-ui-engineering-playbook.md",
    focus: "UI components, состояния, accessibility, responsive, дизайн-система",
    profileId: "frontend-ui",
  },
  "frontend-state-and-data": {
    title: "Frontend State And Data",
    template: "frontend-state-and-data.full.template.md",
    description: "Контролирует frontend data flow, state, stale data, DTO boundaries и runtime guards.",
    seeds: ["external-typescript", "external-code-review-and-quality"],
    when: () => evidence.vue || evidence.react || evidence.pinia,
    reference: "frontend-state-and-data-playbook.md",
    focus: "state, cache, DTO, stale data, loading/error consistency",
    profileId: "frontend-state",
  },
  "backend-engineering": {
    title: "Backend Engineering",
    template: "backend-engineering.full.template.md",
    description: "Проверяет backend/API/server routes, validation, auth, ошибки, ресурсы и observability.",
    seeds: ["external-api-design-principles", "external-code-review-and-quality"],
    when: () => evidence.server,
    reference: "backend-engineering-playbook.md",
    focus: "API handlers, validation, auth, errors, resources, observability",
    profileId: "backend-api",
  },
  "api-contract-safety": {
    title: "API Contract Safety",
    template: "api-contract-safety.full.template.md",
    description: "Защищает API/data contracts, DTO/schema/runtime validation и совместимость consumers.",
    seeds: ["external-api-design-principles", "external-typescript"],
    when: () => evidence.server || evidence.database || evidence.workers,
    reference: "api-contract-safety-playbook.md",
    focus: "contracts, DTO, schema drift, error shape, backwards compatibility",
    profileId: "backend-api",
  },
  "testing-strategy": {
    title: "Testing Strategy",
    template: "testing-strategy.full.template.md",
    description: "Выбирает проверки по blast radius и превращает gaps в конкретные follow-ups.",
    seeds: ["external-ci-cd-and-automation", evidence.capacitor && "external-capacitor-testing"].filter(Boolean),
    always: true,
    reference: "testing-strategy-playbook.md",
    focus: "unit/integration/e2e/smoke, regression protection, CI gaps",
    profileId: "testing",
  },
  "security-performance-review": {
    title: "Security Performance Review",
    template: "security-performance-review.full.template.md",
    description: "Проверяет trust boundaries, dependency risks, производительность и lifecycle ресурсов.",
    seeds: ["external-code-review-and-quality", evidence.capacitor && "external-capacitor-security", evidence.capacitor && "external-capacitor-performance"].filter(Boolean),
    always: true,
    reference: "security-performance-review-playbook.md",
    focus: "security, dependencies, leaks, bundle/runtime cost, resource cleanup",
    profileId: "security-performance",
  },
  "mobile-capacitor-shell": {
    title: "Mobile Capacitor Shell",
    template: "mobile-capacitor-shell.full.template.md",
    description: "Проверяет Capacitor/mobile shell, build/copy flow, permissions и native gaps.",
    seeds: ["capacitor", "external-capacitor-best-practices", "external-capacitor-testing"],
    when: () => evidence.capacitor,
    reference: "mobile-capacitor-shell-playbook.md",
    focus: "mobile shell, permissions, native bridge, build sync",
    profileId: "mobile-capacitor",
  },
};



function sanitizeRuntimeProse(value) {
  if (Array.isArray(value)) return value.map(sanitizeRuntimeProse);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, val]) => [key, sanitizeRuntimeProse(val)]));
  }
  if (typeof value !== "string") return value;
  return value
    .replace(/root cause/gi, "первопричина")
    .replace(/\bScope\b/g, "Область")
    .replace(/\bFix\b/g, "Исправление")
    .replace(/\bCheck\b/g, "Проверка")
    .replace(/\bFindings\b/g, "Наблюдения")
    .replace(/\bEvidence\b/g, "Подтверждение")
    .replace(/\bValidation\b/g, "Проверка")
    .replace(/\bBlockers\b/g, "Блокеры")
    .replace(/\bUse\b/g, "Используй")
    .replace(/\bRun\b/g, "Запусти")
    .replace(/\bStop\b/g, "Остановись")
    .replace(/\bReview\b/g, "Ревью")
    .replace(/Loading\/empty\/error/gi, "loading/empty/error")
    .replace(/UI quality findings/g, "UI-наблюдения по качеству")
    .replace(/state matrix/g, "матрица состояний")
    .replace(/mobile risk list/g, "список mobile-рисков")
    .replace(/boundary map/g, "карта boundary")
    .replace(/test target/g, "цель проверки")
    .replace(/contract boundary/g, "граница контракта")
    .replace(/safe boundary decision/g, "решение по безопасной границе")
    .replace(/mitigation decision/g, "решение по mitigation")
    .replace(/documented gap/g, "зафиксированный gap")
    .replace(/strongest evidence trail/g, "самая сильная цепочка подтверждений")
    .replace(/critical flows/gi, "критические потоки")
    .replace(/no automated tests or blocking build\/lint\/test CI/gi, "нет автотестов или блокирующего build/lint/test CI")
    .replace(/no automated tests/gi, "автотесты не найдены")
    .replace(/add minimal smoke\/regression tests and CI gates/gi, "добавить минимальные smoke/regression проверки и CI gates")
    .replace(/DTO-only contracts and unsafe error shape assumptions/gi, "contracts только на DTO и небезопасные предположения о форме ошибок")
    .replace(/add response\/error normalizers for high-risk flows/gi, "добавить normalizers response/error для high-risk flows")
    .replace(/token and full user object stored in cookies for 10 days/gi, "токен и полный user object хранятся в cookies 10 дней")
    .replace(/reduce cookie payload\/review flags; document backend authority/gi, "сократить cookie payload, проверить flags и зафиксировать backend authority")
    .replace(/frontend role\/time gates are not authorization/gi, "frontend role/time gates не являются authorization")
    .replace(/require backend permission evidence/gi, "требовать подтверждение backend permissions")
    .replace(/many `v-html` and upload trust boundaries lack visible policy/gi, "много `v-html` и upload trust boundaries без видимой policy")
    .replace(/many v-html and upload trust boundaries lack visible policy/gi, "много v-html и upload trust boundaries без видимой policy")
    .replace(/sanitizer\/trust policy and backend validation evidence/gi, "sanitizer/trust policy и подтверждение backend validation")
    .replace(/listeners can leak/gi, "listeners могут утекать")
    .replace(/stable handlers and cleanup/gi, "стабильные handlers и cleanup")
    .replace(/Dropzone\/timers lack cleanup/gi, "Dropzone/timers без cleanup")
    .replace(/destroy instance and clear timers/gi, "destroy instance и clear timers")
    .replace(/huge mixed-responsibility files/gi, "огромные файлы со смешанной ответственностью")
    .replace(/split by safe slices after smoke baseline/gi, "разделять safe slices после smoke baseline")
    .replace(/broad `any`\/casts/gi, "широкие `any`/casts")
    .replace(/broad any\/casts/gi, "широкие any/casts")
    .replace(/tighten touched types and add guards/gi, "уточнить touched types и добавить guards");
}

function workflowStepsFor(skillName, spec, profileId) {
  const commonVerify = {
    step: "Проверить результат",
    action: "выбрать проверку по blast radius: команда, smoke или documented gap с причиной",
    evidence: "package scripts, smoke-checklist, risk-register",
    output: "результат проверки, остаточный риск и следующий шаг",
  };

  if (skillName === "code-review-and-quality") return [
    { step: "Зафиксировать scope ревью", action: "прочитать requirement/diff и определить touched area, consumers и risk ids", evidence: "задача, diff, knowledge-index, project-map", output: "review scope и affected flows" },
    { step: "Пройти линзы ревью", action: "проверить correctness, readability, architecture, security, performance, tests", evidence: "profile roles, risk-register, соседние файлы", output: "findings с severity и source evidence" },
    { step: "Отделить blocker от suggestion", action: "classify findings по impact, exploitability, regression risk и blast radius", evidence: "risk-register, refactor-plan, smoke-checklist", output: "вердикт: approve/request changes/blocker" },
    commonVerify,
  ];

  if (skillName === "frontend-ui-engineering") return [
    { step: "Найти UI surface", action: "открыть страницу, layout, components, store/composable и соседние UI patterns", evidence: "project-map, source neighbors, design/style files", output: "surface map и owner components" },
    { step: "Закрыть матрицу состояний", action: "проверить loading, empty, error, disabled, success, permission, long text и i18n", evidence: "critical flows, smoke-checklist, nearby components", output: "state matrix и gaps" },
    { step: "Проверить доступность и runtime", action: "проверить keyboard, focus, labels, responsive, SSR/client guards, cleanup и v-html trust", evidence: "risk-register, component source, browser/manual smoke", output: "UI quality findings или локальный fix" },
    commonVerify,
  ];

  if (skillName === "frontend-state-and-data") return [
    { step: "Проследить data flow", action: "пройти page/component -> store/composable -> repository/server -> DTO/API", evidence: "project-map, architecture-map, touched source", output: "trace chain и contract boundary" },
    { step: "Проверить state consistency", action: "найти stale data, duplicate requests, race conditions, loading/error mismatch и unsafe casts", evidence: "stores, repositories, risk-register", output: "state/data findings или локальный fix" },
    { step: "Защитить boundary", action: "добавить guard/normalizer или записать contract gap для external API shape", evidence: "DTO, runtime response usage, critical flows", output: "safe boundary decision" },
    commonVerify,
  ];

  if (skillName === "backend-engineering" || skillName === "api-contract-safety") return [
    { step: "Определить boundary", action: "найти route/handler/repository/schema и всех consumers", evidence: "architecture-map, source hooks, API paths", output: "entry boundary и contract owners" },
    { step: "Проверить validation/auth/error", action: "проверить input trust, auth authority, error contract, null/empty cases и backward compatibility", evidence: "risk-register, DTO/schema, consumers", output: "contract/security findings" },
    { step: "Проверить runtime ресурсы", action: "оценить cache keys, timeout, retries, streams, timers, logging и secret/PII leaks", evidence: "server utils, performance/security forms", output: "resource/perf/security decision" },
    commonVerify,
  ];

  if (skillName === "debugging-and-error-recovery") return [
    { step: "Зафиксировать симптом", action: "описать observable failure, affected flow, environment и последние изменения", evidence: "issue/logs/source/RAG", output: "симптом и границы расследования" },
    { step: "Воспроизвести или сузить", action: "построить минимальный repro path; если repro невозможен, собрать strongest evidence trail", evidence: "commands, logs, browser/API smoke, source trace", output: "repro или documented no-repro" },
    { step: "Дойти до root cause", action: "проверить data flow, contracts, lifecycle, cache, permissions и regression history", evidence: "critical flows, risk-register, touched source", output: "root cause с файлом/условием" },
    commonVerify,
  ];

  if (skillName === "refactor-engineering") return [
    { step: "Зафиксировать поведение", action: "описать текущее поведение и минимальные safety checks до изменения", evidence: "source, smoke-checklist, current-state", output: "behavior baseline" },
    { step: "Выбрать safe slice", action: "разрезать refactor по boundary с минимальным blast radius и rollback path", evidence: "refactor-plan, architecture-map, consumers", output: "slice plan" },
    { step: "Упростить без смены поведения", action: "убрать duplication/coupling/unsafe pattern в пределах slice", evidence: "diff, соседние patterns, risk-register", output: "refactor diff без feature creep" },
    commonVerify,
  ];

  if (skillName === "testing-strategy") return [
    { step: "Оценить blast radius", action: "связать изменение с flow, risk ids, consumers и типом регрессии", evidence: "risk-register, critical flows, touched source", output: "test target и уровень проверки" },
    { step: "Выбрать уровень теста", action: "выбрать unit, component, integration, e2e, contract или manual smoke по цене/пользе", evidence: "package scripts, existing tests, smoke-checklist", output: "план проверки" },
    { step: "Закрыть gap", action: "добавить проверку или записать точный test gap с причиной и next step", evidence: "CI config, commands, test files", output: "regression protection или честный gap" },
    commonVerify,
  ];

  if (skillName === "security-performance-review") return [
    { step: "Найти trust/performance boundary", action: "определить user/external input, secrets, auth, cache, dependencies и resource lifecycle", evidence: "security/performance forms, risk-register, source", output: "boundary map" },
    { step: "Проверить exploit/regression path", action: "оценить XSS/injection/auth leak/SSRF/secret leak, memory leak, request fan-out и bundle/runtime cost", evidence: "source search, dependency review, critical flows", output: "findings с severity" },
    { step: "Выбрать mitigation", action: "исправить локально, добавить guard/policy или записать blocker/refactor item", evidence: "risk-register, refactor-plan, smoke-checklist", output: "mitigation decision" },
    commonVerify,
  ];

  if (skillName === "mobile-capacitor-shell") return [
    { step: "Проверить web/native contract", action: "сверить Nuxt generate output, capacitor config, ios/android project и routing assumptions", evidence: "capacitor.config, package scripts, native folders", output: "mobile build contract" },
    { step: "Проверить native risks", action: "проверить permissions, bridge errors, app state, deep links, safe area, keyboard и offline behavior", evidence: "mobile profile, native config, critical flows", output: "mobile risk list" },
    { step: "Проверить sync/deploy path", action: "выбрать generate/cap sync/device smoke или записать невозможность проверки", evidence: "commands, smoke-checklist, platform files", output: "mobile verification path" },
    commonVerify,
  ];

  return [
    { step: "Собрать контекст", action: "открыть RAG-маршрут по типу задачи и найти затронутые исходники через проектные привязки", evidence: "knowledge-index, project-map, соседние файлы затронутой области", output: "краткая область работ, затронутый поток, риски и план проверки" },
    { step: "Проверить инженерные риски", action: `проверить ${spec.focus} через локальные риски, критические потоки и проверки по слоям`, evidence: "risk-register, исходный код, smoke-checklist", output: "список конкретных проблем или подтверждение отсутствия риска" },
    { step: "Сделать минимальное изменение", action: "исправить локально только тот slice, который подтверждён evidence проекта", evidence: "diff, соседние patterns, команды проверки", output: "изменение без лишнего refactor и с понятной регрессионной защитой" },
    commonVerify,
  ];
}

function layerChecksFor(skillName) {
  const common = [
    { layer: "Verification", check: "проверить результат командой, smoke или documented gap", evidence: "package scripts, smoke-checklist", verification: "зафиксировать output или причину невозможности" },
  ];
  const bySkill = {
    "code-review-and-quality": [
      { layer: "Correctness", check: "проверить requirement, edge cases, error states и data consistency", evidence: "задача, diff, critical flows", verification: "finding или подтверждение" },
      { layer: "Architecture", check: "проверить boundaries, coupling, ownership и shared side effects", evidence: "architecture-map, project hooks", verification: "нет скрытого расширения blast radius" },
      { layer: "Security/Performance/Tests", check: "проверить trust boundary, resource cost и regression protection", evidence: "risk-register, smoke-checklist", verification: "severity и обязательное действие" },
    ],
    "frontend-ui-engineering": [
      { layer: "UI states", check: "loading, empty, error, disabled, success, permission и long text", evidence: "components/pages/smoke", verification: "state matrix закрыта или gap записан" },
      { layer: "Accessibility", check: "keyboard path, focus, labels, semantics и custom controls", evidence: "component source/browser smoke", verification: "нет недоступного touched control" },
      { layer: "Responsive/SSR", check: "mobile/tablet/desktop, overflow, browser API guard, hydration risks", evidence: "styles, Nuxt runtime, risk-register", verification: "responsive/runtime smoke" },
    ],
    "frontend-state-and-data": [
      { layer: "State ownership", check: "разделить server data, draft, UI state и derived state", evidence: "stores/composables/components", verification: "нет stale/duplicate ownership" },
      { layer: "Request lifecycle", check: "loading/error/cancel/stale response/dedup behavior", evidence: "repositories, stores, api plugin", verification: "flow smoke или guard" },
      { layer: "DTO boundary", check: "unsafe casts, nulls, error shape и runtime response drift", evidence: "types/DTO, external API consumers", verification: "normalizer/guard/gap" },
    ],
    "backend-engineering": [
      { layer: "API boundary", check: "input validation, auth authority, error contract, response shape", evidence: "server routes, DTO/schema, consumers", verification: "contract smoke или documented gap" },
      { layer: "Runtime resources", check: "cache, timeout, retries, streams, timers, connection pools", evidence: "server utils/plugins", verification: "resource lifecycle reviewed" },
      { layer: "Observability", check: "logs/metrics useful but без secrets/PII", evidence: "logging/error paths", verification: "safe diagnostic output" },
    ],
    "api-contract-safety": [
      { layer: "Producer/consumer", check: "найти всех producers/consumers и backward compatibility", evidence: "repositories/server/types", verification: "contract impact map" },
      { layer: "Runtime guard", check: "проверить schema/normalizer/fallback для external data", evidence: "DTO, risk-register", verification: "guard или contract gap" },
      { layer: "Error shape", check: "ошибки стабильны, безопасны и не ломают UI/state", evidence: "catch blocks, stores, API handlers", verification: "error smoke" },
    ],
    "debugging-and-error-recovery": [
      { layer: "Symptom", check: "точно описать visible failure и affected users/flows", evidence: "issue/log/browser/API", verification: "repro или no-repro evidence" },
      { layer: "Root cause", check: "не останавливаться на симптоме; пройти data flow/contract/lifecycle/cache", evidence: "source trace, risk-register", verification: "root cause связан с кодом" },
      { layer: "Regression", check: "добавить тест/smoke/guard или записать gap", evidence: "smoke-checklist/package scripts", verification: "дефект не должен вернуться молча" },
    ],
    "refactor-engineering": [
      { layer: "Behavior baseline", check: "зафиксировать поведение до изменения", evidence: "source/smoke/current-state", verification: "baseline известен" },
      { layer: "Slice boundary", check: "не смешивать refactor с feature/fix за пределами slice", evidence: "refactor-plan/architecture-map", verification: "blast radius ограничен" },
      { layer: "Simplification", check: "снизить coupling/duplication/unsafe pattern без новой магии", evidence: "diff/neighbor patterns", verification: "код проще и поведение сохранено" },
    ],
    "testing-strategy": [
      { layer: "Risk coverage", check: "каждый high-risk flow получает проверку или explicit gap", evidence: "risk-register/critical flows", verification: "нет silent regression" },
      { layer: "Test level", check: "выбрать самый дешёвый уровень, который ловит риск", evidence: "existing tests/package scripts", verification: "unit/component/e2e/smoke выбран осознанно" },
      { layer: "CI path", check: "понять, блокирует ли проверка delivery", evidence: "CI config", verification: "blocking/gap зафиксирован" },
    ],
    "security-performance-review": [
      { layer: "Security", check: "XSS/injection/auth/secret/PII/dependency risks", evidence: "security form, source search", verification: "severity и mitigation" },
      { layer: "Performance", check: "request fan-out, cache, memory/timers/listeners, bundle/runtime cost", evidence: "performance form, source", verification: "risk/fix/gap" },
      { layer: "Supply chain", check: "dependency freshness, heavy/rare libs, category mismatch", evidence: "package/lock/usage search", verification: "audit/update policy or gap" },
    ],
    "mobile-capacitor-shell": [
      { layer: "Build/sync", check: "Nuxt output соответствует Capacitor webDir и sync path", evidence: "capacitor config/package scripts", verification: "generate/cap smoke или gap" },
      { layer: "Native config", check: "permissions, app id, scheme, platform files и store-sensitive settings", evidence: "ios/android config", verification: "native review" },
      { layer: "Device runtime", check: "bridge errors, keyboard/safe-area, offline, app state, deep links", evidence: "mobile smoke", verification: "device/simulator/manual gap" },
    ],
  };
  return [...(bySkill[skillName] || []), ...common];
}

function defaultInput(name, spec) {
  const skillProfile = profile(spec.profileId || "generic");
  const hooks = commonHooks.length ? commonHooks : [{
    name: "Project source",
    paths: sourceRoots.length ? sourceRoots : ["уточнить после research"],
    why: "первичная область поиска для этого skill",
    inspect: "заменить на реальные modules/components/services до status=ready",
  }];

  const flows = commonFlows.length ? commonFlows : [{
    name: "Критический flow проекта",
    entry: "заполнить после research",
    chain: ["заполнить реальные steps из source"],
    risk: "связать с risk-register",
    verification: "связать с smoke-checklist",
  }];

  return {
    schemaVersion: 2,
    status: "draft",
    skillName: name,
    title: titleForSkill(name, spec.title),
    description: spec.description,
    overview: `${spec.description} Работает как project-local senior playbook для области: ${spec.focus}. Все решения должны опираться на RAG, исходники, risk-register, refactor-plan и smoke-checklist проекта.`,
    targetTemplate: spec.template,
    selectedSeeds: spec.seeds,
    profileId: skillProfile.profileId,
    profileTitle: skillProfile.title,
    profileRoles: skillProfile.requiredRoles || [],
    seedExtractions: seedExtractionsFor(name, spec),
    seedExtractionFile: "docs/agent-system/seed-extractions/" + name + ".json",
    seedExtractionStatus: exists("docs/agent-system/seed-extractions/" + name + ".json") ? "extracted" : "pending",
    seedRejections: ["непереносимые правила чужого стека", "общие советы без evidence проекта", "проверки без воспроизводимого выхода"],
    detectedEvidence: evidence,
    sourceRoots,
    commands: commandListFor(name),
    ragRoutes: baseRagRoutes,
    useWhen: [
      `задача затрагивает ${spec.focus}`,
      "затронутая область пересекается с проектными привязками, критическими потоками или risk-register",
      "нужно не только внести правку, но и проверить качество решения",
    ],
    doNotUseWhen: [
      "область задачи не относится к этой инженерной зоне",
      "локальные правила проекта маршрутизируют задачу в более точный skill",
      "нет подтверждений из RAG или исходников; сначала выполнить discovery или research",
    ],
    projectHooks: hooks,
    criticalFlows: flows,
    localRisks: sanitizeRuntimeProse(fallbackRisks),
    refactorLinks: sanitizeRuntimeProse(parsedRefactorLinks),
    preferredPatterns: [
      "следовать ближайшим рабочим patterns из затронутой области, если они не противоречат risk-register",
      "изменять минимальный связанный slice и фиксировать радиус влияния",
      "добавлять проверку, которая ловит именно найденный риск или дефект",
    ],
    antiPatterns: [
      "переносить общий seed без адаптации под стек, пути исходников и риски проекта",
      "чинить симптом без проверки потока данных, контракта границы или lifecycle",
      "оставлять небезопасный код в затронутой области без локального исправления или записанного refactor item",
    ],
    qualityBar: [
      "каждый вывод опирается на RAG, исходники проекта или результат команды",
      "risk-register и refactor-plan влияют на порядок работы, а не просто перечислены",
      "результат содержит конкретные файлы, проверки, пробелы и следующее действие",
    ],
    workflowSteps: sanitizeRuntimeProse(workflowStepsFor(name, spec, skillProfile.profileId)),
    layerChecks: sanitizeRuntimeProse(layerChecksFor(name)),
    gates: [
      {
        gate: "Risk gate",
        trigger: "затронутая область совпадает с локальным риском",
        action: "исправить риск в рамках задачи или записать refactor-gap с подтверждением и владельцем",
      },
      {
        gate: "Verification gate",
        trigger: "изменено runtime-поведение, API contract, state или UI flow",
        action: "запустить подходящую проверку либо явно записать blocker и остаточный риск",
      },
    ],
    stopConditions: [
      {
        condition: "нет доступа к обязательным исходникам, RAG или enterprise evidence",
        why: "без подтверждений skill начнёт гадать и ухудшит качество",
        nextAction: "сообщить точный blocker и запросить недостающий доступ или данные",
      },
      {
        condition: "найден системный риск за пределами безопасного slice",
        why: "локальная правка может скрыть проблему или создать регрессию",
        nextAction: "зафиксировать риск, предложить refactor slice и не расширять diff без запроса",
      },
    ],
    resultFormat: [
      { field: "Область", content: "какие файлы, поток и risk ids затронуты" },
      { field: "Что сделано", content: "кратко по поведению, архитектуре и влиянию на качество" },
      { field: "Проверки", content: "команды, smoke, что не удалось проверить и почему" },
      { field: "Риски", content: "оставшиеся пробелы, refactor items и следующее действие" },
    ],
    references: [`codex-skills/references/${spec.reference}`],
    gaps: sanitizeRuntimeProse(parsedGaps),
    notesForAgent: [
      "Это v2 input contract: не заменяй object arrays простыми строками.",
      "До готовности каждый item должен иметь реальные paths/flows/risks/checks из RAG/source.",
      "Пиши runtime prose на русском; английский допустим только в путях, командах, API и именах библиотек.",
      "После create-skill-inputs.js запусти extract-seed-playbooks.js, затем адаптируй inputs под RAG и только потом запускай render-skills.js.",
    ],
    seedSelectionExcerpt: seedSelection.slice(0, 2000),
    smokeChecklistExcerpt: smokeChecklist.slice(0, 2000),
  };
}

fs.mkdirSync(outDir, { recursive: true });

const selected = Object.entries(catalog)
  .filter(([, spec]) => spec.always || (spec.when && spec.when()))
  .map(([name, spec]) => {
    const resolved = { ...spec, seeds: selectedSeedsForSkill(name, spec.seeds) };
    return [name, defaultInput(name, resolved)];
  });

for (const [name, payload] of selected) {
  const filePath = path.join(outDir, `${name}.json`);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`);
  } else {
    const current = readGeneratedJson(`docs/agent-system/skill-inputs/${name}.json`);
    if (current && current.status === "draft") {
      current.profileId = payload.profileId;
      current.profileTitle = payload.profileTitle;
      current.profileRoles = payload.profileRoles;
      current.detectedEvidence = payload.detectedEvidence;
      current.sourceRoots = payload.sourceRoots;
      current.commands = payload.commands;
      current.ragRoutes = payload.ragRoutes;
      current.projectHooks = payload.projectHooks;
      current.criticalFlows = payload.criticalFlows;
      current.localRisks = payload.localRisks;
      current.refactorLinks = payload.refactorLinks;
      fs.writeFileSync(filePath, `${JSON.stringify(current, null, 2)}\n`);
    }
  }
}

const index = {
  schemaVersion: 2,
  generatedAt: new Date().toISOString(),
  targetSkills: selected.map(([name]) => name),
  detectedEvidence: evidence,
  contract: {
    seedExtractionCommand: "node reusable-agent-system-toolkit/scripts/extract-seed-playbooks.js .",
    renderCommand: "node reusable-agent-system-toolkit/scripts/render-skills.js .",
    singleSkillRenderCommand: "node reusable-agent-system-toolkit/scripts/render-skills.js . <skill-name>",
    rule: "каждый skill-input заполняется как structured playbook; status=ready только после seed extraction и project-specific evidence",
  },
  instructions: [
    "Заполняй каждый skill-input отдельно, как сборочную форму senior skill.",
    "Не заменяй object arrays массивами строк: renderer v2 не примет такой input.",
    "Сразу после create-skill-inputs.js запускай extract-seed-playbooks.js: selected seed считается использованным только если есть docs/agent-system/seed-extractions/<skill-name>.json.",
    "Используй bundled/external skill seeds как source playbook: переноси extracted sections/rules/gates/result format в профиль skill, а проектную конкретику бери из RAG/source.",
    "После заполнения запускай render-skills.js, он создаст SKILL.md, reference и assembly sheet.",
  ],
};

fs.writeFileSync(path.join(outDir, "index.json"), `${JSON.stringify(index, null, 2)}\n`);
console.log(`Skill inputs v2 created: ${path.relative(root, outDir)} (${selected.length} target skills)`);
