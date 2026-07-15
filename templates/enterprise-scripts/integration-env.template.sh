#!/usr/bin/env bash

set -euo pipefail

ENV_FILE="${PROJECT_AGENT_ENV_FILE:-__ENV_FILE_PATH__}"
JIRA_AUTH_MODE="${PROJECT_AGENT_JIRA_AUTH_MODE:-as-is}"
CONFLUENCE_AUTH_MODE="${PROJECT_AGENT_CONFLUENCE_AUTH_MODE:-as-is}"

trim() {
    local value="${1:-}"

    value="${value#"${value%%[![:space:]]*}"}"
    value="${value%"${value##*[![:space:]]}"}"

    printf "%s" "$value"
}

read_env_value() {
    local key="$1"
    local value

    if [[ -z "$ENV_FILE" || "$ENV_FILE" == "__ENV_FILE_PATH__" ]]; then
        echo "Env file path is not configured. Set PROJECT_AGENT_ENV_FILE or update .tmp/integration-env.sh." >&2
        return 1
    fi

    if [[ ! -f "$ENV_FILE" ]]; then
        echo "Env file not found: $ENV_FILE" >&2
        return 1
    fi

    value="$(sed -n "s/^${key}=//p" "$ENV_FILE" | head -n 1)"
    value="$(trim "$value")"

    if [[ -z "$value" ]]; then
        echo "Missing $key in $ENV_FILE" >&2
        return 1
    fi

    printf "%s" "$value"
}

read_optional_env_value() {
    local key="$1"
    local value

    if [[ -z "$ENV_FILE" || "$ENV_FILE" == "__ENV_FILE_PATH__" || ! -f "$ENV_FILE" ]]; then
        return 0
    fi

    value="$(sed -n "s/^${key}=//p" "$ENV_FILE" | head -n 1)"
    value="$(trim "$value")"

    printf "%s" "$value"
}

build_auth_header() {
    local system="$1"
    local mode token username raw

    case "$system" in
        JIRA)
            mode="$JIRA_AUTH_MODE"
            token="$(read_env_value "JIRA_TOKEN")"
            username="$(read_optional_env_value "JIRA_USERNAME")"
            ;;
        CONFLUENCE)
            mode="$CONFLUENCE_AUTH_MODE"
            token="$(read_env_value "CONFLUENCE_TOKEN")"
            username="$(read_optional_env_value "CONFLUENCE_USERNAME")"
            ;;
        *)
            echo "Unknown auth system: $system" >&2
            return 1
            ;;
    esac

    case "$mode" in
        as-is)
            printf "%s" "$token"
            ;;
        bearer)
            if [[ "$token" == Bearer\ * ]]; then
                printf "%s" "$token"
            else
                printf "Bearer %s" "$token"
            fi
            ;;
        basic)
            if [[ -z "$username" ]]; then
                echo "Missing ${system}_USERNAME for basic auth mode" >&2
                return 1
            fi
            raw="${username}:${token}"
            printf "Basic %s" "$(printf "%s" "$raw" | base64 | tr -d '\n')"
            ;;
        *)
            echo "Unsupported ${system}_AUTH_MODE: $mode" >&2
            return 1
            ;;
    esac
}

resolve_enterprise_url() {
    local base_url target base_origin target_origin

    base_url="$(trim "${1:-}")"
    target="$(trim "${2:-}")"

    if [[ ! "$base_url" =~ ^https://[^/@[:space:]?#]+(:[0-9]+)?(/[^[:space:]?#]*)?$ ]]; then
        echo "Enterprise base URL must use HTTPS, contain no credentials and have a valid host." >&2
        return 1
    fi

    base_url="${base_url%/}"
    if [[ "$base_url" =~ ^(https://[^/]+) ]]; then
        base_origin="${BASH_REMATCH[1]}"
    else
        echo "Cannot determine enterprise base URL origin." >&2
        return 1
    fi

    if [[ "$target" =~ ^https:// ]]; then
        if [[ ! "$target" =~ ^(https://[^/]+)(/.*)?$ ]]; then
            echo "Invalid enterprise target URL." >&2
            return 1
        fi
        target_origin="${BASH_REMATCH[1]}"
        if [[ "$target_origin" != "$base_origin" ]]; then
            echo "Refusing to send credentials to a different origin: $target_origin" >&2
            return 1
        fi
        printf "%s" "$target"
        return 0
    fi

    if [[ "$target" =~ ^http:// ]]; then
        echo "Refusing insecure HTTP enterprise target." >&2
        return 1
    fi

    if [[ "$target" != /* ]]; then
        echo "Enterprise target must be an absolute HTTPS URL on the configured origin or a path starting with /." >&2
        return 1
    fi

    printf "%s%s" "$base_url" "$target"
}

json_request() (
    local url="$1"
    local system="$2"
    local auth_header header_file status

    auth_header="$(build_auth_header "$system")"
    if [[ "$auth_header" == *$'\n'* || "$auth_header" == *$'\r'* ]]; then
        echo "Invalid authorization header: line breaks are forbidden." >&2
        return 1
    fi

    umask 077
    header_file="$(mktemp "${TMPDIR:-/tmp}/project-agent-auth.XXXXXX")"
    chmod 600 "$header_file"
    printf "Authorization: %s\nAccept: application/json\n" "$auth_header" >"$header_file"
    trap 'rm -f "$header_file"' EXIT HUP INT TERM

    if curl -fsS \
        --proto '=https' \
        --tlsv1.2 \
        --connect-timeout 10 \
        --max-time 30 \
        -H "@$header_file" \
        "$url"; then
        status=0
    else
        status=$?
    fi

    rm -f "$header_file"
    trap - EXIT HUP INT TERM
    return "$status"
)
