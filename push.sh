#!/usr/bin/env bash
set -euo pipefail

# Resolve the project root so the script behaves the same from any working directory.
ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"
PROJECT_NAME="${PROJECT_NAME:-$(basename "$ROOT_DIR")}"
MCP_SERVER_NAME="${MCP_SERVER_NAME:-github-mcp-cicd-lessons}"
GITHUB_OWNER="${GITHUB_OWNER:-}"
GITHUB_REPOSITORY="${GITHUB_REPOSITORY:-}"
GITHUB_BRANCH="${GITHUB_BRANCH:-main}"

log() {
  printf '[push] %s\n' "$1"
}

fail() {
  printf '[push] ERROR: %s\n' "$1" >&2
  exit 1
}

# Detect the project technologies before building or extending ignore rules.
detect_stack() {
  STACKS=()

  if [[ -f package.json || -d node_modules ]]; then
    STACKS+=(node)
  fi
  if [[ -f requirements.txt || -f pyproject.toml || -d venv || -d .venv ]]; then
    STACKS+=(python)
  fi
  if compgen -G 'Dockerfile*' > /dev/null; then
    STACKS+=(docker)
  fi
  if [[ ${#STACKS[@]} -eq 0 ]]; then
    STACKS+=(generic)
  fi

  log "Detected stack: ${STACKS[*]}"
}

# Add one ignore pattern at a time without duplicating existing entries.
ensure_ignore_pattern() {
  local pattern="$1"
  if ! grep -Fqx -- "$pattern" .gitignore 2>/dev/null; then
    printf '%s\n' "$pattern" >> .gitignore
  fi
}

ensure_gitignore() {
  log 'Checking .gitignore'
  touch .gitignore

  # Required patterns for secrets, generated files, editors, and common runtimes.
  local required_patterns=(
    '.env'
    '.env.*'
    '!.env.example'
    'venv/'
    '.venv/'
    'node_modules/'
    '__pycache__/'
    '*.pyc'
    'logs/'
    '*.log'
    'dist/'
    'coverage/'
    '.DS_Store'
    'Thumbs.db'
    '.vscode/'
    '.idea/'
  )

  local pattern
  for pattern in "${required_patterns[@]}"; do
    ensure_ignore_pattern "$pattern"
  done

  # Add stack-specific build and tooling artifacts only when that stack is present.
  if [[ " ${STACKS[*]} " == *' node '* ]]; then
    ensure_ignore_pattern 'playwright-report/'
    ensure_ignore_pattern 'test-results/'
    ensure_ignore_pattern '.vitest/'
  fi
  if [[ " ${STACKS[*]} " == *' python '* ]]; then
    ensure_ignore_pattern '*.egg-info/'
    ensure_ignore_pattern '.pytest_cache/'
  fi
}

ensure_dockerignore() {
  [[ " ${STACKS[*]} " == *' docker '* ]] || return 0

  log 'Checking .dockerignore'
  touch .dockerignore
  local pattern
  for pattern in \
    'node_modules/' \
    '.git/' \
    '.env*' \
    '*.log' \
    'coverage/' \
    'dist/' \
    'test-results/' \
    'playwright-report/'; do
    if ! grep -Fqx -- "$pattern" .dockerignore 2>/dev/null; then
      printf '%s\n' "$pattern" >> .dockerignore
    fi
  done
}

resolve_mcp_target() {
  local remote_url
  remote_url="$(git remote get-url origin 2>/dev/null || true)"

  if [[ "$remote_url" =~ github\.com[:/]([^/]+)/([^/]+) ]]; then
    GITHUB_OWNER="${GITHUB_OWNER:-${BASH_REMATCH[1]}}"
    GITHUB_REPOSITORY="${GITHUB_REPOSITORY:-${BASH_REMATCH[2]%.git}}"
  fi

  GITHUB_REPOSITORY="${GITHUB_REPOSITORY:-$PROJECT_NAME}"

  [[ -n "$GITHUB_OWNER" ]] || fail 'GitHub owner is required. Set GITHUB_OWNER or configure a GitHub origin.'
  [[ -n "$GITHUB_REPOSITORY" ]] || fail 'GitHub repository is required. Set GITHUB_REPOSITORY or PROJECT_NAME.'
}

log 'Initialising repository'
if [[ ! -d .git ]]; then
  git init -b "$GITHUB_BRANCH"
else
  # Keep the push target predictable for an existing checkout.
  current_branch="$(git branch --show-current)"
  if [[ -n "$current_branch" && "$current_branch" != "$GITHUB_BRANCH" ]]; then
    git branch -M "$GITHUB_BRANCH"
  fi
fi

detect_stack
ensure_gitignore
ensure_dockerignore
resolve_mcp_target

log 'Adding changes'
git add -A

if git diff --cached --quiet; then
  printf '%s\n' 'Nothing to publish'
  exit 0
fi

# Number commits from the current history and append an optional human message.
existing_commits="$(git rev-list --count HEAD 2>/dev/null || printf '0')"
commit_number=$((existing_commits + 1))
timestamp="$(date '+%Y-%m-%d %H:%M')"
commit_message="Commit #${commit_number} - ${timestamp}"
if [[ $# -gt 0 && -n "$1" ]]; then
  commit_message+=" - $1"
fi

log 'Changes prepared for MCP'
printf '[push] Commit message: %s\n' "$commit_message"
printf '[push] MCP server: %s\n' "$MCP_SERVER_NAME"
printf '[push] Repository: %s/%s\n' "$GITHUB_OWNER" "$GITHUB_REPOSITORY"
printf '[push] Branch: %s\n' "$GITHUB_BRANCH"
printf '%s\n' '[push] Remote publishing is delegated to the configured GitHub MCP server.'
