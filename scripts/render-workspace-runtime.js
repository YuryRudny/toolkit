#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { loadWorkspace, writeArtifact } = require("./lib/workspace");

const workspace = loadWorkspace(process.argv[2] || process.cwd());
const templatePath = path.join(__dirname, "..", "templates", "workspace", "agentctl.template.js");
if (!fs.existsSync(templatePath)) throw new Error(`Missing workspace runtime template: ${templatePath}`);
const output = writeArtifact(workspace, "bin/agentctl.js", fs.readFileSync(templatePath, "utf8"));
fs.chmodSync(output, 0o755);
console.log("Workspace runtime rendered: bin/agentctl.js");
