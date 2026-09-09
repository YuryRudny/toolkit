#!/usr/bin/env node
"use strict";
const path = require("path");
const { adoptGeneratedOutput } = require("./lib/owned-artifacts");
const root = path.resolve(process.argv[2] || process.cwd());
adoptGeneratedOutput(root, process.argv[3], process.argv.slice(4).join(" "));
console.log("Output ownership adopted with an explicit decision. No output content changed.");
