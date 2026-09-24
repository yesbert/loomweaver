## 1. Tests first

- [x] 1.1 Dialog tests: a dirty body's request asks the close control's question; cancel keeps the dialog and resolves `false`; discard closes and resolves `true`; a clean body closes at once and resolves `true`; save closes after a successful save and stays open where it fails; a failed veto keeps it open; a dialog allowing no way still handles the request; a second request while the question is open does not ask twice; focus returns to the opener
- [x] 1.2 SDK test: a bare handle's request closes and resolves `true`

## 2. Implementation

- [x] 2.1 `plugin-sdk`: `DialogRef.requestClose()` and the optional close request it delegates to, with JSDoc
- [x] 2.2 The outlet's dismissal returns its outcome and shares an open question; the service constructs each handle with a request that reaches the outlet by the dialog's id

## 3. Close

- [x] 3.1 `docs/weaver/unsaved-changes.md`, `docs/weaver/host-ui-and-facts.md`, `llms-full.txt`
- [x] 3.2 Shell and SDK lint and tests, packaging, the repository guards (bundle size included), `openspec validate --all --strict`
- [x] 3.3 Code review, then archive on the same branch
