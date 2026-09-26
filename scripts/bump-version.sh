#!/usr/bin/env bash
set -euo pipefail

# Description: Bump the shared platform version across every place that carries it, commit the
#              change, and tag v<X.Y.Z>.
#
# LoomWeaver ships a single SemVer line for its published npm packages, so one bump touches
# Directory.Build.props (<Version>, the version single-source, verified against the release tag by
# the publish pipeline) and the seven npm packages platform/tools/published-packages.mjs lists (their
# "version", and every peerDependencies["@loomweaver/plugin-sdk"] among them tracking it), plus the
# platform version the generators record for the packages they ask a consumer to install.
# The tag-driven release workflow (.github/workflows/release.yml) re-stamps the built artifacts from
# the tag anyway, but keeping the source in lockstep is what stops package.json drifting from reality.
# (The platform ships no server package — the settings/auth/secret seam is the product's own
# backend — so there is no NuGet/client version line to bump here.)
#
# Usage: ./scripts/bump-version.sh <major|minor|patch|preminor|prerelease|release>
#   patch  0.1.0 → 0.1.1   minor  0.1.0 → 0.2.0   major  0.1.0 → 1.0.0
#   preminor 0.1.0 → 0.2.0-preview.1   prerelease → 0.2.0-preview.2   release → 0.2.0
#   Commits "chore: bump version to <X.Y.Z>" and creates tag v<X.Y.Z>.
#   Push with: git push && git push --tags

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly SCRIPT_DIR
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
readonly ROOT_DIR
PROPS_FILE="${ROOT_DIR}/Directory.Build.props"
readonly PROPS_FILE
PLATFORM_RECIPE="${ROOT_DIR}/platform/libs/tooling/devkit/src/recipes/platform-version.ts"
readonly PLATFORM_RECIPE

usage() {
    echo "Usage: $0 <major|minor|patch|preminor|prerelease|release>"
    echo ""
    echo "Released line:"
    echo "  $0 patch          # 0.1.0 → 0.1.1, commit + tag v0.1.1"
    echo "  $0 minor          # 0.1.0 → 0.2.0, commit + tag v0.2.0"
    echo "  $0 major          # 0.1.0 → 1.0.0, commit + tag v1.0.0"
    echo ""
    echo "Preview line (published to the npm dist-tag 'next', never to 'latest'):"
    echo "  $0 preminor       # 0.7.9 → 0.8.0-preview.1, starts a series"
    echo "  $0 prerelease     # 0.8.0-preview.1 → 0.8.0-preview.2, advances it"
    echo "  $0 release        # 0.8.0-preview.2 → 0.8.0, lands it"
    exit 1
}

[[ $# -ne 1 ]] && usage

BUMP_TYPE="$1"
case "${BUMP_TYPE}" in
    major|minor|patch|preminor|prerelease|release) ;;
    *) usage ;;
esac

CURRENT="$(sed -n 's/.*<Version>\([^<]*\)<\/Version>.*/\1/p' "${PROPS_FILE}")"
if [[ -z "${CURRENT}" ]]; then
    echo "Error: Could not read <Version> from ${PROPS_FILE}" >&2
    exit 1
fi

CORE="${CURRENT%%-*}"
PRE=""
[[ "${CURRENT}" == *-* ]] && PRE="${CURRENT#*-}"

IFS='.' read -r MAJOR MINOR PATCH <<< "${CORE}"

# A preview is a different kind of version, so the operations do not mix. Moving the released line
# while a preview is open would invent a number nobody asked for, and advancing a preview that does
# not exist has nothing to advance. Both refuse and say which operation was meant.
if [[ -n "${PRE}" && ("${BUMP_TYPE}" == "major" || "${BUMP_TYPE}" == "minor" || "${BUMP_TYPE}" == "patch") ]]; then
    echo "Error: ${CURRENT} is a preview. Land it with 'release' first, or advance it with 'prerelease'." >&2
    exit 1
fi
if [[ -z "${PRE}" && ("${BUMP_TYPE}" == "prerelease" || "${BUMP_TYPE}" == "release") ]]; then
    echo "Error: ${CURRENT} is not a preview. Start a series with 'preminor'." >&2
    exit 1
fi
if [[ -n "${PRE}" && "${BUMP_TYPE}" == "preminor" ]]; then
    echo "Error: ${CURRENT} is already a preview of ${CORE}. Advance it with 'prerelease'." >&2
    exit 1
fi

case "${BUMP_TYPE}" in
    major) MAJOR=$((MAJOR + 1)); MINOR=0; PATCH=0 ;;
    minor) MINOR=$((MINOR + 1)); PATCH=0 ;;
    patch) PATCH=$((PATCH + 1)) ;;
    preminor) MINOR=$((MINOR + 1)); PATCH=0; PRE="preview.1" ;;
    prerelease)
        COUNT="${PRE##*.}"
        if [[ ! "${COUNT}" =~ ^[0-9]+$ ]]; then
            echo "Error: cannot advance '${PRE}' — it does not end in a number." >&2
            exit 1
        fi
        PRE="${PRE%.*}.$((COUNT + 1))"
        ;;
    release) PRE="" ;;
esac

NEW_VERSION="${MAJOR}.${MINOR}.${PATCH}"
[[ -n "${PRE}" ]] && NEW_VERSION="${NEW_VERSION}-${PRE}"

echo "Bumping version (<Version>): ${CURRENT} → ${NEW_VERSION}"

# Cross-platform sed -i (macOS BSD vs Linux GNU)
if [[ "$(uname)" == "Darwin" ]]; then
    sed -i '' "s|<Version>${CURRENT}</Version>|<Version>${NEW_VERSION}</Version>|" "${PROPS_FILE}"
else
    sed -i "s|<Version>${CURRENT}</Version>|<Version>${NEW_VERSION}</Version>|" "${PROPS_FILE}"
fi

echo "Updated: ${PROPS_FILE}"

# Stamp the published npm packages. Edited with node (not sed) so the JSON stays valid and key
# order and formatting are preserved; a peer range on @loomweaver/plugin-sdk moves in lockstep.
command -v node >/dev/null 2>&1 || {
    echo "Error: node is required to stamp the npm package versions" >&2
    exit 1
}
MANIFESTS=()
while IFS= read -r manifest; do
    MANIFESTS+=("${manifest}")
done < <(node --input-type=module -e "
import { PUBLISHED_PACKAGES } from '${ROOT_DIR}/platform/tools/published-packages.mjs';
for (const { source } of PUBLISHED_PACKAGES) console.log('${ROOT_DIR}/platform/' + source + '/package.json');
")
readonly MANIFESTS

export NEW_VERSION PLATFORM_RECIPE
node - "${MANIFESTS[@]}" <<'NODE'
const fs = require('fs');
const version = process.env.NEW_VERSION;
for (const path of process.argv.slice(2)) {
  const pkg = JSON.parse(fs.readFileSync(path, 'utf8'));
  pkg.version = version;
  if (pkg.peerDependencies?.['@loomweaver/plugin-sdk']) {
    pkg.peerDependencies['@loomweaver/plugin-sdk'] = version;
  }
  fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n');
}
// The generators record the platform version as a literal, because a recipe produces text and
// cannot read a manifest as it writes: the frame kit for a distribution, the agent adapter for a
// weaver. check-agent-versions fails the build when this is forgotten.
const platformRecipe = process.env.PLATFORM_RECIPE;
fs.writeFileSync(
  platformRecipe,
  fs
    .readFileSync(platformRecipe, 'utf8')
    .replace(/PLATFORM_VERSION = '[^']+'/, `PLATFORM_VERSION = '${version}'`),
);
NODE

for manifest in "${MANIFESTS[@]}"; do
    echo "Updated: ${manifest}"
done
echo "Updated: ${PLATFORM_RECIPE}"

# Stamp the committed app-version module from the new <Version> so the shell (and its published
# npm package) never drifts from Directory.Build.props. Same generator the production build runs.
node "${ROOT_DIR}/platform/tools/stamp-version.mjs"

cd "${ROOT_DIR}"
git add "${PROPS_FILE}" "${MANIFESTS[@]}" "${PLATFORM_RECIPE}" "${ROOT_DIR}/platform/libs/core/shell/src/lib/version/app-version.ts"
git commit -m "chore: bump version to ${NEW_VERSION}"
git tag "v${NEW_VERSION}"

echo ""
echo "Version bumped to ${NEW_VERSION}"
echo "Tag v${NEW_VERSION} created"
echo ""
echo "Push with: git push && git push --tags"
