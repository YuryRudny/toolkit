#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "$SCRIPT_DIR/integration-env.sh"

usage() {
    cat <<'EOF'
Usage:
  jira-rest.sh /rest/api/2/myself
  jira-rest.sh PROJECT-123
  jira-rest.sh https://jira.example.com/rest/api/2/issue/PROJECT-123?expand=renderedFields

Rules:
  - Issue-like argument is treated as Jira issue key.
  - Full URLs are accepted only for the configured Jira HTTPS origin.
  - Secrets are read from PROJECT_AGENT_ENV_FILE or configured env path and are never printed.
EOF
}

if [[ $# -lt 1 ]]; then
    usage
    exit 1
fi

TARGET="$1"
BASE_URL="$(read_env_value "JIRA_BASE_URL")"

if [[ "$TARGET" =~ ^[A-Z][A-Z0-9]+-[0-9]+$ ]]; then
    URL="$(resolve_enterprise_url "$BASE_URL" "/rest/api/2/issue/$TARGET?expand=renderedFields")"
else
    URL="$(resolve_enterprise_url "$BASE_URL" "$TARGET")"
fi

json_request "$URL" "JIRA"
