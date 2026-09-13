## 1. An action carries a toggle state

- [x] 1.1 Give the action shape an optional on/off state, documented on the published contract as
      what the workbench draws as the pressed state, with the note that it is absent for a plain
      button.
- [x] 1.2 Draw the state in the panel header and in the pane tab strip as `aria-pressed`, set only
      when the action declares one, and let the shared icon-button style take its pressed look from
      that attribute, the way the segmented control does.
- [x] 1.3 Unit tests on the panel header and the tab strip: on is announced pressed, off is announced
      unpressed, no state sets no attribute.

## 2. An action can be replaced while the surface is mounted

- [x] 2.1 Let a plugin replace one action of a surface it registered, upserting by action id on the
      entry the registry already holds, ordered as the action's order says, under the contributions
      permission; an unknown surface id changes nothing.
- [x] 2.2 Unit tests: the panel header shows the replaced title, the registry entry carries the
      replaced icon and nothing else changes; the mounted surface is not rebuilt; an id the surface
      did not carry is added in order; an unknown surface id does nothing; the call needs the
      contributions permission.
- [x] 2.3 Unit test that a toggle flips its announced state when replaced with the opposite state,
      without the surface being rebuilt.

## 3. Saying it exists

- [x] 3.1 The call and the field in the published brief, beside the action shape and the rename.
- [x] 3.2 The call and the field in the consumer documentation on sidebar surfaces, beside the
      actions example, with a toggle as the example; and one sentence in the sandboxed-surfaces
      guide saying that a sandboxed surface carries no actions, which the code does and no guide
      says.
- [x] 3.3 `openspec validate --all --strict`, lint, and the shell and plugin-sdk unit suites green.
