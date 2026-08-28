> **Status:** proposed — not approved for implementation yet.

## Why

The workbench's search surface opens in two modes from two shortcuts: `mod+k` searches commands,
`mod+p` searches open work. To a screen reader they are the same thing. The dialog opens bare and
carries no title, so it has no accessible name at all, and the one named control inside it, the
search field, is labelled "Command palette" in both modes. A user who presses `mod+p` is told they
opened the command palette, and nothing they hear afterwards corrects it: the placeholder that
distinguishes the two modes is a placeholder, which a screen reader announces inconsistently and
which disappears the moment the user types.

The automated accessibility audit cannot see this. The field has a name, that name has sufficient
contrast, and its role and relationships are correct, so the audit passes. This is precisely the
limit the accessibility capability already states about its own audit: names, contrast, roles and
relationships are what a machine can check, and screen-reader sense is not.

It surfaced while giving quick open a visible entry point of its own. That change made the second
search a first-class thing on screen, which makes it more conspicuous that it is not one to a
listener.

## What Changes

- The search surface names itself for the mode it is in: searching commands and searching open work
  announce as two different things, both on the dialog and on the field inside it.
- The guarantee is stated so it can be tested, rather than left to the automated audit that
  structurally cannot catch it.

No breaking change, and no change to what either search does or how it is reached. The two
translation keys the modes need already exist and are already used for the modes' other text.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `accessibility`: gains a requirement that a surface appearing in more than one mode is named for
  the mode it is in, so that the name a screen reader announces describes what actually opened.

## Impact

Affected source:

- `platform/libs/core/shell/src/lib/commands/command-palette.html` — the field's accessible name is
  hard-coded to the command-search title regardless of mode.
- `platform/libs/core/shell/src/lib/commands/command-palette.ts` — the mode is already a signal
  here, so the name has something to derive from.
- `platform/libs/core/shell/src/lib/shell-seeds.ts` — the two commands that open the search open it
  without a title, which is why the dialog is unnamed. They are the only two of the shell's six bare
  dialogs that do this; the other four already pass one.

Not affected: `platform/libs/core/shell/src/lib/dialog/dialog-outlet.html`. It is named here only
because its behaviour is what makes the call-site fix work — a bare dialog uses its title solely as
an accessible name and draws no heading from it, so naming these two costs nothing visually.

Legacy sources dissolved by this change: none.

Related: found during `the-workbench-shows-its-shortcuts`, which gave the search over open work its
own visible entry point. That change is not a prerequisite and this one does not depend on it.
