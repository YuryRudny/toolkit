#!/usr/bin/env node

"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const toolkitRoot = path.resolve(__dirname, "..");
const seedsRoot = path.join(toolkitRoot, "skill-seeds");
const integrityPath = path.join(seedsRoot, "integrity.json");

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Seed library must not contain symlinks: ${absolute}`);
    if (entry.isDirectory()) walk(absolute, files);
    else if (entry.isFile() && absolute !== integrityPath) files.push(absolute);
  }
  return files;
}

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function currentEntries() {
  return Object.fromEntries(
    walk(seedsRoot)
      .sort()
      .map((file) => [path.relative(toolkitRoot, file).split(path.sep).join("/"), sha256(file)]),
  );
}

function generateIntegrity() {
  const payload = {
    schemaVersion: 1,
    algorithm: "sha256",
    scope: "all files under skill-seeds except integrity.json",
    trust: "reviewed-local-snapshot; external provenance remains unverified",
    files: currentEntries(),
  };
  fs.writeFileSync(integrityPath, `${JSON.stringify(payload, null, 2)}\n`);
  return Object.keys(payload.files).length;
}

function verifySeedIntegrity() {
  if (!fs.existsSync(integrityPath)) throw new Error("Missing skill-seeds/integrity.json; run the maintainer integrity generation command.");
  const expected = JSON.parse(fs.readFileSync(integrityPath, "utf8"));
  if (expected.schemaVersion !== 1 || expected.algorithm !== "sha256" || !expected.files) {
    throw new Error("Invalid seed integrity manifest.");
  }
  const actual = currentEntries();
  const names = new Set([...Object.keys(expected.files), ...Object.keys(actual)]);
  const failures = [];
  for (const name of [...names].sort()) {
    if (!expected.files[name]) failures.push(`unexpected file: ${name}`);
    else if (!actual[name]) failures.push(`missing file: ${name}`);
    else if (expected.files[name] !== actual[name]) failures.push(`hash mismatch: ${name}`);
  }
  if (failures.length) throw new Error(`Seed integrity check failed:\n- ${failures.join("\n- ")}`);
  return Object.keys(actual).length;
}

if (require.main === module) {
  try {
    const command = process.argv[2] || "verify";
    const count = command === "generate" ? generateIntegrity() : verifySeedIntegrity();
    console.log(`Seed integrity ${command === "generate" ? "snapshot generated" : "verified"}: ${count} files`);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

module.exports = { generateIntegrity, verifySeedIntegrity };
