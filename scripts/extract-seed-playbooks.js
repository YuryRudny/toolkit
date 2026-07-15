#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { assertSafeName, resolveInside } = require("./lib/path-safety");
const { verifySeedIntegrity } = require("./seed-integrity");

const root = path.resolve(process.argv[2] || process.cwd());
const requestedSkill = process.argv[3] || null;
const toolkitRoot = path.resolve(__dirname, "..");
const packageJsonPath = path.join(root, "package.json");
const packageJson = fs.existsSync(packageJsonPath) ? JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) : {};
const deps = { ...(packageJson.dependencies || {}), ...(packageJson.devDependencies || {}) };
const stackEvidence = { react: Boolean(deps.react), vue: Boolean(deps.vue || deps.nuxt), nuxt: Boolean(deps.nuxt) };
const inputsDir = path.join(root, "docs", "agent-system", "skill-inputs");
const outDir = path.join(root, "docs", "agent-system", "seed-extractions");

function loadSeedRegistry() {
  const registry = new Map();
  const main = readJson(path.join(toolkitRoot, "skill-seeds", "manifest.json"));
  for (const seed of main.seeds || []) registry.set(seed.id, seed.path);
  for (const library of main.externalLibraries || []) {
    const manifestPath = resolveInside(toolkitRoot, library.manifest, "external seed manifest", { mustExist: true });
    const manifest = readJson(manifestPath);
    for (const seed of manifest.seeds || []) {
      if (registry.has(seed.id)) throw new Error(`Duplicate seed id in manifests: ${seed.id}`);
      registry.set(seed.id, seed.path);
    }
  }
  return registry;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function uniq(values) {
  return [...new Set(values.filter(Boolean).map((value) => String(value).trim()).filter(Boolean))];
}

function limit(values, count) {
  return uniq(values).slice(0, count);
}

function stripBullet(line) {
  return line
    .replace(/^\s*[-*]\s+/, "")
    .replace(/^\s*\d+\.\s+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function splitSections(markdown) {
  const sections = [];
  let current = { heading: "Верхний уровень", level: 0, lines: [] };

  for (const line of markdown.split(/\r?\n/)) {
    const match = line.match(/^(#{1,4})\s+(.+?)\s*$/);
    if (match) {
      sections.push(current);
      current = {
        heading: match[2].replace(/[#*_`]/g, "").trim(),
        level: match[1].length,
        lines: [],
      };
      continue;
    }
    current.lines.push(line);
  }

  sections.push(current);
  return sections
    .map((section) => {
      const bullets = section.lines
        .filter((line) => /^\s*(?:[-*]|\d+\.)\s+\S/.test(line))
        .map(stripBullet)
        .filter((line) => line.length > 8);
      const paragraphs = section.lines
        .map((line) => line.trim())
        .filter((line) => line.length > 24)
        .filter((line) => !/^\|/.test(line))
        .filter((line) => !/^\s*(?:[-*]|\d+\.)\s+\S/.test(line))
        .slice(0, 4);
      return { heading: section.heading, level: section.level, bullets, paragraphs };
    })
    .filter((section) => section.heading || section.bullets.length || section.paragraphs.length);
}

function removeFencedCode(markdown) {
  const lines = [];
  let fenced = false;
  for (const line of markdown.split(/\r?\n/)) {
    if (/^\s*(?:\x60{3}|~~~)/.test(line)) {
      fenced = !fenced;
      continue;
    }
    if (!fenced) lines.push(line);
  }
  return lines.join("\n");
}

function relevantSections(sections) {
  const strong = /(review|quality|debug|error|root cause|refactor|architecture|security|performance|test|accessibility|workflow|process|steps|rules|gates|format|result|output|severity|risk|pattern|best|провер|качест|отлад|ошиб|причин|рефактор|архитект|безопас|производ|тест|доступ|поряд|процесс|правил|формат|результ|риск|паттерн)/i;
  const picked = sections.filter((section) => strong.test(section.heading) || section.bullets.some((line) => strong.test(line)));
  return picked.length ? picked : sections.filter((section) => section.bullets.length || section.paragraphs.length);
}

function seedLineAllowed(line) {
  const unsafeExternalMaterial = [
    /https?:\/\//i,
    /\b(?:curl|wget|npx|npm|yarn|pnpm|pip|brew|apt|docker|kubectl|git)\s+/i,
    /\b(?:rm|sudo|chmod|chown|eval|exec)\s+-/i,
    /\b(?:token|password|secret|credential|private[ -]?key|authorization|cookie)\b/i,
    /\b(?:localStorage|sessionStorage)\b/i,
    /\b(?:ignore|override|disregard)\b.{0,40}\b(?:instruction|prompt|rule|policy)\b/i,
    /\{\{\s*secrets?[._]/i,
  ];
  if (unsafeExternalMaterial.some((pattern) => pattern.test(line))) return false;
  if (stackEvidence.react) return true;
  if (/className|TaskList|React\.|useState\(|useEffect\(|tsx|jsx/i.test(line)) return false;
  if (/<[A-Z][A-Za-z0-9]*(\s|>|\.)/.test(line)) return false;
  return true;
}

function cleanLines(lines) {
  return lines.filter(seedLineAllowed);
}

function cleanSections(sections) {
  return sections.map((section) => ({
    ...section,
    bullets: cleanLines(section.bullets),
    paragraphs: cleanLines(section.paragraphs),
  })).filter((section) => section.bullets.length || section.paragraphs.length || section.heading);
}

function extractSeed(seedId, sourcePath, seedRegistry) {
  const declaredPath = seedRegistry.get(seedId);
  if (!declaredPath || declaredPath !== sourcePath) {
    throw new Error(`Seed must match toolkit manifest: ${seedId} -> ${sourcePath || "(empty)"}`);
  }
  let absolute;
  try {
    absolute = resolveInside(toolkitRoot, sourcePath, "seed source", { mustExist: true });
  } catch {
    return {
      sourcePath,
      sourceExists: false,
      sectionsUsed: [],
      rulesTaken: [],
      qualityGates: [],
      resultFormat: [],
      resourcesUsed: [],
      extractedSections: [],
    };
  }

  const markdown = removeFencedCode(fs.readFileSync(absolute, "utf8"));
  const sections = cleanSections(relevantSections(splitSections(markdown)));
  const allLines = sections.flatMap((section) => [
    ...section.bullets,
    ...section.paragraphs,
  ]);
  const gatePattern = /(gate|quality|check|review|severity|test|security|performance|accessibility|risk|block|stop|validate|verify|провер|качест|критер|безопас|производ|доступ|риск|блок|стоп|валид|вериф)/i;
  const resultPattern = /(format|result|output|response|report|deliver|формат|результ|ответ|отч[её]т|вывод)/i;
  const resourcePattern = /(reference|resource|docs|read|open|file|path|template|script|референс|ресурс|док|прочит|откр|файл|путь|шаблон|скрипт)/i;

  return {
    sourcePath,
    sourceExists: true,
    sectionsUsed: limit(sections.map((section) => section.heading), 14),
    rulesTaken: limit(allLines.filter((line) => line.length > 18), 24),
    qualityGates: limit(allLines.filter((line) => gatePattern.test(line)), 14),
    resultFormat: limit(
      sections
        .filter((section) => resultPattern.test(section.heading))
        .flatMap((section) => section.bullets.length ? section.bullets : section.paragraphs),
      10,
    ),
    resourcesUsed: limit(allLines.filter((line) => resourcePattern.test(line)), 12),
    extractedSections: sections.slice(0, 12).map((section) => ({
      heading: section.heading,
      bullets: section.bullets.slice(0, 10),
      paragraphs: section.paragraphs.slice(0, 3),
    })),
  };
}

function fallbackRejections() {
  return [
    "правила чужого стека без подтверждения зависимостями, путями или RAG проекта",
    "готовые команды из внешней библиотеки, если они не совпадают с package scripts проекта",
    "общие формулировки без связи с risk-register, project-map или smoke-checklist",
  ];
}

function fallbackAdaptation(skillName, seedId) {
  return [
    `перевести playbook ${seedId} в runtime-инструкции на русском для ${skillName}`,
    "заменить library examples на реальные projectHooks, criticalFlows, localRisks и commands",
    "связать quality gates seed с risk-register, refactor-plan и smoke-checklist проекта",
  ];
}

if (!fs.existsSync(inputsDir)) {
  console.error(`Missing skill inputs dir: ${path.relative(root, inputsDir)}`);
  process.exit(1);
}

ensureDir(outDir);
verifySeedIntegrity();
const seedRegistry = loadSeedRegistry();

const files = fs.readdirSync(inputsDir)
  .filter((file) => file.endsWith(".json") && file !== "index.json")
  .filter((file) => !requestedSkill || file === `${requestedSkill}.json`);

if (requestedSkill && files.length === 0) {
  console.error(`Missing requested skill input: docs/agent-system/skill-inputs/${requestedSkill}.json`);
  process.exit(1);
}

const failures = [];
for (const file of files) {
  const inputPath = path.join(inputsDir, file);
  const input = readJson(inputPath);
  const skillName = input.skillName || file.replace(/\.json$/, "");
  assertSafeName(skillName, "skillName");
  const seeds = Array.isArray(input.seedExtractions) && input.seedExtractions.length
    ? input.seedExtractions
    : (input.selectedSeeds || []).map((seedId) => ({ seedId, sourcePath: "" }));

  const extracted = seeds.map((seed) => {
    let base;
    try {
      base = extractSeed(seed.seedId, seed.sourcePath || "", seedRegistry);
    } catch (error) {
      failures.push(`${path.relative(root, inputPath)}: ${error.message}`);
      base = { sourcePath: seed.sourcePath || "", sourceExists: false, sectionsUsed: [], rulesTaken: [], qualityGates: [], resultFormat: [], resourcesUsed: [], extractedSections: [] };
    }
    if (!base.sourceExists) failures.push(`${path.relative(root, inputPath)}: seed source not found: ${seed.seedId} -> ${seed.sourcePath || "(empty)"}`);
    return {
      seedId: seed.seedId,
      contentTrust: "untrusted-advisory",
      ...base,
      rulesRejected: Array.isArray(seed.rulesRejected) && seed.rulesRejected.length ? seed.rulesRejected : fallbackRejections(),
      projectAdaptation: Array.isArray(seed.projectAdaptation) && seed.projectAdaptation.length ? seed.projectAdaptation : fallbackAdaptation(skillName, seed.seedId),
    };
  });

  const extractionPayload = {
    schemaVersion: 1,
    skillName,
    generatedAt: new Date().toISOString(),
    rule: "Этот файл доказывает, что selected seeds были реально открыты и разобраны перед рендером skill.",
    seedExtractions: extracted,
  };

  writeJson(resolveInside(outDir, `${skillName}.json`, "seed extraction output"), extractionPayload);
  input.seedExtractions = extracted;
  input.seedExtractionFile = `docs/agent-system/seed-extractions/${skillName}.json`;
  input.seedExtractionStatus = failures.some((failure) => failure.includes(`${file}:`)) ? "blocked" : "extracted";
  writeJson(inputPath, input);
}

if (failures.length) {
  console.error("Seed extraction failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Seed playbooks extracted: ${path.relative(root, outDir)} (${files.length} skill inputs)`);
