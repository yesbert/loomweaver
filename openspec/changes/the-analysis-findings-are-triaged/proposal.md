> **Status:** proposed — not approved for implementation yet.

## Why

The move to GitHub carried the static analysis across, and in carrying it across it was found to be
an ornament: the workflow uploaded the analysis and finished, so it was green whatever the server
concluded. That is now fixed. The scanner waits for the quality gate, and the gate says what it has
presumably been saying for a while: 83 open findings and 3 unreviewed security hotspots.

Nobody has decided anything about those 83. They are not a backlog that was weighed and deferred,
they are a list nobody read. This change is the reading.

The findings are 2 BLOCKER, 15 CRITICAL, 13 MAJOR and 53 MINOR, spread over 27 rules. They are not
homogeneous, and the temptation this change exists to resist is treating them as if they were.
Sampling three of them already shows all three outcomes:

- `pane-view.ts` imports from `./tree/pane-address` on line 2 and again on line 6. Sonar is right,
  the fix is to merge the two lines, and 24 of the 83 findings are that same rule in 12 files.
- `transloco-loader.spec.ts:105` and `cross-tab-sync.spec.ts:67` are test cases with no assertion.
  A test that claims nothing cannot fail. Both BLOCKERs are this, and both are real.
- `workspace-definition.ts:242` and `hidden-views.service.ts:66` are told to sort with
  `localeCompare`. Both sort ASCII view identifiers to produce a canonical string for storage.
  Applying the advice would make the persisted form depend on the browser's language. Sonar is
  right about the rule and wrong about the case, and following it here would introduce a bug.

## What Changes

- Every one of the 83 findings and 3 hotspots is triaged into exactly one of three outcomes:
  **fix it**, **exempt it with the reason written beside the exemption**, or **raise it as its own
  defect change** against the guarantee it violates.
- The fixes land in slices grouped by rule family, so each is reviewable on its own.
- Exemptions go into `platform/sonar-project.properties` in the form that file already uses: one
  named criterion per file, with the reasoning in a comment above it. The ten exemptions there today
  are the model, and they are also the evidence that this survives the analysis: none of the files
  they cover appear in the 83.
- No rule is disabled wholesale, and no finding is closed in the Sonar interface as "won't fix".
  A decision that lives only on the server is a decision the repository cannot show a reviewer.
- The 3 security hotspots are reviewed in Sonar, which is the only place that state exists.

Two things this change deliberately does not do. It does not touch `.github/workflows/sonar.yml`,
which is correct as it stands. And it does not set the new-code baseline on the Sonar server: that
is an operator action on `sonar.stratara.tech`, it is recorded in the tasks so it is not forgotten,
and it is what decides whether the gate is green at the end of this or merely honest.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. Every finding sampled so far is internal: a duplicated import, a missing assertion, a function
too tangled to read. None of it is a guarantee a consumer could notice, so no capability changes and
`.openspec.yaml` sets `skip_specs: true`.

This holds unless triage says otherwise. If a finding turns out to break something a capability
already promises, that is a defect and not tidying: it leaves this change and gets its own, naming
the requirement it fails and pinning it with a test. Sort order was checked for exactly this reason
and no capability states anything about it.

## Impact

- `platform/libs/core/shell` carries most of the findings, concentrated in `regions/pane`,
  `regions/content` and `plugin/sandbox`.
- `platform/libs/integrations/ag-ui/src/lib/command-tools.ts` carries all four `S6551` findings.
- `platform/libs/tooling/devkit`, `platform/libs/tooling/cli` and `platform/libs/tooling/mcp`
  carry one complexity finding each and a handful of style findings.
- `platform/apps/loom-testbed/public/sandbox-rpc/view.js` carries the two JavaScript findings, in a
  file no unit test can import because it runs inside the sandbox iframe.
- `platform/apps/loom-testbed-e2e` and `platform/libs/core/shell/src/lib/i18n` carry the two
  assertion-less tests.
- `platform/sonar-project.properties` gains whatever exemptions triage justifies.
- The Sonar project `loomweaver` on `sonar.stratara.tech`: hotspot review state, and the new-code
  baseline.
