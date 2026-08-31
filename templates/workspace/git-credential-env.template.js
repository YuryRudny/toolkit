#!/usr/bin/env node

"use strict";

const fs = require("fs");

function readEnv(file) {
  const values = {};
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(trimmed);
    if (!match) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    } else {
      value = value.replace(/\s+#.*$/, "").trim();
    }
    values[match[1]] = value;
  }
  return values;
}

function readInput() {
  return fs.readFileSync(0, "utf8").split(/\r?\n/).reduce((result, line) => {
    const separator = line.indexOf("=");
    if (separator > 0) result[line.slice(0, separator)] = line.slice(separator + 1);
    return result;
  }, {});
}

function configuredGitlabs(env) {
  return Object.keys(env).flatMap((key) => {
    const match = /^GITLAB(?:_([A-Z0-9]+))?_BASE_URL$/.exec(key);
    if (!match) return [];
    const suffix = match[1] ? `_${match[1]}` : "";
    let origin;
    try { origin = new URL(env[key]).origin; }
    catch { return []; }
    return [{
      origin,
      username: env[`GITLAB${suffix}_GIT_USERNAME`] || env[`GITLAB${suffix}_USERNAME`] || "oauth2",
      password: env[`GITLAB${suffix}_GIT_TOKEN`] || env[`GITLAB${suffix}_TOKEN`] || "",
    }];
  });
}

function main() {
  const action = process.argv.at(-1);
  const configIndex = process.argv.indexOf("--config");
  if (action !== "get" || configIndex < 0 || !process.argv[configIndex + 1]) return;
  const localConfig = JSON.parse(fs.readFileSync(process.argv[configIndex + 1], "utf8"));
  const input = readInput();
  if (input.protocol !== "https" || !input.host || !localConfig.envFile) return;
  const requestedOrigin = new URL(`https://${input.host}`).origin;
  const credentials = configuredGitlabs(readEnv(localConfig.envFile))
    .find((candidate) => candidate.origin === requestedOrigin);
  if (!credentials?.password || /[\r\n]/.test(credentials.username + credentials.password)) return;
  if (/^Bearer\s+/i.test(credentials.password)) return;
  process.stdout.write(`username=${credentials.username}\npassword=${credentials.password}\n`);
}

try { main(); }
catch { process.exitCode = 0; }
