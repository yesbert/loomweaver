#!/usr/bin/env bash
set -euo pipefail

# Description: Export SonarQube analysis results as pipeline artifacts (issues, hotspots,
# quality gate, duplications, measures + a Markdown summary uploaded to the build page).
# Designed to run AFTER SonarQubePublish@8 in azure-pipelines-sonar.yml — this is what makes
# the results visible directly in the Azure DevOps run (build summary tab), mirroring the
# sibling TreeWeaver pipeline.
#
# Requires: SONARQUBE_URL, SONARQUBE_TOKEN, BUILD_ARTIFACT_DIR environment variables.
# Optional: SONARQUBE_PROJECT_KEY (default: loomweaver)

echo "=== SonarQube Result Export ==="

# --- Validate required environment variables ---

if [[ -z "${SONARQUBE_URL:-}" ]]; then
  echo "##vso[task.logissue type=warning]SONARQUBE_URL not set, skipping result export"
  exit 0
fi

if [[ -z "${SONARQUBE_TOKEN:-}" ]]; then
  echo "##vso[task.logissue type=warning]SONARQUBE_TOKEN not set, skipping result export"
  exit 0
fi

if [[ -z "${BUILD_ARTIFACT_DIR:-}" ]]; then
  echo "##vso[task.logissue type=error]BUILD_ARTIFACT_DIR not set"
  exit 1
fi

PROJECT_KEY="${SONARQUBE_PROJECT_KEY:-loomweaver}"
OUTPUT_DIR="$BUILD_ARTIFACT_DIR"
AUTH_HEADER="Authorization: Bearer ${SONARQUBE_TOKEN}"
tmpdir="$(mktemp -d)"
trap 'rm -rf "$tmpdir"' EXIT

echo "SonarQube URL: $SONARQUBE_URL"
echo "Project Key: $PROJECT_KEY"
echo "Output Dir: $OUTPUT_DIR"

# --- Helper: authenticated curl with error logging ---

sonar_curl() {
  local url="$1"
  local http_code
  http_code=$(curl -s -o "$tmpdir/sonar_response.json" -w "%{http_code}" -H "$AUTH_HEADER" "$url")
  if [[ "$http_code" -ge 200 && "$http_code" -lt 300 ]]; then
    cat "$tmpdir/sonar_response.json"
    return 0
  else
    echo "  HTTP $http_code for: $url" >&2
    return 1
  fi
}

# --- Verify SonarQube API is reachable ---

echo "Verifying SonarQube API..."
if ! curl -sf "${SONARQUBE_URL}/api/system/status" > /dev/null 2>&1; then
  echo "##vso[task.logissue type=warning]Cannot reach SonarQube API, skipping result export"
  exit 0
fi

echo "Verifying authentication..."
AUTH_RESPONSE=$(sonar_curl "${SONARQUBE_URL}/api/authentication/validate" 2>&1) || {
  echo "##vso[task.logissue type=warning]SonarQube authentication endpoint unreachable, skipping result export"
  exit 0
}
if ! echo "$AUTH_RESPONSE" | jq -e '.valid == true' > /dev/null 2>&1; then
  echo "##vso[task.logissue type=warning]SonarQube token is invalid (authentication returned valid=false), skipping result export"
  exit 0
fi

# --- Fetch ALL issues from SonarQube API (paginated) ---

mkdir -p "$OUTPUT_DIR"

echo "Fetching all issues..."
echo "[]" > "$tmpdir/all_issues.json"
PAGE=1
TOTAL=0
while true; do
  RESPONSE=$(sonar_curl \
    "${SONARQUBE_URL}/api/issues/search?componentKeys=${PROJECT_KEY}&statuses=OPEN,CONFIRMED,REOPENED&s=SEVERITY&asc=false&ps=500&p=$PAGE") || {
    echo "##vso[task.logissue type=warning]Failed to fetch issues (page $PAGE)"
    break
  }
  TOTAL=$(echo "$RESPONSE" | jq '.paging.total // 0')
  ISSUES=$(echo "$RESPONSE" | jq '.issues // []')
  jq -s '.[0] + .[1]' "$tmpdir/all_issues.json" <(echo "$ISSUES") > "$tmpdir/merged.json"
  mv "$tmpdir/merged.json" "$tmpdir/all_issues.json"
  echo "  Fetched page $PAGE (total: $TOTAL)"
  FETCHED=$((PAGE * 500))
  if [[ $FETCHED -ge $TOTAL ]]; then break; fi
  PAGE=$((PAGE + 1))
  if [[ $PAGE -gt 20 ]]; then
    echo "  Stopping at page 20 (10000 issues max)"
    break
  fi
done

echo "Fetching quality gate status..."
QUALITY_GATE=$(sonar_curl \
  "${SONARQUBE_URL}/api/qualitygates/project_status?projectKey=${PROJECT_KEY}" 2>&1) || QUALITY_GATE='{"projectStatus":{"status":"UNKNOWN"}}'

echo "Fetching security hotspots..."
HOTSPOTS=$(sonar_curl \
  "${SONARQUBE_URL}/api/hotspots/search?projectKey=${PROJECT_KEY}&status=TO_REVIEW&ps=500" 2>&1) || HOTSPOTS='{"paging":{"total":0},"hotspots":[]}'

echo "Fetching project measures (coverage, duplications)..."
MEASURES=$(sonar_curl \
  "${SONARQUBE_URL}/api/measures/component?component=${PROJECT_KEY}&metricKeys=coverage,new_coverage,duplicated_lines_density,new_duplicated_lines_density,duplicated_lines,duplicated_blocks,duplicated_files,ncloc,lines" 2>&1) || MEASURES='{"component":{"measures":[]}}'

echo "Fetching duplicated files..."
echo "[]" > "$tmpdir/all_duplicated_files.json"
DUP_PAGE=1
while true; do
  DUP_RESPONSE=$(sonar_curl \
    "${SONARQUBE_URL}/api/measures/component_tree?component=${PROJECT_KEY}&qualifiers=FIL&metricKeys=duplicated_lines_density,duplicated_lines,duplicated_blocks&metricSort=duplicated_lines_density&metricSortFilter=withMeasuresOnly&asc=false&s=metric&ps=100&p=$DUP_PAGE" 2>&1) || {
    echo "##vso[task.logissue type=warning]Failed to fetch duplicated files (page $DUP_PAGE)"
    break
  }
  DUP_TOTAL=$(echo "$DUP_RESPONSE" | jq '.paging.total // 0')
  DUP_COMPONENTS=$(echo "$DUP_RESPONSE" | jq '[.components[] | select((.measures[] | select(.metric == "duplicated_lines_density") | .value | tonumber) > 0)]')
  jq -s '.[0] + .[1]' "$tmpdir/all_duplicated_files.json" <(echo "$DUP_COMPONENTS") > "$tmpdir/dup_merged.json"
  mv "$tmpdir/dup_merged.json" "$tmpdir/all_duplicated_files.json"
  echo "  Fetched duplication page $DUP_PAGE (total components: $DUP_TOTAL)"
  DUP_FETCHED=$((DUP_PAGE * 100))
  if [[ $DUP_FETCHED -ge $DUP_TOTAL ]]; then break; fi
  DUP_PAGE=$((DUP_PAGE + 1))
  if [[ $DUP_PAGE -gt 10 ]]; then
    echo "  Stopping at page 10 (1000 files max)"
    break
  fi
done

# Save raw JSON artifacts
jq '.' "$tmpdir/all_issues.json" > "$OUTPUT_DIR/issues.json"
echo "$QUALITY_GATE" | jq '.' > "$OUTPUT_DIR/quality-gate.json"
echo "$HOTSPOTS" | jq '.' > "$OUTPUT_DIR/hotspots.json"
echo "$MEASURES" | jq '.' > "$OUTPUT_DIR/measures.json"
jq '.' "$tmpdir/all_duplicated_files.json" > "$OUTPUT_DIR/duplications.json"

# --- Compute statistics ---

BLOCKERS=$(jq '[.[] | select(.severity == "BLOCKER")] | length' "$tmpdir/all_issues.json")
CRITICALS=$(jq '[.[] | select(.severity == "CRITICAL")] | length' "$tmpdir/all_issues.json")
MAJORS=$(jq '[.[] | select(.severity == "MAJOR")] | length' "$tmpdir/all_issues.json")
MINORS=$(jq '[.[] | select(.severity == "MINOR")] | length' "$tmpdir/all_issues.json")
INFOS=$(jq '[.[] | select(.severity == "INFO")] | length' "$tmpdir/all_issues.json")
HOTSPOT_COUNT=$(echo "$HOTSPOTS" | jq '.paging.total // 0')
QG_STATUS=$(echo "$QUALITY_GATE" | jq -r '.projectStatus.status // "UNKNOWN"')

# Extract measures (regular metrics use .value, new-code metrics use .period.value)
get_measure() { echo "$MEASURES" | jq -r ".component.measures[] | select(.metric == \"$1\") | .value // \"n/a\""; }
get_period_measure() { echo "$MEASURES" | jq -r ".component.measures[] | select(.metric == \"$1\") | .period.value // \"n/a\""; }
COVERAGE=$(get_measure "coverage")
NEW_COVERAGE=$(get_period_measure "new_coverage")
DUP_DENSITY=$(get_measure "duplicated_lines_density")
NEW_DUP_DENSITY=$(get_period_measure "new_duplicated_lines_density")
DUP_LINES=$(get_measure "duplicated_lines")
DUP_BLOCKS=$(get_measure "duplicated_blocks")
DUP_FILES=$(get_measure "duplicated_files")
NCLOC=$(get_measure "ncloc")
DUP_FILE_COUNT=$(jq 'length' "$tmpdir/all_duplicated_files.json")

# --- Generate Markdown summary ---

SUMMARY_FILE="$OUTPUT_DIR/summary.md"

{
  echo "# SonarQube — Entire Codebase"
  echo ""
  echo "> **Scope:** All accumulated issues and metrics across the entire codebase."
  echo "> The *SonarQube Publish Quality Gate* tab shows only the current analysis (new/changed code)."
  echo ""

  if [[ "$QG_STATUS" == "OK" ]]; then
    echo "**Quality Gate: PASSED**"
  else
    echo "**Quality Gate: $QG_STATUS**"
  fi
  echo ""

  echo "## Overview"
  echo ""
  echo "| Metric | Overall | New Code |"
  echo "|--------|--------:|---------:|"
  echo "| Coverage | ${COVERAGE}% | ${NEW_COVERAGE}% |"
  echo "| Duplications | ${DUP_DENSITY}% | ${NEW_DUP_DENSITY}% |"
  echo "| Lines of Code | $NCLOC | — |"
  echo ""

  echo "## Issues ($TOTAL)"
  echo ""
  if [[ $TOTAL -eq 0 ]]; then
    echo "No open issues."
  else
    echo "| Severity | Count |"
    echo "|----------|------:|"
    echo "| BLOCKER | $BLOCKERS |"
    echo "| CRITICAL | $CRITICALS |"
    echo "| MAJOR | $MAJORS |"
    echo "| MINOR | $MINORS |"
    echo "| INFO | $INFOS |"
  fi
  echo ""

  echo "## Security Hotspots ($HOTSPOT_COUNT to review)"
  echo ""
  if [[ $HOTSPOT_COUNT -gt 0 ]]; then
    echo "| Risk | Category | File | Line | Description |"
    echo "|------|----------|------|-----:|-------------|"
    echo "$HOTSPOTS" | jq -r '.hotspots[] |
      "| \(.vulnerabilityProbability) | \(.securityCategory) | \(.component | split(":")[1] // .component) | \(.line // "—") | \(.message) |"' || true
  else
    echo "No security hotspots to review."
  fi
  echo ""

  echo "## Duplications ($DUP_LINES lines in $DUP_BLOCKS blocks across $DUP_FILES files)"
  echo ""
  if [[ $DUP_FILE_COUNT -gt 0 ]]; then
    echo "| File | Density | Lines | Blocks |"
    echo "|------|--------:|------:|-------:|"
    jq -r '.[0:50][] |
      (.measures | map({(.metric): .value}) | add) as $m |
      "| \(.path // (.key | split(":")[1] // .key)) | \($m.duplicated_lines_density // "0")% | \($m.duplicated_lines // "0") | \($m.duplicated_blocks // "0") |"' \
      "$tmpdir/all_duplicated_files.json" || true
    if [[ $DUP_FILE_COUNT -gt 50 ]]; then
      echo ""
      echo "*Showing top 50 of $DUP_FILE_COUNT files.*"
    fi
  else
    echo "No duplicated files."
  fi
  echo ""

  for SEVERITY in BLOCKER CRITICAL MAJOR MINOR INFO; do
    COUNT=$(jq "[.[] | select(.severity == \"$SEVERITY\")] | length" "$tmpdir/all_issues.json")
    if [[ $COUNT -gt 0 ]]; then
      echo "---"
      echo ""
      echo "### $SEVERITY Issues ($COUNT)"
      echo ""
      jq -r "[.[] | select(.severity == \"$SEVERITY\")] | .[] |
        \"- [\(.rule)] \(.component | split(\":\")[1] // .component):\(.line // \"?\") — \(.message)\"" \
        "$tmpdir/all_issues.json" || true
      echo ""
    fi
  done

  echo "---"
  echo ""
  echo "*Artifacts: issues.json, hotspots.json, quality-gate.json, measures.json, duplications.json*"
  echo ""
  echo "*[Open SonarQube Dashboard](${SONARQUBE_URL}/dashboard?id=${PROJECT_KEY})*"

} > "$SUMMARY_FILE"

# --- Upload summary as Azure DevOps build tab ---

echo "##vso[task.uploadsummary]$SUMMARY_FILE"

# --- Console output ---

echo ""
echo "=== SonarQube Summary ==="
echo "Quality Gate: $QG_STATUS"
echo "Issues: $TOTAL (BLOCKER: $BLOCKERS, CRITICAL: $CRITICALS, MAJOR: $MAJORS, MINOR: $MINORS, INFO: $INFOS)"
echo "Security Hotspots to review: $HOTSPOT_COUNT"
echo "Coverage: ${COVERAGE}% (new code: ${NEW_COVERAGE}%)"
echo "Duplications: ${DUP_DENSITY}% ($DUP_LINES lines, $DUP_BLOCKS blocks in $DUP_FILES files) [new code: ${NEW_DUP_DENSITY}%]"
echo ""
echo "Results exported to: $OUTPUT_DIR"

# Signal to pipeline that artifacts are ready for publishing
echo "##vso[task.setvariable variable=SONARQUBE_EXPORT_SUCCESS]true"
