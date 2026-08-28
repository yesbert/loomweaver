#!/usr/bin/env bash
set -euo pipefail

# Description: Update all dependencies. Adapted from the sibling TreeWeaver/HiveWeaver script, which
# also drives .NET Aspire workloads, NuGet and dotnet tools. LoomWeaver ships **no server**
# — there is no backend/, no .csproj, no Aspire — so all of that is gone and npm is the
# whole job. Directory.Build.props survives only as the version single-source, not as a .NET project.
#
# Usage: ./scripts/update-all-dependencies.sh [--dry-run] [--skip-tests] [--skip-build] [--skip-npm]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly SCRIPT_DIR
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
readonly ROOT_DIR

readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m'

ERRORS=()
WARNINGS=()

header() {
    echo ""
    echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
    echo ""
}

section() {
    echo ""
    echo -e "${CYAN}━━━ $1 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

success() { echo -e "${GREEN}✓ $1${NC}"; }
warn()    { echo -e "${YELLOW}⚠ $1${NC}"; WARNINGS+=("$1"); }
fail()    { echo -e "${RED}✗ $1${NC}"; ERRORS+=("$1"); }
info()    { echo -e "${BLUE}→ $1${NC}"; }

DRY_RUN=false
SKIP_TESTS=false
SKIP_BUILD=false
SKIP_NPM=false

usage() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Updates all dependencies in LoomWeaver:"
    echo "  - npm packages in every install root (a package.json with a lockfile beside it)"
    echo "  - reports major versions held back by the semver ranges (see note below)"
    echo "  - verifies with nx lint / test / build for both distributions"
    echo ""
    echo "There is no .NET/Aspire section: the platform is frontend-only."
    echo ""
    echo "NOTE: Do NOT run this script with sudo — npm as root leaves you a node_modules"
    echo "      you no longer own. Nothing here needs elevation."
    echo ""
    echo "NOTE: 'npm update' stays inside the semver ranges in package.json, so it never"
    echo "      crosses a major. Angular/Nx majors are migrations, not updates — run"
    echo "      'npx nx migrate latest' in platform/ for those, deliberately and on its own."
    echo ""
    echo "Options:"
    echo "  --skip-tests     Skip running tests after update"
    echo "  --skip-build     Skip building after update"
    echo "  --skip-npm       Skip npm package updates (verification only)"
    echo "  --dry-run        Show what would be updated without making changes"
    echo "  -h, --help       Show this help"
    exit 0
}

while [[ $# -gt 0 ]]; do
    case "${1}" in
        --dry-run)    DRY_RUN=true; shift ;;
        --skip-tests) SKIP_TESTS=true; shift ;;
        --skip-build) SKIP_BUILD=true; shift ;;
        --skip-npm)   SKIP_NPM=true; shift ;;
        -h|--help)    usage ;;
        *) echo "Unknown option: ${1}" >&2; exit 2 ;;
    esac
done

# Kept from the sibling script even though nothing here calls sudo: running npm as root is how you end
# up with a node_modules and caches owned by root, and the next plain `npm ci` then fails with EACCES.
if [[ "$(id -u)" -eq 0 ]]; then
    echo -e "${RED}ERROR: Do not run this script with sudo or as root.${NC}"
    echo "Nothing here needs elevation — npm as root leaves you files you no longer own."
    echo "Run it normally: ./scripts/update-all-dependencies.sh"
    exit 1
fi

check_prerequisites() {
    local missing=()
    command -v npm &>/dev/null || missing+=("npm")
    command -v jq &>/dev/null  || missing+=("jq (brew install jq)")

    if [[ ${#missing[@]} -gt 0 ]]; then
        echo -e "${RED}Missing required tools:${NC}"
        for tool in "${missing[@]}"; do
            echo "  - $tool"
        done
        exit 1
    fi
}

check_prerequisites

header "LoomWeaver Dependency Update"
echo "Root:    ${ROOT_DIR}"
echo "Options: dry-run=${DRY_RUN} skip-tests=${SKIP_TESTS} skip-build=${SKIP_BUILD} skip-npm=${SKIP_NPM}"
echo ""

# An npm INSTALL ROOT is a package.json with a lockfile beside it. Matching every package.json instead
# would walk into build output (dist/libs/*), Angular caches (.angular/cache/*/vite/deps) and each Nx
# lib's publish manifest — 22 hits here, of which exactly one is real. An Nx workspace resolves deps
# from its ONE root package.json anyway, so a per-lib `npm update --save` is meaningless.
#
# Filled by a while-read loop rather than `mapfile`: macOS ships bash 3.2, where mapfile does not exist.
install_roots=()
while IFS= read -r line; do
    [[ -f "$(dirname "${line}")/package-lock.json" ]] && install_roots+=("${line}")
done < <(find "${ROOT_DIR}" -name package.json -not -path '*/node_modules/*' -not -path '*/.git/*' 2>/dev/null || true)

# `npm update` stays inside the declared semver ranges, so a waiting major is invisible in its output.
# Report those explicitly rather than let them rot unseen — they need `nx migrate`, not this script.
#
# The comparison must be a real semver compare, NOT `wanted != latest`: we track Angular on its `next`
# line (22.x), while the `latest` dist-tag still points at the 21.x stable line. A naive inequality
# reports "latest 21.2.18" as an available update for a package sitting on 22.0.6 and would advise a
# downgrade. Only report where `latest` is genuinely newer than what the range allows.
report_held_back_majors() {
    local dir="$1"

    # `A && B || C` is avoided throughout: ShellCheck's SC2015 fires on it, and only newer versions
    # stay quiet when C is `true` — the CI agent's is older than a local brew one, so "clean locally"
    # proves nothing. `npm --prefix` removes the `cd &&` outright; where the working directory is
    # genuinely needed (node must resolve semver from the workspace), the cd lives in its own subshell.
    # `|| true` must live INSIDE the substitution: `npm outdated` exits 1 precisely when something IS
    # outdated, so moving the fallback outside would blank the value exactly when it has content.
    local outdated=""
    outdated=$(npm --prefix "${dir}" outdated --json 2>/dev/null || true)
    if [[ -z "${outdated}" || "${outdated}" == "{}" ]]; then
        return 0
    fi

    local majors=""
    # shellcheck disable=SC2016
    # Single quotes are required: the ${...} below are JS template literals for node to evaluate,
    # and the shell must not touch them.
    majors=$(printf '%s' "${outdated}" | (cd "${dir}" && node -e '
        const semver = require("semver");
        let raw = "";
        process.stdin.on("data", (d) => (raw += d));
        process.stdin.on("end", () => {
            const entries = Object.entries(JSON.parse(raw || "{}"));
            const lines = entries
                .filter(([, v]) => v.wanted && v.latest && semver.valid(v.wanted) && semver.valid(v.latest))
                .filter(([, v]) => semver.gt(v.latest, v.wanted))
                .map(([name, v]) => `  ${name}: ${v.current ?? "—"} → wanted ${v.wanted}, latest ${v.latest}`);
            process.stdout.write(lines.join("\n"));
        });
    ') 2>/dev/null || true)

    if [[ -n "${majors}" ]]; then
        local count
        count=$(echo "${majors}" | wc -l | tr -d ' ')
        echo ""
        warn "${count} package(s) have a newer version the semver ranges hold back — see the list above the summary (use 'npx nx migrate latest', not this script)"
        echo "${majors}"
    fi
}

if [[ "${SKIP_NPM}" == "false" ]]; then
    section "1. npm Packages"

    if [[ ${#install_roots[@]} -eq 0 ]]; then
        info "No npm install roots found — nothing to update"
    else
        for pkg in "${install_roots[@]}"; do
            dir="$(dirname "${pkg}")"
            info "${dir}"
            if [[ "${DRY_RUN}" == "true" ]]; then
                echo "  [dry-run] Would run: npm update --save in ${dir}"
                (cd "${dir}" && npm outdated 2>/dev/null | head -25) || true
            else
                # A failed update is an ERROR, not a warning: updating is the whole job, and npm is
                # atomic — one unresolvable peer means nothing moved at all. Reporting that as a
                # warning under a green "All updates completed successfully" is how it goes unnoticed.
                if (cd "${dir}" && npm update --save 2>&1 | tail -3); then
                    success "npm packages updated in ${dir}"
                else
                    fail "npm update FAILED in ${dir} — nothing was updated (npm is atomic; see the peer conflict above)"
                fi
            fi
            report_held_back_majors "${dir}"
        done
    fi
else
    section "1. npm Packages (SKIPPED)"
fi

# Verification is nx, not dotnet. Lint and test alone are not enough: the Angular compiler is stricter
# than Jest (a union type or a template error slips through `nx test` and only `nx build` catches it),
# and both distributions are built because a bare-platform-only break is real.
if [[ "${SKIP_BUILD}" == "false" && "${DRY_RUN}" == "false" ]]; then
    section "2. Build Verification"
    cd "${ROOT_DIR}/platform"

    info "Linting..."
    if npx nx run-many -t lint --all 2>&1 | tail -3; then
        success "Lint passed"
    else
        fail "Lint FAILED"
    fi

    info "Building both distributions..."
    if npx nx run-many -t build -p loom-testbed loom-shell --skip-nx-cache 2>&1 | tail -3; then
        success "Both distributions build"
    else
        fail "Build FAILED — check errors above"
    fi

    # Sequentially: `run-many -t package` in parallel flakes (known).
    info "Packaging the published libraries..."
    if npx nx package plugin-sdk 2>&1 | tail -2 && npx nx package shell 2>&1 | tail -2; then
        success "Packaging succeeded"
    else
        fail "Packaging FAILED"
    fi
else
    section "2. Build Verification (SKIPPED)"
fi

if [[ "${SKIP_TESTS}" == "false" && "${DRY_RUN}" == "false" ]]; then
    section "3. Test Verification"
    cd "${ROOT_DIR}/platform"

    if npx nx run-many -t test --all --skip-nx-cache 2>&1 | tail -5; then
        success "All unit tests passed"
    else
        fail "Unit tests FAILED — review output above"
    fi
else
    section "3. Test Verification (SKIPPED)"
fi

header "Update Summary"

if [[ ${#WARNINGS[@]} -gt 0 ]]; then
    echo -e "${YELLOW}Warnings (${#WARNINGS[@]}):${NC}"
    for w in "${WARNINGS[@]}"; do
        echo -e "  ${YELLOW}⚠ ${w}${NC}"
    done
    echo ""
fi

if [[ ${#ERRORS[@]} -gt 0 ]]; then
    echo -e "${RED}Errors (${#ERRORS[@]}):${NC}"
    for e in "${ERRORS[@]}"; do
        echo -e "  ${RED}✗ ${e}${NC}"
    done
    echo ""
    echo -e "${RED}Update completed with errors. Please fix the issues above.${NC}"
    exit 1
fi

echo -e "${GREEN}All updates completed successfully!${NC}"
echo ""
echo "Next steps:"
echo "  1. Review changes:   git diff '*package.json' '*package-lock.json'"
echo "  2. E2E (not run here — needs a served app): cd platform && npx nx e2e loom-testbed-e2e"
echo "  3. Commit changes:   git add -A && git commit -m 'chore: update dependencies'"
