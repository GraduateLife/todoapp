#!/usr/bin/env bash

set -euo pipefail

mode="${1:-}"
fix_mode="false"

if [[ "$mode" == "--fix" ]]; then
  fix_mode="true"
  mode=""
fi

is_lintable_file() {
  case "$1" in
    *.js|*.jsx|*.ts|*.tsx|*.mjs|*.cjs) return 0 ;;
    *) return 1 ;;
  esac
}

collect_files_from_staged() {
  git diff --cached --name-only --diff-filter=ACMR
}

collect_files_from_base() {
  local base_ref="${LINT_BASE_REF:-}"

  if [[ -n "$base_ref" ]]; then
    git diff --name-only --diff-filter=ACMR "$base_ref"...HEAD
    return
  fi

  if git rev-parse --verify HEAD~1 >/dev/null 2>&1; then
    git diff --name-only --diff-filter=ACMR HEAD~1...HEAD
    return
  fi

  git ls-files
}

files=()
while IFS= read -r file; do
  [[ -n "$file" ]] || continue
  [[ -f "$file" ]] || continue
  is_lintable_file "$file" || continue
  files+=("$file")
done < <(
  if [[ "$mode" == "--staged" ]]; then
    collect_files_from_staged
  else
    collect_files_from_base
  fi
)

if [[ "${#files[@]}" -eq 0 ]]; then
  echo "No changed lintable files found."
  exit 0
fi

echo "Linting changed files:"
printf ' - %s\n' "${files[@]}"

if [[ "$fix_mode" == "true" ]]; then
  pnpm exec eslint --fix "${files[@]}"
else
  pnpm exec eslint "${files[@]}"
fi
