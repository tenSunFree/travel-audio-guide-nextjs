#!/usr/bin/env bash
# scripts/check-hooks.sh
#
# Runs automatically after `npm install` (see the "postinstall" script in
# package.json). If the version-controlled Git hooks in scripts/hooks/
# aren't wired up yet via `core.hooksPath`, this configures them
# automatically — the same thing `npm run hooks:install` does — instead of
# just printing a reminder.
#
# Why auto-install rather than warn-and-wait: enforcing "run hooks:install
# before you push" would itself require a pre-push hook to check it, but a
# pre-push hook can't run at all until hooks are installed in the first
# place. `npm install` is the one step nobody skips (every fresh clone,
# every `npm ci`, every dependency bump), so it's the only reliable place
# to close that gap automatically rather than relying on a human to
# remember a manual step.
#
# This never fails the install. If core.hooksPath is already set to
# something else on purpose (e.g. a developer's own tooling), it is left
# untouched and a note is printed instead of overriding it.

set -uo pipefail
cd "$(git rev-parse --show-toplevel)" 2>/dev/null || exit 0

# Skip in CI: hooks are a local developer convenience, not something CI
# runners install, and CI already runs the equivalent checks directly via
# `npm run ci` in the workflow.
if [ -n "${CI:-}" ]; then
    exit 0
fi

# Skip if this isn't a Git checkout at all (e.g. extracted from a tarball,
# or installed as a dependency of another project).
if [ ! -d ".git" ]; then
    exit 0
fi

HOOKS_DIR="scripts/hooks"
CONFIGURED_PATH="$(git config --get core.hooksPath 2>/dev/null || true)"

if [ "$CONFIGURED_PATH" = "$HOOKS_DIR" ]; then
    exit 0
fi

if [ -n "$CONFIGURED_PATH" ]; then
    echo ""
    echo "Note: core.hooksPath is set to \"$CONFIGURED_PATH\", not"
    echo "\"$HOOKS_DIR\". Leaving it as-is; run 'npm run hooks:install' to"
    echo "switch to this repo's hooks if that was unintentional."
    echo ""
    exit 0
fi

echo ""
echo "Git hooks not configured yet -- running 'npm run hooks:install' for you..."
bash scripts/setup-hooks.sh

exit 0