> **Status:** approved.

## Why

The SonarQube quality gate has failed on every run since at least 2026-09-30, on one condition: 43
new violations where the gate wants none. It gates no merge, so nothing stopped; but a gate that is
always red tells nobody when something new arrives, and the 0.15.0 release was checked against it by
reading the list by hand. The rule here is that a finding is fixed in code or excluded in the
versioned configuration with its reason, and that an exclusion stops the finding from appearing.

Reading the 43 shows that eight of them are exactly that rule failing quietly: exclusions that name
a file by its path, and the file has since moved.

## What Changes

Nothing a consumer can observe. The 43 findings are worked in four groups:

- **Exclusions that lost their file (8).** `iframe-surface.ts` moved under `surface/` and
  `command-palette.html` under `palette/`, so the exemptions for the deliberate sanitisation bypass
  (S6268) and for the palette's listbox pattern (S6819, S6842, the mouse-event rule) match nothing.
  The paths are corrected, and the exemption for the spinner's template, deleted in 0.15.0, is
  removed.
- **Tests without an assertion (7, blocker).** `translations-under-the-base.spec.ts` asserts through
  the HTTP testing controller's `expectOne`, which the rule does not count as an assertion. Each
  test gains an explicit expectation on the request it matched.
- **Code findings (22).** Duplicate imports of one module (12), a nested ternary, two uses of
  `void`, two redundant `undefined` types, two needless assertions, an inverted comparison, an empty
  class, and an asynchronous call in a constructor. Each is fixed where it stands.
- **Testbed markup (6).** An empty heading, two labels without a control, a redundant word in an
  `alt`, and two buttons with a click handler; the last pair is the `<lw-button>` element, which
  handles the keyboard itself, and is excluded with that reason.

So that this does not recur: a check that every path named in the Sonar exclusions exists.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. No requirement changes; `skip_specs` is set.

## Impact

- `platform/sonar-project.properties`.
- `platform/libs/core/shell/src/lib/i18n/translations-under-the-base.spec.ts`.
- Seventeen source files across `platform/libs/core/shell`, `platform/libs/tooling/cli`,
  `platform/apps/loom-testbed` and `platform/libs/weavers/testbed-weaver`, named in the tasks.
- `platform/tools/checks/`: the new check, its entry in `package.json`, the merge pipeline and
  `docs/reference/operations.md`.
- No legacy source is dissolved.
