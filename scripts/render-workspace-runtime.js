#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { loadWorkspace, writeArtifact } = require("./lib/workspace");

const workspace = loadWorkspace(process.argv[2] || process.cwd());
const runtimeTemplates = [["agentctl.template.js", "bin/agentctl.js"]];
if (workspace.manifest.integrations) {
  runtimeTemplates.push(["enterprise-mcp.template.js", "bin/enterprise-mcp.js"]);
}

for (const [templateName, outputPath] of runtimeTemplates) {
  const templatePath = path.join(__dirname, "..", "templates", "workspace", templateName);
  if (!fs.existsSync(templatePath)) throw new Error(`Missing workspace runtime template: ${templatePath}`);
  const rendered = fs.readFileSync(templatePath, "utf8")
    .replaceAll("<ENTERPRISE_MCP_SERVER_NAME>", workspace.manifest.integrations?.mcpServerName || `${workspace.manifest.workspaceId}-enterprise`);
  const output = writeArtifact(workspace, outputPath, rendered);
  fs.chmodSync(output, 0o755);
}

console.log(`Workspace runtime rendered: ${runtimeTemplates.map(([, output]) => output).join(", ")}`);
