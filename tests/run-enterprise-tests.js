#!/usr/bin/env node

const assert = require("assert");
const fs = require("fs");
const http = require("http");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

const toolkitRoot = path.resolve(__dirname, "..");
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "bsg-enterprise-test-"));
const serverScript = path.join(tempRoot, "enterprise-mcp.js");
const envFile = path.join(tempRoot, "integrations.env");
const configFile = path.join(tempRoot, "integrations.json");
const servers = [];
fs.writeFileSync(serverScript, fs.readFileSync(path.join(toolkitRoot, "templates", "workspace", "enterprise-mcp.template.js"), "utf8")
  .replaceAll("<ENTERPRISE_MCP_SERVER_NAME>", "fixture-enterprise"));

function listen(handler) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(handler);
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      servers.push(server);
      resolve(`http://127.0.0.1:${server.address().port}`);
    });
  });
}

function json(response, status, payload) {
  const body = JSON.stringify(payload);
  response.writeHead(status, { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) });
  response.end(body);
}

function textResponse(response, status, body) {
  response.writeHead(status, { "Content-Type": "text/html", "Content-Length": Buffer.byteLength(body) });
  response.end(body);
}

function run(args, expectedStatus = 0) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [serverScript, "--config", configFile, "--allow-insecure-localhost", ...args], {
      cwd: tempRoot,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.once("error", reject);
    child.once("close", (status) => {
      if (status !== expectedStatus) return reject(new Error(`enterprise runtime returned ${status}\nstdout:\n${stdout}\nstderr:\n${stderr}`));
      resolve({ stdout, stderr });
    });
  });
}

async function runMcpList() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [serverScript, "--config", configFile, "--allow-insecure-localhost"], {
      cwd: tempRoot,
      stdio: ["pipe", "pipe", "pipe"],
    });
    const messages = [];
    let buffer = "";
    let stderr = "";
    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error(`MCP response timeout: ${stderr}`));
    }, 5000);
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.stdout.on("data", (chunk) => {
      buffer += chunk;
      let index;
      while ((index = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, index).trim();
        buffer = buffer.slice(index + 1);
        if (line) messages.push(JSON.parse(line));
      }
      if (messages.length === 2) {
        clearTimeout(timeout);
        child.kill();
        resolve(messages);
      }
    });
    child.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2024-11-05" } })}\n`);
    child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} })}\n`);
  });
}

async function main() {
  let confluenceBase;
  let figmaBase;
  let gitlabBase;
  const jiraBase = await listen((request, response) => {
    if (request.headers.authorization !== "Bearer jira-secret") return textResponse(response, 401, "<html>unauthorized</html>");
    if (request.url.startsWith("/rest/api/2/myself")) return json(response, 200, { name: "fixture-user" });
    if (request.url.startsWith("/rest/api/2/issue/BSG-42")) {
      return json(response, 200, {
        id: "42",
        key: "BSG-42",
        self: `${jiraBase}/rest/api/2/issue/BSG-42`,
        fields: {
          summary: "Implement application screen",
          status: { name: "In Progress" },
          issuetype: { name: "Story" },
          assignee: { displayName: "Developer" },
          reporter: { displayName: "Product" },
          description: `${confluenceBase}/spaces/BSG/pages/123/Application+specification ${figmaBase.replace(/^http:\/\/127\.0\.0\.1:\d+$/, "https://www.figma.com")}/design/FILE123/Screen?node-id=1-2 ${gitlabBase}/group/project/-/merge_requests/7`,
          comment: { comments: [] },
        },
        renderedFields: {},
      });
    }
    return json(response, 404, { message: "missing" });
  });

  confluenceBase = await listen((request, response) => {
    if (request.headers.authorization !== "Bearer confluence-secret") return json(response, 401, { message: "invalid confluence token" });
    if (request.url.startsWith("/rest/api/user/current")) return json(response, 200, { username: "fixture-user" });
    if (request.url.startsWith("/rest/api/content/123")) {
      return json(response, 200, {
        id: "123",
        title: "Application specification",
        space: { key: "BSG" },
        version: { number: 3, when: "2026-08-31T00:00:00Z" },
        body: { view: { value: "<h1>Spec</h1><p>Use approved design.</p>" } },
        _links: { webui: "/pages/viewpage.action?pageId=123" },
      });
    }
    return json(response, 404, { message: "missing" });
  });

  figmaBase = await listen((request, response) => {
    if (request.headers["x-figma-token"] !== "figma-secret") return json(response, 403, { message: "invalid figma token" });
    if (request.url.startsWith("/v1/me")) return json(response, 200, { id: "figma-user" });
    if (request.url.startsWith("/v1/files/FILE123/variables/local")) {
      return json(response, 200, { meta: {
        variableCollections: { c1: { id: "c1", name: "Theme", modes: [{ modeId: "m1", name: "Light" }] } },
        variables: { v1: { id: "v1", name: "color/primary", resolvedType: "COLOR", valuesByMode: { m1: { r: 1, g: 0, b: 0, a: 1 } } } },
      } });
    }
    if (request.url.startsWith("/v1/files/FILE123/nodes")) {
      return json(response, 200, {
        name: "Fixture design",
        lastModified: "2026-08-31T00:00:00Z",
        nodes: { "1:2": { document: {
          id: "1:2",
          type: "FRAME",
          name: "Application",
          itemSpacing: 16,
          fills: [{ type: "SOLID", color: { r: 1, g: 1, b: 1, a: 1 } }],
          children: [{ id: "2:3", type: "TEXT", name: "Title", style: { fontFamily: "Inter", fontWeight: 600, fontSize: 24 } }],
        } } },
        styles: { s1: { name: "Heading", styleType: "TEXT" } },
        components: { cmp1: { name: "Button" } },
        componentSets: {},
      });
    }
    return json(response, 404, { message: "missing" });
  });

  gitlabBase = await listen((request, response) => {
    if (request.headers["private-token"] !== "gitlab-secret") return json(response, 401, { message: "invalid gitlab token" });
    if (request.url.startsWith("/api/v4/user")) return json(response, 200, { id: 1, username: "fixture" });
    if (request.url.startsWith("/api/v4/projects/group%2Fproject/merge_requests/7")) {
      return json(response, 200, { iid: 7, title: "Fixture MR", state: "opened", web_url: `${gitlabBase}/group/project/-/merge_requests/7` });
    }
    if (request.url.startsWith("/api/v4/projects/group%2Fproject")) {
      return json(response, 200, { id: 9, path_with_namespace: "group/project", default_branch: "main", visibility: "private", web_url: `${gitlabBase}/group/project` });
    }
    return json(response, 404, { message: "missing" });
  });

  const writeEnv = (jiraToken) => fs.writeFileSync(envFile, [
    `JIRA_BASE_URL=${jiraBase}`,
    `JIRA_TOKEN=${jiraToken}`,
    `CONFLUENCE_BASE_URL=${confluenceBase}`,
    "CONFLUENCE_TOKEN=confluence-secret",
    `FIGMA_API_BASE_URL=${figmaBase}`,
    "FIGMA_TOKEN=figma-secret",
    `GITLAB_TEST_BASE_URL=${gitlabBase}`,
    "GITLAB_TEST_TOKEN=gitlab-secret",
    "",
  ].join("\n"), { mode: 0o600 });

  writeEnv("jira-secret");
  fs.writeFileSync(configFile, `${JSON.stringify({ schemaVersion: 1, workspaceId: "fixture", envFile }, null, 2)}\n`, { mode: 0o600 });

  const doctor = JSON.parse((await run(["--doctor"])).stdout);
  assert.equal(doctor.status, "passed");
  assert(doctor.results.every((item) => item.status === "passed"));

  const resolved = JSON.parse((await run(["--resolve-issue", "BSG-42"])).stdout);
  assert.equal(resolved.status, "complete");
  assert.equal(resolved.issue.key, "BSG-42");
  assert(resolved.linkedContexts.some((item) => item.service === "confluence"));
  assert(resolved.linkedContexts.some((item) => item.service === "gitlab" && item.resource.iid === 7));
  const figma = resolved.linkedContexts.find((item) => item.service === "figma");
  assert(figma);
  assert(figma.fonts.some((font) => font.family === "Inter"));
  assert(figma.variables.values.some((variable) => variable.name === "color/primary"));

  const mcp = await runMcpList();
  assert.equal(mcp[0].result.serverInfo.name, "fixture-enterprise");
  assert(mcp[1].result.tools.some((tool) => tool.name === "jira_resolve_context"));

  writeEnv("wrong-secret-value");
  const failed = await run(["--doctor"], 1);
  const failedDoctor = JSON.parse(failed.stdout);
  assert.equal(failedDoctor.status, "failed");
  assert.equal(failedDoctor.results.find((item) => item.kind === "jira").error.category, "authentication-or-permission");
  assert(!failed.stdout.includes("wrong-secret-value"));
  assert(!failed.stderr.includes("wrong-secret-value"));

  console.log("Toolkit enterprise MCP tests passed.");
}

main().finally(() => {
  for (const server of servers) server.close();
  fs.rmSync(tempRoot, { recursive: true, force: true });
}).catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
