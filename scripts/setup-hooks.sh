#!/usr/bin/env bash
# scripts/setup-hooks.sh
#
# Configures Git to use the version-controlled hooks in scripts/hooks/
# directly, via `core.hooksPath`. This avoids copying files into
# .git/hooks/ (which is not version-controlled and can drift out of sync).
#
# Run once after cloning: bash scripts/setup-hooks.sh

set -uo pipefail
cd "$(git rev-parse --show-toplevel)" || exit 1

HOOKS_DIR="scripts/hooks"

if [ ! -d "$HOOKS_DIR" ]; then
    echo "Error: $HOOKS_DIR not found."
    exit 1
fi

chmod +x "$HOOKS_DIR"/*

git config core.hooksPath "$HOOKS_DIR"

echo ""
echo "Git hooks configured successfully."
echo ""
echo "core.hooksPath:"
git config --get core.hooksPath
echo ""
echo "Enabled hooks:"
for hook in "$HOOKS_DIR"/*; do
    echo "  $(basename "$hook")"
done
echo ""
echo "Bypass with --no-verify if you ever need to skip them (not recommended)."