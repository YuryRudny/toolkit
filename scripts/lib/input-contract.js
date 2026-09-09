"use strict";
const fs = require("fs");
const { resolveSourcePath } = require("./workspace");
function hasSectionExemption(root, input, key) {
  if (!["localRisks", "criticalFlows"].includes(key)) return false;
  const exemption = input.sectionExemptions?.[key];
  if (!Array.isArray(input[key]) || input[key].length || typeof exemption?.reason !== "string" || !exemption.reason.trim() || !Array.isArray(exemption.evidence) || !exemption.evidence.length) return false;
  return exemption.evidence.every((value) => {
    try { return typeof value === "string" && fs.statSync(resolveSourcePath(root, value)).isFile(); } catch { return false; }
  });
}
module.exports = { hasSectionExemption };
