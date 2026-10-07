> **Status:** approved.

## Why

NextPA found in 0.14.6 (finding F-043) that the workbench's skip link reloads the application at
every address below the root. The link is a plain fragment, `#lw-main-content`, and every
distribution carries a base of `/` because the router needs one. A fragment is resolved against the
base, not against the current address, so at `/assistants` the link points at `/#lw-main-content`,
which is another document. Following it loads the application again, discards whatever the person
had not saved, and leaves the focus on the document body, so the next Tab lands on the skip link
once more.

This fails the requirement *The workbench meets WCAG 2.1 Level AA* (accessibility), whose criterion
2.4.1 asks for a way to bypass blocks that repeat on every page. The testbed's case passes because it
runs at the one address where base and address coincide.

The skip link itself is promised only by `docs/reference/accessibility.md`. A promise a person can
notice belongs in the contract, so the change states it there.

## What Changes

- **The skip link handles its own activation.** Activating it moves the focus to the working area
  and does not navigate. The address, the arrangement and any unsaved work stay as they were.
- A requirement in `accessibility` that says so, with the case that broke: an address below the
  root.
- The testbed case runs at an address below the root and asserts that no document load happens and
  that the focus lands in the content. It fails on 0.17.0.

No new call, option or type.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `accessibility`: a requirement that the first tab stop is a way past the chrome that keeps the
  person on the page, at every address.

## Impact

- `platform/libs/core/shell/src/lib/shell.html` and `platform/libs/core/shell/src/lib/shell.ts`: the
  link's activation.
- `platform/libs/core/shell/src/lib/shell.spec.ts`: the regression test in the merge gate.
- `platform/apps/loom-testbed-e2e/src/chrome.spec.ts`: the browser case at an address below the
  root, in the nightly suite.
- `docs/reference/accessibility.md`: the skip link is described as the contract now states it.
- NextPA finding **F-043**. Once a release carries this, NextPA removes `provideSkipLinkRepair`.
- Behaviour change without an API change. Ships as a patch.
