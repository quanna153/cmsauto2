#!/usr/bin/env bash
set -euo pipefail

tracked_files="$(git ls-files 2>/dev/null || true)"

if printf '%s\n' "$tracked_files" | grep -E '(^|/)(\.env|\.env\.local)$|\.sqlite($|-)|\.db$|(^|/)(node_modules|\.next|dist)/' >/dev/null; then
  echo "handoff-check: tracked local secret, database, or generated artifact found." >&2
  exit 1
fi

if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  if git grep -nEI '(^|[^A-Z_])(API_KEY|PASSWORD|TOKEN|SECRET)=[^[:space:]#][^[:space:]]+' -- ':!*.example' >/dev/null 2>&1; then
    echo "handoff-check: possible credential value found in tracked source." >&2
    exit 1
  fi
fi

echo "handoff-check: source tree is safe to publish."

