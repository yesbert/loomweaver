#!/usr/bin/env bash
set -euo pipefail

# Description: Bump the shared platform version (major | minor | patch) across every place that
#              carries it, commit the change, and tag v<X.Y.Z>.
#
# LoomWeaver ships a single SemVer line for its published npm packages, so one bump touches
# Directory.Build.props (<Version> — the version single-source, verified against the release
# tag by the publish pipeline) and the seven npm packages — @loomweaver/plugin-sdk, @loomweaver/shell,
# @loomweaver/mcp, @loomweaver/cli, @loomweaver/frame-kit, @loomweaver/devkit and @loomweaver/ag-ui (their "version", plus
# @loomweaver/shell's and @loomweaver/ag-ui's peerDependencies["@loomweaver/plugin-sdk"] tracking it).
# The tag-driven release workflow (.github/workflows/release.yml) re-stamps the built artifacts from
# the tag anyway, but keeping the source in lockstep is what stops package.json drifting from reality.
# (The platform ships no server package — the settings/auth/secret seam is the product's own
# backend — so there is no NuGet/client version line to bump here.)
#
# Usage: ./scripts/bump-version.sh <major|minor|patch>
#   patch  0.1.0 → 0.1.1   minor  0.1.0 → 0.2.0   major  0.1.0 → 1.0.0
#   Commits "chore: bump version to <X.Y.Z>" and creates tag v<X.Y.Z>.
#   Push with: git push && git push --tags

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly SCRIPT_DIR
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
readonly ROOT_DIR
PROPS_FILE="${ROOT_DIR}/Directory.Build.props"
readonly PROPS_FILE
SDK_PKG="${ROOT_DIR}/platform/libs/core/plugin-sdk/package.json"
readonly SDK_PKG
SHELL_PKG="${ROOT_DIR}/platform/libs/core/shell/package.json"
readonly SHELL_PKG
MCP_PKG="${ROOT_DIR}/platform/libs/tooling/mcp/package.json"
readonly MCP_PKG
CLI_PKG="${ROOT_DIR}/platform/libs/tooling/cli/package.json"
readonly CLI_PKG
KIT_PKG="${ROOT_DIR}/platform/libs/core/frame-kit/package.json"
readonly KIT_PKG
DEVKIT_PKG="${ROOT_DIR}/platform/libs/tooling/devkit/package.json"
readonly DEVKIT_PKG
AGUI_PKG="${ROOT_DIR}/platform/libs/integrations/ag-ui/package.json"
readonly AGUI_PKG

usage() {
    echo "Usage: $0 <major|minor|patch>"
    echo ""
    echo "Examples:"
    echo "  $0 patch          # 0.1.0 → 0.1.1, commit + tag v0.1.1"
    echo "  $0 minor          # 0.1.0 → 0.2.0, commit + tag v0.2.0"
    echo "  $0 major          # 0.1.0 → 1.0.0, commit + tag v1.0.0"
    exit 1
}

[[ $# -ne 1 ]] && usage

BUMP_TYPE="$1"
if [[ "${BUMP_TYPE}" != "major" && "${BUMP_TYPE}" != "minor" && "${BUMP_TYPE}" != "patch" ]]; then
    usage
fi

CURRENT="$(sed -n 's/.*<Version>\([^<]*\)<\/Version>.*/\1/p' "${PROPS_FILE}")"
if [[ -z "${CURRENT}" ]]; then
    echo "Error: Could not read <Version> from ${PROPS_FILE}" >&2
    exit 1
fi

IFS='.' read -r MAJOR MINOR PATCH <<< "${CURRENT}"

case "${BUMP_TYPE}" in
    major) MAJOR=$((MAJOR + 1)); MINOR=0; PATCH=0 ;;
    minor) MINOR=$((MINOR + 1)); PATCH=0 ;;
    patch) PATCH=$((PATCH + 1)) ;;
esac

NEW_VERSION="${MAJOR}.${MINOR}.${PATCH}"

echo "Bumping version (<Version>): ${CURRENT} → ${NEW_VERSION}"

# Cross-platform sed -i (macOS BSD vs Linux GNU)
if [[ "$(uname)" == "Darwin" ]]; then
    sed -i '' "s|<Version>${CURRENT}</Version>|<Version>${NEW_VERSION}</Version>|" "${PROPS_FILE}"
else
    sed -i "s|<Version>${CURRENT}</Version>|<Version>${NEW_VERSION}</Version>|" "${PROPS_FILE}"
fi

echo "Updated: ${PROPS_FILE}"

# Stamp the published npm packages. Edited with node (not sed) so the JSON stays valid and
# key order/formatting is preserved; @loomweaver/shell's peer range on @loomweaver/plugin-sdk moves in lockstep.
command -v node >/dev/null 2>&1 || {
    echo "Error: node is required to stamp the npm package versions" >&2
    exit 1
}
# `export` (not a `VAR=... node` command-prefix) because SDK_PKG/SHELL_PKG are readonly — a
# prefix assignment would try to reassign them and fail with "readonly variable".
export NEW_VERSION SDK_PKG SHELL_PKG MCP_PKG CLI_PKG KIT_PKG DEVKIT_PKG AGUI_PKG
node <<'NODE'
const fs = require('fs');
const version = process.env.NEW_VERSION;
const rewrite = (path, mutate) => {
  const pkg = JSON.parse(fs.readFileSync(path, 'utf8'));
  mutate(pkg);
  fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n');
};
rewrite(process.env.SDK_PKG, (pkg) => { pkg.version = version; });
rewrite(process.env.SHELL_PKG, (pkg) => {
  pkg.version = version;
  pkg.peerDependencies['@loomweaver/plugin-sdk'] = version;
});
rewrite(process.env.MCP_PKG, (pkg) => { pkg.version = version; });
rewrite(process.env.CLI_PKG, (pkg) => { pkg.version = version; });
rewrite(process.env.KIT_PKG, (pkg) => { pkg.version = version; });
rewrite(process.env.DEVKIT_PKG, (pkg) => { pkg.version = version; });
rewrite(process.env.AGUI_PKG, (pkg) => {
  pkg.version = version;
  pkg.peerDependencies['@loomweaver/plugin-sdk'] = version;
});
NODE

echo "Updated: ${SDK_PKG}"
echo "Updated: ${SHELL_PKG}"
echo "Updated: ${MCP_PKG}"
echo "Updated: ${CLI_PKG}"
echo "Updated: ${KIT_PKG}"
echo "Updated: ${DEVKIT_PKG}"
echo "Updated: ${AGUI_PKG}"

# Stamp the committed app-version module from the new <Version> so the shell (and its published
# npm package) never drifts from Directory.Build.props. Same generator the production build runs.
node "${ROOT_DIR}/platform/tools/stamp-version.mjs"

cd "${ROOT_DIR}"
git add "${PROPS_FILE}" "${SDK_PKG}" "${SHELL_PKG}" "${MCP_PKG}" "${CLI_PKG}" "${KIT_PKG}" "${DEVKIT_PKG}" "${AGUI_PKG}" "${ROOT_DIR}/platform/libs/core/shell/src/lib/version/app-version.ts"
git commit -m "chore: bump version to ${NEW_VERSION}"
git tag "v${NEW_VERSION}"

echo ""
echo "Version bumped to ${NEW_VERSION}"
echo "Tag v${NEW_VERSION} created"
echo ""
echo "Push with: git push && git push --tags"
