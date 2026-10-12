> **Status:** approved.

## Why

NextPA reported on 2026-10-12 (finding F-050) that its assistant knowledge card shows two choices that
exclude each other, and the one that is unavailable has to say why, reachable by keyboard and
announced. A natively disabled control leaves the tab order, so a keyboard or screen reader user never
reaches it and never hears the reason. The accessible pattern marks the control as unavailable while
keeping it focusable and ties the reason to it.

The workbench's class contracts for a switch, a radio and a checkbox draw only the native disabled
state. A control marked unavailable the accessible way looks available, so every consumer adds its
own utilities to fade it, and each does it at a slightly different strength. The button's class
contract already draws both states alike; the three choice controls do not.

## What Changes

- The switch, radio and checkbox class contracts draw a control marked unavailable while staying
  reachable exactly as they draw a natively disabled one.
- The control stays focusable; the workbench changes the look only. Refusing the change remains with
  whoever owns the control, because a style cannot stop a native input from toggling.
- The brief says which of the two to use when: natively disabled where there is nothing to say, marked
  unavailable with a described reason where there is.
- `ui-primitives` gains a requirement for it.

No API change; ships as a patch.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `ui-primitives`: a native choice that is unavailable but must stay reachable takes the workbench's
  unavailable look.

## Impact

- The shell's control class contracts (switch, radio, checkbox), in both the Tailwind path and the
  pre-compiled stylesheet, and the frame kit's copy for isolated surfaces.
- `llms-full.txt`, "Weaver body primitives", and the design token reference.
- The testbed's Info view and its strings.
- A testbed e2e test.
- NextPA finding F-050.
