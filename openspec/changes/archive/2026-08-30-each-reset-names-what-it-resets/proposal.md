> **Status:** approved.

## Why

Two different commands are labelled the same. `appReset.action` and `workspace.reset` are
byte-identical in both shipped languages, "Reset layout" and "Layout zurücksetzen", and they name
`shell.app.reset` and `shell.workspace.reset`. A user who presses the button under Settings runs one;
a user who picks the same words in the command search runs the other.

The two differ in exactly the way that matters. The app reset puts back the curated activity bar,
collapsed sidebars, sidebar widths and named view instances, and says so in its confirmation. The
workspace reset returns the active workspace to its baseline, which for a distribution that declared
none can leave the content area with nothing in it.

On top of that, one command carries two names of its own: `shell.app.reset` is "Reset app layout" in
the command search and in its confirmation, and "Reset layout" on the Settings button. A second label
for one command is, to the person reading it, indistinguishable from a second command.

This was reported from outside, by a team building a distribution on 0.7.6. It cost them a wrong
diagnosis: a reported "reset empties the window" was reproduced against the wrong command twice,
because the button they were pointed at and the palette entry they drove carry the same name. The
behaviour is correct and documented; only the labelling is wrong.

## What Changes

- Each reset names what it resets. `shell.app.reset` is "Reset app layout" wherever it is offered,
  including the Settings button that says "Reset layout" today. `shell.workspace.reset` becomes
  "Reset workspace layout" (de: "Workspace-Layout zurücksetzen"), so the short, general wording
  belongs to neither.
- A repository check fails when two commands the shell registers resolve to the same name in any
  language it ships, or when one command is labelled two different ways. The defect is invisible when
  reading the code, because the two strings sit in different files under different keys, and it is
  expensive when using the product. A check is the only thing that stops it recurring.
- `commands` gains the requirement that this rests on, because the contract does not state it today:
  it says commands are findable and listed by their translated name, and nothing about two of them
  being told apart.
- One stray German term is corrected in the same pass: `appReset.confirm` says "Arbeitsbereiche"
  where every other German string in the shell says "Workspace".

**No key is removed.** `appReset.action` keeps existing and is reworded. A product may override any
shipped string through the translation-override mechanism, so deleting a key would silently drop a
consumer's override, and the project's rule is that a removal is announced loudly rather than made
quietly.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `commands`: adds the requirement that two commands a user can reach are told apart by their names,
  and that one command presents one name wherever it is offered.

## Impact

- `platform/libs/core/shell/src/lib/i18n/en.json` and `de.json` — `appReset.action`,
  `workspace.reset`, and the stray term in `appReset.confirm`.
- `platform/libs/core/shell/src/lib/shell-seeds.ts` — the workspace reset's confirmation title comes
  from the same key and follows it; no code change is expected beyond what the strings imply.
- `platform/tools/` — a new check, and its entry in `platform/package.json` and the build workflow.
- Tests pinning both halves: that the two resets present different names, and that one command
  presents one name.

Not affected: behaviour. Neither command changes what it does, and no API changes.

Legacy sources dissolved by this change: none.
