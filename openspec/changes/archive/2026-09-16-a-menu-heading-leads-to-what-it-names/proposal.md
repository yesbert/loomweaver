> **Status:** approved.

## Why

An account menu names the signed-in person in its heading: the picture, the name, the address. In
almost every application a click on that heading opens the person's profile, and users expect it.
The workbench rules that out today: the heading is not an entry, cannot be focused and cannot be
activated. A product therefore adds a "Profile" entry directly below a heading that already shows the
same person, which reads as a duplicate and behaves unlike every other application.

NextPA found this reviewing its account menu (finding F-022). The rule behind it was deliberate: the
name is announced once and the keyboard reaches the first entry directly. Both goals can be kept for
a heading that leads somewhere.

## What Changes

- A menu heading may name a command, the same way a menu entry names one. The command runs with the
  menu's context.
- A heading with a command is the menu's first entry: it is reached first by the keyboard, it is
  activated by a click, Enter or Space, it closes the menu like any entry, and it looks like an entry
  under the pointer and in focus.
- The name is still announced once. The menu keeps being announced by what the heading names, and
  the heading as an entry is announced by what its command does, not by the name a second time.
- A heading naming a command that nothing registers, or that the distribution removed, stays a plain
  heading, as an entry naming such a command is not drawn.
- A heading without a command behaves exactly as today.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `menus`: the requirement *A menu opened from a control may name what it was opened against* today
  says the heading is never an entry. It is modified so that a heading naming a command that can run
  becomes the menu's first entry, with the rest of the requirement unchanged.

## Impact

- `platform/libs/core/plugin-sdk/src/lib/menu.ts`: the menu heading gains an optional command.
- `platform/libs/core/shell/src/lib/menu/menu.service.ts`: draws a heading with a runnable command as
  an entry, runs it on selection, and opens a menu whose only entry is such a heading.
- `platform/libs/core/shell/src/lib/styles/theme.css`: the heading's pointer and focus states.
- `docs/weaver/menus.md`, `docs/samples.md` where the account menu is shown, and `llms-full.txt`.
- The demo's account menu uses it, so it can be seen in the running application.
- NextPA's `loomweaver-findings.md` marks F-022 fixed once a release carries this; that happens in a
  NextPA session, not here.

No legacy source is dissolved by this change.
