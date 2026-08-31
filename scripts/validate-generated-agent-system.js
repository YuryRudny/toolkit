#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();

const generatedRoots = [
  path.join(root, "AGENTS.md"),
  path.join(root, "codex-skills"),
  path.join(root, "docs", "agent-system"),
].filter((p) => fs.existsSync(p));

const forbiddenQualityMarkers = [
  /Перед status=ready/i,
  /уточнить по knowledge-index/i,
  /Flow из RAG/i,
  /Source root/i,
  /заполнить после research/i,
  /заполнить реальные/i,
  /TaskList/i,
  /className/i,
];

const englishMarkers = [
  /\bUse RAG first\b/i,
  /\bRead RAG\b/i,
  /\bReview correctness\b/i,
  /\bDemand local fix\b/i,
  /\bStop feature work\b/i,
  /\bCapture exact symptom\b/i,
  /\bReproduce or record\b/i,
  /\bFix root cause\b/i,
  /\bAdd regression protection\b/i,
  /\bLoading\/empty\/error\b/i,
  /\bBrowser APIs only\b/i,
  /\bCleanup for listeners\b/i,
  /\bResponsive smoke\b/i,
  /\bAccessibility:\b/i,
  /\bComponents:\b/i,
  /\bPages\/layouts:\b/i,
  /\bStyles:\b/i,
  /\bHigh-risk UI:\b/i,
  /^##\s+(Required Reads|First Reads|Workflow|Stop Conditions|Default Scope|Rules|Checks|Result|Purpose|Inputs|Outputs|Gates|Evidence|Failure Modes|Stop)\s*$/im,
  /^\|\s*(Flow|Setup|Action|Expected result|Evidence to capture|Related risks|Source areas|Adaptation)\s*\|/im,
  /-\s*(Root cause|Fix|Scope|Evidence|Validation|Checks|Blockers):/i,
];

const requiredOperationalSkills = [
  "workflow-router",
  "project-authority",
  "research-audit",
  "pre-change-checklist",
  "review-checklist",
  "stack-quality",
  "git-remote-flow",
];

const roleSkills = new Set([
  "code-review-and-quality",
  "debugging-and-error-recovery",
  "refactor-engineering",
  "frontend-ui-engineering",
  "frontend-state-and-data",
  "backend-engineering",
  "api-contract-safety",
  "testing-strategy",
  "security-performance-review",
  "mobile-capacitor-shell",
]);

const requiredAssemblyPatterns = [
  /## Target Output/,
  /## Base Skill From Library/,
  /## Base Skill Extraction/,
  /## Senior Profile Roles/,
  /## Карта Проектной Опоры/,
  /## Render Source Matrix/,
  /## Section Render: Обзор/,
  /## Section Render: Обязательные Чтения/,
  /## Section Render: Использованные Seeds/,
  /(## Section Render: Проектные Привязки|## Section Render: Карта Контекста Проекта)/,
  /## Section Render: Порядок работы/,
  /## Section Render: Формат результата/,
  /((?:Final text for SKILL\.md|Итоговый текст для SKILL\.md)|Итоговый текст для SKILL\.md)/,
];

const requiredRolePatterns = [
  /## Обзор/,
  /## Когда использовать/,
  /## Не использовать когда/,
  /## Обязательные Чтения/,
  /## Быстрый Маршрут По RAG/,
  /## Использованные Seeds/,
  /## Профиль Senior Playbook/,
  /(## Карта Контекста Проекта|## Проектные Привязки)/,
  /## Локальные Антипаттерны И Риски/,
  /## Порядок работы/,
  /(## Проверки По Слою|## Контрольные gates|## Проверки)/,
  /## Условия остановки/,
  /## Формат результата/,
];

const specializedHeaders = {
  "code-review": "## Severity И Verdict Protocol",
  debugging: "## Протокол Диагностики",
  refactor: "## Safe Slice Protocol",
  "frontend-ui": "## Матрица Production UI",
  "frontend-state": "## Матрица Data Consistency",
  "backend-api": "## Матрица Request И Runtime Safety",
  testing: "## Матрица Выбора Проверки",
  "security-performance": "## Threat И Resource Matrix",
  "mobile-capacitor": "## Матрица Web И Native Boundary",
};

function listMarkdownFiles(target) {
  if (!fs.existsSync(target)) return [];
  const stat = fs.statSync(target);
  if (stat.isFile()) return target.endsWith(".md") ? [target] : [];
  const out = [];
  for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    out.push(...listMarkdownFiles(path.join(target, entry.name)));
  }
  return out;
}

function relative(file) {
  return path.relative(root, file) || file;
}

const failures = [];
const files = generatedRoots.flatMap(listMarkdownFiles);

function pathIsInside(base, candidate) {
  const rel = path.relative(path.resolve(base), path.resolve(candidate));
  return rel && rel !== ".." && !rel.startsWith(`..${path.sep}`) && !path.isAbsolute(rel);
}

const projectEntryPath = path.join(root, "AGENTS.md");
if (!fs.existsSync(projectEntryPath)) {
  failures.push("AGENTS.md: missing active project entrypoint");
} else {
  const projectEntry = fs.readFileSync(projectEntryPath, "utf8");
  const requiredEntryInstructions = [
    "codex-skills/skills/workflow-router/SKILL.md",
    "до чтения исходников",
    "даже если его skills не перечислены в системном списке `Available skills`",
    "Jira, Confluence, email, web",
  ];
  for (const instruction of requiredEntryInstructions) {
    if (!projectEntry.includes(instruction)) failures.push(`AGENTS.md: missing entry instruction: ${instruction}`);
  }
}

for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  const rel = relative(file);
  if (/\/Users\/[A-Za-z0-9._-]+\//.test(text)) failures.push(`${rel}: machine-specific absolute user path is persisted`);
  if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(text)) failures.push(`${rel}: private key material found`);
  const isRenderedSkillArtifact = rel.startsWith("codex-skills/") || rel.startsWith("docs/agent-system/skill-assembly/");
  if (isRenderedSkillArtifact) {
    for (const pattern of forbiddenQualityMarkers) {
      const match = text.match(pattern);
      if (match) failures.push(`${rel}: forbidden generated-skill marker "${match[0].trim()}"`);
    }
  }
  for (const pattern of englishMarkers) {
    const match = text.match(pattern);
    if (match) {
      failures.push(`${relative(file)}: English/runtime marker "${match[0].trim()}"`);
    }
  }
}

const skillsRoot = path.join(root, "codex-skills", "skills");
const assemblyRoot = path.join(root, "docs", "agent-system", "skill-assembly");
const inputsRoot = path.join(root, "docs", "agent-system", "skill-inputs");
const qualityReportPath = path.join(root, "docs", "agent-system", "bootstrap-quality-report.md");
const validationResultPath = path.join(root, "docs", "agent-system", "validation-result.json");
const projectModelPath = path.join(root, "docs", "agent-system", "project-model.json");
const skillRegistryPath = path.join(root, "docs", "agent-system", "skill-registry.json");
const researchTasksPath = path.join(root, "docs", "agent-system", "research-workspace", "research-tasks.json");
const researchTasksMarkdownPath = path.join(root, "docs", "agent-system", "research-workspace", "research-tasks.md");
const bootstrapState = readJsonSafe(path.join(root, "docs", "agent-system", "bootstrap-state.json"));
const fullInstall = bootstrapState?.installMode !== "degraded";

function readJsonSafe(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

const workspaceManifest = readJsonSafe(path.join(root, "workspace.json"));
if (workspaceManifest?.integrations) {
  requiredOperationalSkills.push("enterprise-context");
  if (!fs.existsSync(path.join(root, "bin", "enterprise-mcp.js"))) failures.push("bin/enterprise-mcp.js: missing configured enterprise runtime");
  if (!fs.existsSync(path.join(root, "codex-skills", "references", "enterprise-context.md"))) failures.push("codex-skills/references/enterprise-context.md: missing enterprise contract");
}

function writeValidationResult(status, failureList) {
  fs.mkdirSync(path.dirname(validationResultPath), { recursive: true });
  fs.writeFileSync(validationResultPath, `${JSON.stringify({
    schemaVersion: 1,
    status,
    checkedAt: new Date().toISOString(),
    failures: failureList,
  }, null, 2)}\n`);
}
if (fs.existsSync(skillsRoot)) {
  for (const skill of requiredOperationalSkills) {
    const operationalPath = path.join(skillsRoot, skill, "SKILL.md");
    if (!fs.existsSync(operationalPath)) failures.push(`codex-skills/skills/${skill}/SKILL.md: missing operational skill`);
  }
  for (const folder of fs.readdirSync(skillsRoot)) {
    if (!roleSkills.has(folder)) continue;
    const skillPath = path.join(skillsRoot, folder, "SKILL.md");
    if (!fs.existsSync(skillPath)) {
      failures.push(`codex-skills/skills/${folder}/SKILL.md: missing`);
      continue;
    }
    const text = fs.readFileSync(skillPath, "utf8");
    if (/вход\s+``/.test(text) || /цепочка:\s*`[^`]*`\s*->/.test(text)) {
      failures.push(`${relative(skillPath)}: malformed critical flow rendering`);
    }
    if (/сверить с docs\/agent-system\/risk-register\.md/i.test(text)) {
      failures.push(`${relative(skillPath)}: generic risk fallback leaked into generated skill`);
    }

    for (const pattern of requiredRolePatterns) {
      if (!pattern.test(text)) {
        failures.push(`${relative(skillPath)}: missing role ${pattern}`);
      }
    }

    const inputPath = path.join(inputsRoot, `${folder}.json`);
    if (!fs.existsSync(inputPath)) {
      failures.push(`docs/agent-system/skill-inputs/${folder}.json: missing structured skill input`);
    } else {
      try {
        const input = JSON.parse(fs.readFileSync(inputPath, "utf8"));
        if (input.status !== "ready") failures.push(`${relative(inputPath)}: status is not ready`);
        if (input.schemaVersion !== 2) failures.push(`${relative(inputPath)}: schemaVersion is not 2`);
        if (!input.profileId || !input.profileTitle) failures.push(`${relative(inputPath)}: profileId/profileTitle missing`);
        const specializedHeader = specializedHeaders[input.profileId];
        if (specializedHeader && !text.includes(specializedHeader)) failures.push(`${relative(skillPath)}: missing specialized profile protocol ${specializedHeader}`);
        if (input.seedExtractionStatus !== "extracted") failures.push(`${relative(inputPath)}: seedExtractionStatus is not extracted`);
        const expectedExtraction = `docs/agent-system/seed-extractions/${folder}.json`;
        if (input.seedExtractionFile !== expectedExtraction || !fs.existsSync(path.join(root, expectedExtraction))) {
          failures.push(`${relative(inputPath)}: seedExtractionFile must be the safe path ${expectedExtraction}`);
        }
        for (const reference of input.references || []) {
          if (!/^codex-skills\/references\/[a-z0-9]+(?:-[a-z0-9]+)*\.md$/.test(reference)) {
            failures.push(`${relative(inputPath)}: unsafe reference path ${reference}`);
          }
        }
        const typedArrays = {
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
        for (const [key, fields] of Object.entries(typedArrays)) {
          if (!Array.isArray(input[key]) || input[key].filter(Boolean).length === 0) {
            failures.push(`${relative(inputPath)}: ${key} is empty`);
            continue;
          }
          input[key].forEach((item, index) => {
            const ok = item && typeof item === "object" && !Array.isArray(item)
              && fields.every((field) => {
                const value = item[field];
                return Array.isArray(value) ? value.length > 0 : String(value || "").trim().length > 0;
              });
            if (!ok) failures.push(`${relative(inputPath)}: ${key}[${index}] is not a complete v2 object`);
          });
        }
        for (const risk of input.localRisks || []) {
          if (!/^R-[A-Z0-9-]+$/.test(String(risk.id || ""))) {
            failures.push(`${relative(inputPath)}: localRisks must contain only R-* ids, got ${risk.id}`);
          }
        }
        for (const gap of input.gaps || []) {
          if (!/^G-[A-Z0-9-]+$/.test(String(gap.id || ""))) {
            failures.push(`${relative(inputPath)}: gaps must contain only G-* ids, got ${gap.id}`);
          }
        }
        for (const item of input.refactorLinks || []) {
          if (!/^RF-[A-Z0-9-]+$/.test(String(item.id || ""))) {
            failures.push(`${relative(inputPath)}: refactorLinks must contain only RF-* ids, got ${item.id}`);
          }
        }
        for (const flow of input.criticalFlows || []) {
          const serializedFlow = JSON.stringify(flow);
          if (/сверить с docs\/agent-system\/risk-register\.md/i.test(serializedFlow)) {
            failures.push(`${relative(inputPath)}: criticalFlows contains generic risk fallback instead of concrete risk ids`);
          }
        }
        for (const seed of input.seedExtractions || []) {
          if (seed.contentTrust !== "untrusted-advisory") {
            failures.push(`${relative(inputPath)}: seed ${seed.seedId || "unknown"} lacks untrusted-advisory provenance`);
          }
          const extracted = [
            ...(seed.rulesTaken || []),
            ...(seed.qualityGates || []),
            ...(seed.resultFormat || []),
            ...(seed.resourcesUsed || []),
          ].join("\n");
          if (/https?:\/\/|\bnpx\s+|\b(?:token|password|secret|credential|authorization)\b|\b(?:curl|wget)\s+/i.test(extracted)) {
            failures.push(`${relative(inputPath)}: unsafe executable/credential material leaked from seed ${seed.seedId || "unknown"}`);
          }
        }
      } catch {
        failures.push(`${relative(inputPath)}: invalid json`);
      }
    }

    const assemblyPath = path.join(assemblyRoot, `${folder}.md`);
    if (!fs.existsSync(assemblyPath)) {
      failures.push(`docs/agent-system/skill-assembly/${folder}.md: missing per-skill assembly sheet`);
      continue;
    }

    const assemblyText = fs.readFileSync(assemblyPath, "utf8");
    for (const pattern of requiredAssemblyPatterns) {
      if (!pattern.test(assemblyText)) {
        failures.push(`${relative(assemblyPath)}: missing assembly role ${pattern}`);
      }
    }

    const sectionRenderCount = (assemblyText.match(/## Section Render:/g) || []).length;
    if (sectionRenderCount < 10) {
      failures.push(`${relative(assemblyPath)}: expected per-section render source, found ${sectionRenderCount} Section Render blocks`);
    }
    if (/(?:Final text for SKILL\.md|Итоговый текст для SKILL\.md):\s*\n\s*```markdown\s*\nНе заполнено\s*\n```/m.test(assemblyText)) {
      failures.push(`${relative(assemblyPath)}: contains empty Section Render final text`);
    }
    if (!/## Base Skill Extraction[\s\S]*sourcePath|Source path|Источник/.test(assemblyText)) {
      failures.push(`${relative(assemblyPath)}: missing concrete seed source extraction`);
    }

    if (/^# Skill Assembly:/m.test(assemblyText) || /^-\s*Targets:/m.test(assemblyText)) {
      failures.push(`${relative(assemblyPath)}: looks like compact/grouped assembly summary, not render source sheet`);
    }
  }
}

const projectModel = readJsonSafe(projectModelPath);
if (!projectModel) {
  failures.push("docs/agent-system/project-model.json: missing canonical project model");
} else {
  if (!Array.isArray(projectModel.modules) || projectModel.modules.length === 0) failures.push("project-model.json: modules are empty");
  if (!projectModel.capabilities || Object.keys(projectModel.capabilities).length === 0) failures.push("project-model.json: capabilities are empty");
}

const researchTasks = readJsonSafe(researchTasksPath);
if (fullInstall && !researchTasks) {
  failures.push("research-tasks.json: missing research task graph");
} else if (researchTasks) {
  if (projectModel && researchTasks.projectFingerprint !== projectModel.fingerprint) {
    failures.push("research task graph is stale: project fingerprint differs from project-model.json");
  }
  const unfinished = (researchTasks.tasks || []).filter((task) => !["complete", "not-applicable"].includes(task.status));
  if (fullInstall && unfinished.length) failures.push(`research task graph has ${unfinished.length} unfinished tasks`);
  if (!fs.existsSync(researchTasksMarkdownPath)) {
    failures.push("research-tasks.md: missing synchronized task view");
  } else {
    const markdown = fs.readFileSync(researchTasksMarkdownPath, "utf8");
    for (const task of researchTasks.tasks || []) {
      const row = new RegExp(`^\\|\\s*${task.id.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\s*\\|[^\\n]*\\|\\s*${task.status}\\s*\\|`, "m");
      if (!row.test(markdown)) failures.push(`research-tasks.md is stale for ${task.id}`);
    }
  }
}

const registry = readJsonSafe(skillRegistryPath);
if (!registry) {
  failures.push("docs/agent-system/skill-registry.json: missing skill registry");
} else {
  const registryNames = new Set((registry.skills || []).filter((skill) => skill.status === "active").map((skill) => skill.name));
  for (const skill of registry.skills || []) {
    if (skill.status === "active" && !fs.existsSync(path.join(root, skill.path))) {
      failures.push(`skill registry points to missing active skill: ${skill.path}`);
    }
    for (const reference of skill.references || []) {
      const referencePath = path.resolve(root, reference);
      if (!/^codex-skills\/references\/[a-z0-9]+(?:-[a-z0-9]+)*\.md$/.test(reference) || !pathIsInside(path.join(root, "codex-skills", "references"), referencePath)) {
        failures.push(`${skill.name}: unsafe registered reference ${reference}`);
      } else if (!fs.existsSync(referencePath)) {
        failures.push(`${skill.name}: missing registered reference ${reference}`);
      }
    }
  }
  const routerPath = path.join(skillsRoot, "workflow-router", "SKILL.md");
  if (fs.existsSync(routerPath)) {
    const routerText = fs.readFileSync(routerPath, "utf8");
    for (const line of routerText.split(/\r?\n/).filter((item) => item.startsWith("Обязательные skills:"))) {
      for (const match of line.matchAll(/`([a-z0-9-]+)`/g)) {
        if (!registryNames.has(match[1])) failures.push(`workflow-router references non-active skill: ${match[1]}`);
      }
    }
  }
}

for (const helper of ["jira-rest.sh", "confluence-rest.sh"]) {
  const helperPath = path.join(root, ".tmp", helper);
  if (!fs.existsSync(helperPath)) continue;
  const helperText = fs.readFileSync(helperPath, "utf8");
  if (!/resolve_enterprise_url/.test(helperText) || /URL="\$TARGET"/.test(helperText)) {
    failures.push(`.tmp/${helper}: helper does not enforce configured same-origin URLs; regenerate enterprise setup`);
  }
}
const integrationHelperPath = path.join(root, ".tmp", "integration-env.sh");
if (fs.existsSync(integrationHelperPath)) {
  const helperText = fs.readFileSync(integrationHelperPath, "utf8");
  if (!/--proto '=https'/.test(helperText) || /-H "Authorization: \$auth_header"/.test(helperText)) {
    failures.push(".tmp/integration-env.sh: helper exposes credentials or does not enforce HTTPS; regenerate enterprise setup");
  }
}

if (fs.existsSync(assemblyRoot)) {
  for (const file of fs.readdirSync(assemblyRoot)) {
    if (!file.endsWith(".md")) continue;
    const assemblyPath = path.join(assemblyRoot, file);
    const assemblyText = fs.readFileSync(assemblyPath, "utf8");
    if (/^-\s*Targets:/m.test(assemblyText)) {
      failures.push(`${relative(assemblyPath)}: grouped multi-skill assembly is not allowed`);
    }
  }
}

if (fs.existsSync(skillsRoot)) {
  const mobileSkill = path.join(skillsRoot, "mobile-capacitor-shell", "SKILL.md");
  const capEvidence = fs.existsSync(path.join(root, "capacitor.config.ts")) || fs.existsSync(path.join(root, "capacitor.config.json"));
  if (fs.existsSync(mobileSkill) && !capEvidence) {
    failures.push("codex-skills/skills/mobile-capacitor-shell/SKILL.md: active mobile skill exists without capacitor.config evidence");
  }
  if (!fs.existsSync(qualityReportPath)) {
    failures.push("docs/agent-system/bootstrap-quality-report.md: missing honest quality report");
  } else {
    const qualityText = fs.readFileSync(qualityReportPath, "utf8");
    if (!qualityText.includes("Generated by: `reusable-agent-system-toolkit/scripts/generate-quality-report.js`")) {
      failures.push("docs/agent-system/bootstrap-quality-report.md: report must be generated by generate-quality-report.js");
    }
    const fullScore = qualityText.match(/Full bootstrap quality:\s*(\d+(?:\.\d+)?)\/10/i);
    if (!fullScore) {
      failures.push("docs/agent-system/bootstrap-quality-report.md: missing numeric Full bootstrap quality: N/10");
    } else {
      const score = Number(fullScore[1]);
      if (!Number.isFinite(score) || score < 0 || score > 10) failures.push("docs/agent-system/bootstrap-quality-report.md: full quality score must be between 0 and 10");
    }
    const scoreRows = [
      "Research depth",
      "Evidence quality",
      "RAG usefulness",
      "Risk/refactor value",
      "Skill assembly discipline",
      "Skill senior quality",
      "Operational references",
      "Language/runtime clarity",
      "Existing rules/enterprise hygiene",
      "Re-run safety",
    ];
    for (const row of scoreRows) {
      const escaped = row.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
      const pattern = new RegExp("\\|\\s*" + escaped + "\\s*\\|\\s*(\\d+(?:\\.\\d+)?)\\/10\\s*\\|", "i");
      const match = qualityText.match(pattern);
      if (!match) {
        failures.push(`docs/agent-system/bootstrap-quality-report.md: ${row} must have numeric N/10 score`);
      } else {
        const score = Number(match[1]);
        if (!Number.isFinite(score) || score < 0 || score > 10) failures.push(`docs/agent-system/bootstrap-quality-report.md: ${row} score must be between 0 and 10`);
      }
    }
  }
}

if (failures.length) {
  writeValidationResult("failed", failures);
  console.error("Generated agent system validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

writeValidationResult("passed", []);
console.log(`Generated agent system validation passed: ${files.length} markdown files checked.`);
