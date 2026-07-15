#!/bin/bash

# Build script for generating AGENTS.md
# Usage: ./build.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check if ts-node is available
if command -v npm exec --no -- &> /dev/null; then
    echo "Running build with ts-node..."
    npm exec --no -- ts-node build-agents.ts
else
    echo "Error: npm exec --no -- not found. Please install Node.js."
    exit 1
fi
