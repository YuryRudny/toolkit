#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "$SCRIPT_DIR/integration-env.sh"

usage() {
    cat <<'EOF'
Usage:
  confluence-rest.sh /rest/api/user/current
  confluence-rest.sh 123456
  confluence-rest.sh --text 123456
  confluence-rest.sh https://confluence.example.com/rest/api/content/123456?expand=body.view,version,space

Rules:
  - Numeric argument is treated as Confluence page id.
  - --text strips HTML from body.view and prints readable text.
  - Full URLs are accepted only for the configured Confluence HTTPS origin.
  - Secrets are read from PROJECT_AGENT_ENV_FILE or configured env path and are never printed.
EOF
}

if [[ $# -lt 1 ]]; then
    usage
    exit 1
fi

MODE="json"

if [[ "${1:-}" == "--text" ]]; then
    MODE="text"
    shift
fi

if [[ $# -lt 1 ]]; then
    usage
    exit 1
fi

TARGET="$1"
BASE_URL="$(read_env_value "CONFLUENCE_BASE_URL")"

if [[ "$TARGET" =~ ^[0-9]+$ ]]; then
    URL="$(resolve_enterprise_url "$BASE_URL" "/rest/api/content/$TARGET?expand=body.view,version,space")"
else
    URL="$(resolve_enterprise_url "$BASE_URL" "$TARGET")"
fi

if [[ "$MODE" == "text" ]]; then
    json_request "$URL" "CONFLUENCE" |
        jq -r '.body.view.value' |
        perl -0pe 's/<[^>]+>/ /g; s/&nbsp;/ /g; s/&quot;/"/g; s/&amp;/&/g; s/&#39;/'\''/g; s/\s+/ /g'
else
    json_request "$URL" "CONFLUENCE"
fi
