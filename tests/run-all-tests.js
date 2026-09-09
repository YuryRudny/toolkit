#!/usr/bin/env node
"use strict";
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const root = path.resolve(__dirname, "..");
if (Number(process.versions.node.split(".")[0]) < 22) throw new Error("Toolkit requires Node.js 22 or newer");
function checkFile(file) {
  const result = spawnSync(process.execPath, ["--check", file], { cwd: root, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`Syntax check failed: ${file}\n${result.stderr}`);
}
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (file.endsWith(".js")) checkFile(file);
  }
}
for (const dir of ["scripts", "tests", "templates/workspace"]) walk(path.join(root, dir));
console.log("JavaScript syntax checks passed.");
for (const entry of fs.readdirSync(path.join(root, "skills"), { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const skill = fs.readFileSync(path.join(root, "skills", entry.name, "SKILL.md"), "utf8");
  const header = skill.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!header || header[1].match(/^name:\s*([a-z0-9-]+)\s*$/m)?.[1] !== entry.name || !/^description:\s*\S.+$/m.test(header[1])) throw new Error(`Invalid skill frontmatter: ${entry.name}`);
}
console.log("Local skill name/description checks passed.");
for (const suite of ["run-update-tests.js", "run-regression-tests.js", "run-tests.js", "run-sidecar-tests.js", "run-enterprise-tests.js"]) {
  console.log(`Running ${suite}`);
  const result = spawnSync(process.execPath, [path.join(__dirname, suite)], { cwd: root, stdio: "inherit", timeout: 120000 });
  if (result.status !== 0) { if (result.error) console.error(result.error.message); process.exit(result.status || 1); }
}
console.log("All 5 toolkit suites passed.");
