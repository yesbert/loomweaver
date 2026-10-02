## 1. Pin it

- [ ] 1.1 `popout-view` spec: a surface with an action shows it above the body; one without shows no bar; an action naming a command without `popout` is absent, one with inline behaviour is present
- [ ] 1.2 Testbed fixture: an action on the search surface whose command declares itself suitable for a pop-out, beside the present ones that do not
- [ ] 1.3 End to end in the testbed: pop out the search surface, see that action and not the others, run it
- [ ] 1.4 Run them and see them fail on the current code

## 2. Build

- [ ] 2.1 `lw-surface-actions`: in a pop-out an action naming a command is offered only when the command is available there
- [ ] 2.2 `popout-view`: the actions in a bar above the body, absent without a button
- [ ] 2.3 `docs/weaver/content-area.md`, the pop-out guide and `llms-full.txt`

## 3. Verify

- [ ] 3.1 The full shell suite, lint, `nx package shell`, the docs checks
- [ ] 3.2 The accessibility scan over a pop-out with actions
- [ ] 3.3 The full end-to-end suite, including the distribution served under a path

## 4. Close

- [ ] 4.1 `openspec validate --all --strict`
