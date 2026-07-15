"use strict";

const fs = require("fs");
const path = require("path");

const SAFE_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SAFE_REFERENCE = /^codex-skills\/references\/[a-z0-9]+(?:-[a-z0-9]+)*\.md$/;

function assertSafeName(value, label = "name") {
  if (typeof value !== "string" || !SAFE_NAME.test(value)) {
    throw new Error(`${label} must contain lowercase letters, digits and single hyphens only: ${value}`);
  }
  return value;
}

function assertSafeReference(value) {
  if (typeof value !== "string" || !SAFE_REFERENCE.test(value)) {
    throw new Error(`Unsafe skill reference path: ${value}`);
  }
  return value;
}

function isInside(base, candidate) {
  const relative = path.relative(base, candidate);
  return relative !== "" && !relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative);
}

function rejectSymlinkComponents(base, candidate, label) {
  const relative = path.relative(base, candidate);
  let current = base;
  for (const segment of relative.split(path.sep).filter(Boolean)) {
    current = path.join(current, segment);
    if (!fs.existsSync(current)) continue;
    if (fs.lstatSync(current).isSymbolicLink()) {
      throw new Error(`${label} crosses a symbolic link: ${current}`);
    }
  }
}

function resolveInside(baseDir, relativePath, label = "path", options = {}) {
  if (typeof relativePath !== "string" || !relativePath || relativePath.includes("\0") || path.isAbsolute(relativePath)) {
    throw new Error(`Unsafe ${label}: ${relativePath}`);
  }

  const base = path.resolve(baseDir);
  const candidate = path.resolve(base, relativePath);
  if (!isInside(base, candidate)) throw new Error(`${label} escapes allowed directory: ${relativePath}`);
  rejectSymlinkComponents(base, candidate, label);

  if (options.mustExist) {
    if (!fs.existsSync(candidate)) throw new Error(`${label} does not exist: ${relativePath}`);
    const realBase = fs.realpathSync(base);
    const realCandidate = fs.realpathSync(candidate);
    if (!isInside(realBase, realCandidate)) throw new Error(`${label} resolves outside allowed directory: ${relativePath}`);
  }

  return candidate;
}

module.exports = {
  assertSafeName,
  assertSafeReference,
  resolveInside,
};
