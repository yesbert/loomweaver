> **Status:** approved — approved for implementation on 2026-10-06.

## Why

Five demo views draw a button of their own for an action that is already a registered command:
create a customer, run payroll, start a dunning run, count stock, receive goods. Each button calls the
module's helper directly, so the command, its shortcut, its access requirement and the palette entry
are one thing and the button is a second. The platform's answer is a surface action naming the
command: drawn in the pane header, gated by the same rule as every other control, and since the
toolbar change, a slot other plugins can add to. The demo is where a reader sees how a product should
do it, and today it shows the other way.

This is a design call as much as a cleanup: a labelled primary button in the body becomes an icon
action in the header, which reads differently. That is why it is its own change.

## What Changes

- The five surfaces declare their action as a surface action naming the existing command, with the
  icon and title the command carries.
- The hand-built button and the component method behind it are removed from each view.
- The demo's end-to-end checks that pressed the old buttons press the header action instead.
- Where a primary action needs more prominence than an icon in the header gives it, the decision is
  recorded in the design note per view, rather than keeping the duplicate.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. The demo uses what the platform already guarantees; the change sets `skip_specs`.

## Impact

- Demo: five views, their surface registrations, and the end-to-end checks that touch them.
- Runs on the published 0.16.0 packages, which already carry surface actions naming a command.
