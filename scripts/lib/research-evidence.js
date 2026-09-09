"use strict";

const fs = require("fs");
const path = require("path");
const { contentFingerprint } = require("./source-state");
const { resolveSourcePath } = require("./workspace");

function captureEvidence(root, task, record) {
  if (!record || typeof record.summary !== "string" || !record.summary.trim()) throw new Error("Evidence requires a non-empty summary");
  if (!Array.isArray(record.scope) || !task.scope.every((scope) => record.scope.includes(scope))) throw new Error(`Evidence does not cover scope of ${task.id}`);
  if (!Array.isArray(record.coverage) || !task.requiredEvidence.every((check) => record.coverage.includes(check))) throw new Error(`Evidence does not cover required checks of ${task.id}`);
  if (!Array.isArray(record.sources) || !record.sources.length) throw new Error("Evidence requires source references");
  const sources = record.sources.map((source) => {
    if (!source || typeof source.path !== "string") throw new Error("Evidence source requires path");
    const file = resolveSourcePath(root, source.path);
    if (!fs.statSync(file).isFile()) throw new Error(`Evidence source is not a file: ${source.path}`);
    return { path: source.path, fingerprint: contentFingerprint(path.dirname(file), [path.basename(file)]) };
  });
  if (["module", "flow", "flow-group"].includes(task.category)) {
    for (const scope of task.scope) {
      const scopePath = resolveSourcePath(root, scope);
      if (!sources.some((source) => {
        const relative = path.relative(scopePath, resolveSourcePath(root, source.path));
        return relative === "" || (relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
      })) throw new Error(`Evidence sources do not cover topology scope: ${scope}`);
    }
  }
  return { summary: record.summary.trim(), scope: record.scope, coverage: record.coverage, sources };
}

function evidenceFailures(root, task) {
  if (task.status === "not-applicable") return Array.isArray(task.gaps) && task.gaps.some((gap) => typeof gap === "string" && gap.trim()) ? [] : [`${task.id}: not-applicable requires a reason`];
  if (task.status !== "complete") return [`${task.id}: research is ${task.status}`];
  if (!Array.isArray(task.evidence) || !task.evidence.length) return [`${task.id}: missing structured evidence`];
  const failures = [];
  for (const record of task.evidence) {
    try {
      const captured = captureEvidence(root, task, record);
      if (captured.sources.some((source, index) => source.fingerprint !== record.sources[index].fingerprint)) failures.push(`${task.id}: evidence source changed`);
    } catch (error) { failures.push(`${task.id}: ${error.message}`); }
  }
  return failures;
}

function researchFailures(root, model, graph) {
  const failures = [];
  if (!model?.fingerprint || graph?.projectFingerprint !== model.fingerprint) failures.push("research fingerprint is missing or stale");
  if (!Array.isArray(graph?.tasks) || !graph.tasks.length) return [...failures, "research task graph is missing or empty"];
  const ids = new Set();
  for (const task of graph.tasks) {
    if (!task || typeof task.id !== "string" || ids.has(task.id)) { failures.push("invalid or duplicate research task id"); continue; }
    ids.add(task.id);
    if (!Array.isArray(task.scope) || !Array.isArray(task.requiredEvidence)) { failures.push(`${task.id}: malformed research task`); continue; }
    failures.push(...evidenceFailures(root, task));
  }
  for (const task of graph.tasks) {
    for (const id of task.dependsOn || []) {
      const dependency = graph.tasks.find((item) => item.id === id);
      if (!dependency || !["complete", "not-applicable"].includes(dependency.status)) failures.push(`${task.id}: unfinished or missing dependency ${id}`);
    }
  }
  return failures;
}

module.exports = { captureEvidence, evidenceFailures, researchFailures };
