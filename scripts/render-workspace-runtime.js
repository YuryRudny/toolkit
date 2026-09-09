#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { loadWorkspace } = require("./lib/workspace");
const { writeOwnedArtifacts } = require("./lib/owned-artifacts");
const { LOCAL_MANIFEST, loadLocalStorage } = require("./lib/local-storage");

const root = path.resolve(process.argv[2] || process.cwd());
const local = fs.existsSync(path.join(root, LOCAL_MANIFEST)) ? loadLocalStorage(root) : null;
const workspace = local ? { artifactRoot: local.root, manifest: local.manifest } : loadWorkspace(root);
const runtimeTemplates = [["agentctl.template.js", "bin/agentctl.js"]];
if (!local && workspace.manifest.integrations) {
  runtimeTemplates.push(["enterprise-mcp.template.js", "bin/enterprise-mcp.js"]);
  runtimeTemplates.push(["git-credential-env.template.js", "bin/git-credential-env.js"]);
}

const plan = [];
for (const [templateName, outputPath] of runtimeTemplates) {
  const templatePath = path.join(__dirname, "..", "templates", "workspace", templateName);
  if (!fs.existsSync(templatePath)) throw new Error(`Missing workspace runtime template: ${templatePath}`);
  const rendered = fs.readFileSync(templatePath, "utf8")
    .replaceAll("<ENTERPRISE_MCP_SERVER_NAME>", workspace.manifest.integrations?.mcpServerName || `${workspace.manifest.workspaceId}-enterprise`);
  plan.push({ relativePath: outputPath, text: rendered });
}

for (const name of ["source-state.js", "workspace.js", "path-safety.js", "repository-separation.js", "local-storage.js", "update-policy.js"]) {
  plan.push({ relativePath: `bin/lib/${name}`, text: fs.readFileSync(path.join(__dirname, "lib", name), "utf8") });
}
writeOwnedArtifacts(workspace.artifactRoot, plan);
for (const [, outputPath] of runtimeTemplates) fs.chmodSync(path.join(workspace.artifactRoot, outputPath), 0o755);

console.log(`Workspace runtime rendered: ${runtimeTemplates.map(([, output]) => output).join(", ")}`);
