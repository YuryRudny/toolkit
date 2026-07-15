#!/usr/bin/env node

"use strict";

const fs = require("fs");
const path = require("path");
const { verifySeedIntegrity } = require("./seed-integrity");

const root = path.resolve(__dirname, "..");
const failures = [];

function read(relative) {
  return fs.readFileSync(path.join(root, relative), "utf8");
}

function requirePattern(relative, pattern, message) {
  if (!pattern.test(read(relative))) failures.push(`${relative}: ${message}`);
}

function forbidPattern(relative, pattern, message) {
  if (pattern.test(read(relative))) failures.push(`${relative}: ${message}`);
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(absolute, files);
    else if (entry.isFile()) files.push(absolute);
  }
  return files;
}

try {
  verifySeedIntegrity();
} catch (error) {
  failures.push(error.message);
}

requirePattern("templates/enterprise-scripts/integration-env.template.sh", /resolve_enterprise_url/, "missing same-origin URL resolver");
requirePattern("templates/enterprise-scripts/integration-env.template.sh", /--proto '=https'/, "curl is not restricted to HTTPS");
requirePattern("templates/enterprise-scripts/integration-env.template.sh", /mktemp/, "authorization header is not isolated in a protected temporary file");
forbidPattern("templates/enterprise-scripts/integration-env.template.sh", /-H "Authorization: \$auth_header"/, "secret is exposed in curl argv");
forbidPattern("templates/enterprise-scripts/jira-rest.template.sh", /URL="\$TARGET"/, "arbitrary target URL bypasses origin validation");
forbidPattern("templates/enterprise-scripts/confluence-rest.template.sh", /URL="\$TARGET"/, "arbitrary target URL bypasses origin validation");

requirePattern("scripts/render-skills.js", /resolveInside/, "renderer does not enforce output containment");
requirePattern("scripts/render-skills.js", /assertSafeReference/, "renderer does not validate reference paths");
requirePattern("scripts/extract-seed-playbooks.js", /verifySeedIntegrity/, "seed extraction does not verify integrity");
requirePattern("scripts/extract-seed-playbooks.js", /Seed must match toolkit manifest/, "seed extraction is not manifest-bound");
requirePattern("scripts/extract-seed-playbooks.js", /removeFencedCode/, "external fenced code can enter runtime extraction");

requirePattern("skills/project-agent-bootstrap/SKILL.md", /untrusted-content-security\.md/, "bootstrap does not load the untrusted-content contract");
requirePattern("templates/project-rules/AGENTS.template.md", /Jira, Confluence, email, web/, "generated project rules lack a trust boundary");
forbidPattern("references/enterprise-integrations.md", /generated skills будет записан только env path/, "tracked docs still request an absolute env path");

const externalFiles = walk(path.join(root, "skill-seeds", "external"))
  .filter((file) => /\.(?:md|sh|js|ts|json|ya?ml)$/i.test(file));
for (const file of externalFiles) {
  const source = fs.readFileSync(file, "utf8");
  const relative = path.relative(root, file);
  if (/\bnpx\s+/.test(source)) failures.push(`${relative}: unpinned implicit npx execution`);
  if (/(?:curl|wget)[^\n|]*\|\s*(?:bash|sh)\b/i.test(source)) failures.push(`${relative}: downloaded content piped into a shell`);
  if (/powershell[^\n]*(?:\biex\b|Invoke-Expression)/i.test(source)) failures.push(`${relative}: downloaded content passed to PowerShell expression execution`);
}

forbidPattern("skill-seeds/external/ai-agents-skills-main/skills/dnote/SKILL.md", /dnote login[^\n]*\s-p\s/i, "password is passed in argv");
forbidPattern("skill-seeds/external/agent-skills-main/bash-pro/SKILL.md", /rm -rf -- "\$user_input"/, "raw user input is recommended for recursive deletion");
forbidPattern("skill-seeds/external/agent-skills-main/debugging-capacitor/SKILL.md", /NSAllowsArbitraryLoads<\/key>[\s\S]{0,80}<true\/>/, "global ATS bypass is recommended");
forbidPattern("skill-seeds/external/agent-skills-main/feature-sliced-design/references/practical-examples.md", /localStorage\.(?:getItem|setItem)[^\n]*token/i, "auth token is stored in localStorage");
forbidPattern("skill-seeds/external/agent-skills-main/feature-sliced-design/references/practical-examples.md", /getToken\(\)[\s\S]{0,160}Authorization/i, "browser-readable token is attached to API requests");
forbidPattern("skill-seeds/external/agent-skills-main/capacitor-push-notifications/SKILL.md", /console\.log\([^\n]*token/i, "push token is logged");
if (fs.existsSync(path.join(root, "skill-seeds/external/agent-skills-main/daisyui-5/daisyUI5.skill"))) {
  failures.push("skill-seeds/external/agent-skills-main/daisyui-5/daisyUI5.skill: opaque packaged skill must not be bundled");
}
requirePattern("skill-seeds/external/agent-skills-main/daisyui-5/scripts/generate-daisy-safelist.ts", /resolveProjectOutput/, "daisy generator lacks project-root output containment");
requirePattern("skill-seeds/external/agent-skills-main/arkui-api-design/tests/test-runner.ts", /Report output escapes tests\/results/, "ArkUI test output lacks containment");
requirePattern("skill-seeds/external/agent-skills-main/nestjs-best-practices/scripts/build-agents.ts", /resolveInsidePackage/, "NestJS generator lacks package-root containment");
forbidPattern("skill-seeds/external/agent-skills-main/tanstack-start-best-practices/rules/ssr-hydration-safety.md", /dangerouslySetInnerHTML/, "hydration guidance renders raw HTML");
forbidPattern("skill-seeds/external/agent-skills-main/vercel-react-best-practices/rules/rendering-hydration-no-flicker.md", /dangerouslySetInnerHTML/, "no-flicker guidance weakens CSP with inline HTML");
requirePattern("skill-seeds/external/agent-skills-main/open-pencil/SKILL.md", /never execute snippets copied from/i, "eval guidance lacks an untrusted-code boundary");

const trackedText = [
  ...walk(path.join(root, "references")),
  ...walk(path.join(root, "skills")),
  ...walk(path.join(root, "templates")),
].filter((file) => /\.(?:md|sh|json)$/i.test(file));
for (const file of trackedText) {
  const source = fs.readFileSync(file, "utf8");
  if (/\/Users\/[A-Za-z0-9._-]+\//.test(source)) {
    failures.push(`${path.relative(root, file)}: machine-specific absolute user path is persisted`);
  }
  if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(source)) {
    failures.push(`${path.relative(root, file)}: private key material found`);
  }
}

if (failures.length) {
  console.error("Toolkit security audit failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Toolkit security audit passed: ${externalFiles.length} external files and core security contracts checked.`);
