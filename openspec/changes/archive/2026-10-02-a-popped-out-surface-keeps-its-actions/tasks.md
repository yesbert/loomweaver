## 1. Pin it

- [x] 1.1 `surface-actions.spec.ts`, in a detached window: an action naming a command without `popout` or an unregistered one is absent, one with `popout` and one with inline behaviour are present. The bar above the body and its absence are pinned end to end
- [x] 1.2 Testbed fixture: an action on the search surface whose command declares itself suitable for a pop-out, beside the present ones that do not
- [x] 1.3 End to end in the testbed: pop out the search surface, see that action and not the others, run it
- [x] 1.4 The end-to-end case fails on the old code by construction: the pop-out drew no actions at all

## 2. Build

- [x] 2.1 `lw-surface-actions`: in a pop-out an action naming a command is offered only when the command is available there
- [x] 2.2 `popout-view`: the actions in a bar above the body, absent without a button
- [x] 2.3 `docs/weaver/content-area.md`, the pop-out guide and `llms-full.txt`

## 3. Verify

- [x] 3.1 The full shell suite, lint, `nx package shell`, the docs checks
- [x] 3.2 The accessibility scan over a pop-out with actions
- [x] 3.3 The full end-to-end suite, including the distribution served under a path

## 4. Close

- [x] 4.1 `openspec validate --all --strict`
