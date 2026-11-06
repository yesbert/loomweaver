> **Status:** approved.

## Why

Formatted text a plugin supplies is sanitised against scripts, event handlers and script-bearing
links, and that is all. A style sheet or a `style` attribute survives, and so do classes that the
workbench's own stylesheet defines, so a plugin's text can draw a box over the whole workbench, and so do forms, so it can draw a password field that posts wherever it likes. Neither
executes anything, and both are ways to make the user believe the workbench is asking.

The form an address takes is described in the published contract and the guides — values decoded,
paths in the address's encoded form — and pinned by tests, but no specification states it. A
plugin builds addresses from values every day; the rule it relies on belongs in the contract.

## What Changes

- Formatted text a plugin supplies loses every style sheet, every `style` and `class` attribute and
  every form control (the form
  itself, its fields, buttons, options, labels and field groups, and the attributes that name a form
  or where it posts). Headings, lists, links, code and images render as before, remote images
  included. **BREAKING** for a plugin whose formatted text relied on inline styles, classes or form markup.
- The address form becomes a guarantee: parameters are read decoded, every path is in the address's
  encoded form, and a segment written with an encoding of its value stays one segment and opens one
  tab. No code changes for this; the behaviour exists and is tested.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `ui-primitives`: formatted text a plugin supplies carries no style attribute and no form control.
- `routing`: values in an address are read decoded and paths keep the address's encoded form.
