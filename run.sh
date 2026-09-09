#!/usr/bin/env bash
set -euo pipefail

# Resolve the project root so the launcher works from any directory.
ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

# These values are easy to override for a different local layout.
FRONTEND_DIR="${FRONTEND_DIR:-$ROOT_DIR}"
FRONTEND_PORT="${FRONTEND_PORT:-4173}"
FRONTEND_URL="${FRONTEND_URL:-http://127.0.0.1:${FRONTEND_PORT}/}"
BACKEND_DIR="${BACKEND_DIR:-$ROOT_DIR}"
BACKEND_PORT="${BACKEND_PORT:-8000}"
BACKEND_URL="${BACKEND_URL:-http://127.0.0.1:${BACKEND_PORT}/}"
LOG_DIR="${LOG_DIR:-$ROOT_DIR/logs}"

BACKEND_PID=""
FRONTEND_PID=""
BACKEND_ENTRY=""
BACKEND_KIND=""

log() {
  printf '[run] %s\n' "$1"
}

fail() {
  printf '[run] ERROR: %s\n' "$1" >&2
  cleanup
  exit 1
}

# Stop every child process started by this script when Ctrl+C or SIGTERM arrives.
cleanup() {
  trap - INT TERM
  log 'Stopping application processes'

  if [[ -n "$BACKEND_PID" ]] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
  if [[ -n "$FRONTEND_PID" ]] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
    kill "$FRONTEND_PID" 2>/dev/null || true
  fi

  if [[ -n "$BACKEND_PID" ]]; then
    wait "$BACKEND_PID" 2>/dev/null || true
  fi
  if [[ -n "$FRONTEND_PID" ]]; then
    wait "$FRONTEND_PID" 2>/dev/null || true
  fi
}

trap cleanup INT TERM

# Detect Python entry points and the framework before choosing a backend command.
detect_backend() {
  if [[ -f "$BACKEND_DIR/manage.py" ]]; then
    BACKEND_ENTRY="$BACKEND_DIR/manage.py"
    BACKEND_KIND='django'
    return
  fi

  local candidate
  for candidate in app.py main.py server.py; do
    if [[ -f "$BACKEND_DIR/$candidate" ]]; then
      BACKEND_ENTRY="$BACKEND_DIR/$candidate"
      if grep -qE '(^|[^A-Za-z])FastAPI\s*\(' "$BACKEND_ENTRY"; then
        BACKEND_KIND='fastapi'
      elif grep -qE '(^|[^A-Za-z])Flask\s*\(' "$BACKEND_ENTRY"; then
        BACKEND_KIND='flask'
      else
        BACKEND_KIND='python'
      fi
      return
    fi
  done

  # Support the common backend-in-a-subdirectory layout when the root is frontend-only.
  local backend_dir="$ROOT_DIR/backend"
  if [[ -d "$backend_dir" ]]; then
    BACKEND_DIR="$backend_dir"
    detect_backend
  fi
}

# Activate a project virtual environment when one is present.
activate_backend_environment() {
  if [[ -f "$BACKEND_DIR/.venv/bin/activate" ]]; then
    # shellcheck disable=SC1091
    source "$BACKEND_DIR/.venv/bin/activate"
  elif [[ -f "$BACKEND_DIR/venv/bin/activate" ]]; then
    # shellcheck disable=SC1091
    source "$BACKEND_DIR/venv/bin/activate"
  fi
}

start_backend() {
  detect_backend
  if [[ -z "$BACKEND_ENTRY" ]]; then
    log 'No backend entry point detected; continuing with the frontend only'
    return
  fi

  mkdir -p "$LOG_DIR"
  log "Starting backend from $BACKEND_DIR"
  (
    cd "$BACKEND_DIR"
    activate_backend_environment
    case "$BACKEND_KIND" in
      django)
        exec python manage.py runserver "127.0.0.1:${BACKEND_PORT}"
        ;;
      fastapi)
        exec python -m uvicorn "$(basename "${BACKEND_ENTRY%.py}"):app" \
          --host 127.0.0.1 --port "$BACKEND_PORT"
        ;;
      flask)
        export FLASK_APP="$(basename "$BACKEND_ENTRY")"
        export FLASK_RUN_HOST=127.0.0.1
        export FLASK_RUN_PORT="$BACKEND_PORT"
        exec python -m flask run
        ;;
      python)
        exec python "$(basename "$BACKEND_ENTRY")"
        ;;
      *)
        printf '%s\n' "Unknown backend kind: $BACKEND_KIND" >&2
        exit 1
        ;;
    esac
  ) >"$LOG_DIR/backend.log" 2>&1 &
  BACKEND_PID=$!
}

start_frontend() {
  mkdir -p "$LOG_DIR"
  log "Starting frontend from $FRONTEND_DIR"

  if [[ ! -f "$FRONTEND_DIR/package.json" ]]; then
    [[ -f "$FRONTEND_DIR/index.html" ]] || fail "No frontend entry point found in $FRONTEND_DIR"
    command -v python3 >/dev/null 2>&1 || fail 'python3 is required to serve a static frontend'
    (
      cd "$FRONTEND_DIR"
      exec python3 -m http.server "$FRONTEND_PORT" --bind 127.0.0.1
    ) >"$LOG_DIR/frontend.log" 2>&1 &
    FRONTEND_PID=$!
    return
  fi

  (
    cd "$FRONTEND_DIR"
    if [[ ! -d node_modules ]]; then
      log 'Installing frontend dependencies'
      if [[ -f package-lock.json ]]; then
        npm ci
      else
        npm install
      fi
    fi
    exec npm run dev -- --host 127.0.0.1 --port "$FRONTEND_PORT"
  ) >"$LOG_DIR/frontend.log" 2>&1 &
  FRONTEND_PID=$!
}

wait_for_url() {
  local label="$1"
  local url="$2"
  local attempt

  log "Waiting for ${label} at ${url}"
  for ((attempt = 1; attempt <= 30; attempt += 1)); do
    if curl --fail --silent --show-error --max-time 1 "$url" >/dev/null 2>&1; then
      log "${label} is reachable"
      return 0
    fi
    sleep 1
  done

  printf '[run] ERROR: %s did not become reachable within 30 seconds\n' "$label" >&2
  return 1
}

open_frontend() {
  log 'Opening browser'

  if command -v google-chrome >/dev/null 2>&1; then
    google-chrome "$FRONTEND_URL" >/dev/null 2>&1 &
  elif command -v google-chrome-stable >/dev/null 2>&1; then
    google-chrome-stable "$FRONTEND_URL" >/dev/null 2>&1 &
  elif [[ "$OSTYPE" == darwin* ]] && command -v open >/dev/null 2>&1; then
    open -a 'Google Chrome' "$FRONTEND_URL" >/dev/null 2>&1 &
  elif [[ "$OSTYPE" == msys* || "$OSTYPE" == cygwin* ]] && command -v start >/dev/null 2>&1; then
    start chrome "$FRONTEND_URL" >/dev/null 2>&1 &
  elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$FRONTEND_URL" >/dev/null 2>&1 &
    log "Chrome was not found; opened the URL with the system browser: $FRONTEND_URL"
  else
    log "No supported browser opener was found. Open this URL manually: $FRONTEND_URL"
  fi
}

# The detected project is a Vite frontend. Backend startup remains conditional for
# the same launcher to support a future backend without changing the entry command.
log 'Detecting application stack'
detect_backend
start_backend
start_frontend

if [[ -n "$BACKEND_PID" ]]; then
  wait_for_url 'backend' "$BACKEND_URL" || fail "Check $LOG_DIR/backend.log"
fi
wait_for_url 'frontend' "$FRONTEND_URL" || fail "Check $LOG_DIR/frontend.log"
open_frontend

log 'Application is running. Press Ctrl+C to stop it.'
while true; do
  if [[ -n "$BACKEND_PID" ]] && ! kill -0 "$BACKEND_PID" 2>/dev/null; then
    fail "Backend stopped unexpectedly; check $LOG_DIR/backend.log"
  fi
  if [[ -z "$FRONTEND_PID" ]] || ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
    fail "Frontend stopped unexpectedly; check $LOG_DIR/frontend.log"
  fi
  sleep 1
done
