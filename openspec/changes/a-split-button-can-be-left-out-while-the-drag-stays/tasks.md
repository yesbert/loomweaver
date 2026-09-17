## 1. The declared form

- [ ] 1.1 In `platform/libs/core/shell/src/lib/foundation/shell-features.ts`, let
  `ContentFeatures.splitRight` and `splitDown` take `boolean | { readonly button?: boolean }`, with
  JSDoc naming the routes and the three handles.
- [ ] 1.2 Normalise the declaration where it enters, in
  `platform/libs/core/shell/src/lib/foundation/merge-shell-features.ts`, so every reader inside the
  shell still sees a boolean for the capability and a separate answer for the button.
- [ ] 1.3 Test: a partial override in the finer form leaves its neighbours in the group alone, and a
  runtime change with a boolean sets the capability without disturbing the declared button decision.

## 2. The button

- [ ] 2.1 `pane-view.ts` and `content-area.ts` ask whether the split button is drawn, beside asking
  whether the capability is on.
- [ ] 2.2 Test: with the finer form, no pane toolbar draws a split control, while dragging a tab to
  a pane's edge still splits and the shortcut still works.
- [ ] 2.3 Test: with the capability switched off, the button, the drop edges, the shortcut and the
  menu entry are all gone, whichever form the declaration used.

## 3. The written contract

- [ ] 3.1 `llms-full.txt`: the feature-switch section states the finer form and, beside it, the three
  handles for splitting (the switch, `omit` by bare id for a command, `menu:<commandId>` for an
  entry).
- [ ] 3.2 `platform/libs/tooling/devkit/src/recipes/angular-distribution/readme.ts`: the generated
  note says the same, since it is where it says a switch takes the affordance and the gesture.
- [ ] 3.3 Run `openspec validate --all --strict`, the shell unit suite and the repository's guards,
  then reconcile this change's artifacts with what was built.
