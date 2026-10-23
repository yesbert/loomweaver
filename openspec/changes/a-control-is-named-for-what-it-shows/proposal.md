> **Status:** approved.

## Why

NextPA reported on 2026-10-22 (finding F-055) that several controls the workbench draws show words their
accessible name does not contain. WCAG 2.5.3 *Label in Name* is a level A criterion: a person who
operates by speech says what they see, and the command does not reach a control whose name says
something else. axe-core 4.14 applies the rule `label-content-name-mismatch` by default (it was
experimental up to 4.13), and every NextPA screen fails it because of the workbench's own chrome.

The accessibility capability already requires the chrome to meet WCAG 2.1 Level AA, so this is a
defect, not a missing requirement. Our audit missed it because it still runs on axe-core 4.12.1, where
the rule did not count. With 4.14 it fails 20 of the testbed's 26 audit runs, every one of them on this
rule alone.

## What Changes

Each of these controls gets a name that contains what it shows, with the words it shows first and its
purpose after them:

- A rail entry and a bar entry drawn with initials: "NR, Account" instead of "Account".
- The command palette entry and the quick open entry, which show their shortcut: the name carries the
  shortcut as the menu rows already do ("Command palette ⌘K"), and the control announces it as its
  keyboard shortcut.
- The view switcher, which shows the active view's name: "Default, Saved views" instead of "Saved views".
- A menu heading that leads to a command: "Norbert Rosenwinkel, Profile" instead of "Profile".
- A content tab with a badge: the title and the badge are separate words in the page, so the badge no
  longer runs into the title ("ExportNew") for anything that reads the drawn text.
- A declared bar button with both a visible label and a tooltip: its name starts with the label. Today
  the tooltip replaces the label as the name, a trap every product falls into.
- A declared bar button that shows a shortcut carries the shortcut in its name, like the entries above.

The automated audit moves to axe-core 4.14, so the rule is part of the check from now on.

Nothing in the published contract changes shape. Ships as a patch.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `accessibility`: the WCAG 2.1 AA requirement states explicitly that a control's accessible name
  contains the words and the shortcut it shows, beginning with the words, and that the audit applies
  the rule that checks it.

## Impact

- Shell chrome: the rail, the bar entry, the search entries (command palette and quick open), the view
  switcher, the menu heading, the content tab strip.
- The JSDoc of a bar button's `tooltip`, which today says only that it falls back to the label.
- The end-to-end audit and its dependency on axe-core; unit tests for each name.
- NextPA finding F-055. After the release NextPA drops the two-pass workaround in its audit.
