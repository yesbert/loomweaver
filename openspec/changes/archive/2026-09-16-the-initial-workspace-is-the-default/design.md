## Context

See proposal.md, *Why*. The workbench's own workspace has a fixed identifier. It is assumed in
several places independently: the initial value of the active workspace, the existence check, the
candidates for "has unapplied changes", the fallback after removing the active workspace, the reset
of every workspace, the guards against saving a baseline for or removing it, and the workspace
dialog, which draws it as the first row of the user's list and adds one to that list's count. The
declared start is found separately, as the first definition with `initial`, both where the active
workspace is resolved and where the opening is decided.

## Goals / Non-Goals

**Goals:**

- One function answers "which workspace is the default", given the definitions, and every place
  above asks it instead of naming the fixed identifier.
- Without a declared start, nothing observable changes.

**Non-Goals:**

- No new switch, option or declaration. `initial` carries the meaning.
- No migration of the arrangement a user built in the workbench's own workspace into the declared
  one. The declared one may already hold an arrangement of its own, and merging two would guess.
- No change to the opening rules: a declared start that names no content still leaves the address
  and the active workspace alone at an opening, as *A distribution may say where an opening starts*
  requires.

## Decisions

**`initial` is the default, not a new flag.** A distribution that says where the application opens
has said where "home" is, and a second declaration naming the same workspace would be a door beside
the existing one that can disagree with it. Rejected: `WorkspaceFeatures.builtInDefault: false`, which
leaves the fallback target undefined, and a separate `default: true` on a definition, which can name a
different workspace than `initial`.

**The fixed identifier stays reserved.** A definition may still not use it, so no stored record can
silently change meaning. With a declared start it simply names no existing workspace.

**A stored choice of the reserved identifier is read as the declared start.** Resolving the active
workspace maps it to the declared start before anything is scoped under it, and writes the mapped
value back, so the next read agrees. It is treated as a stored choice, not as a first visit, so the
opening behaves as it does for any returning user.

**The reset of every workspace resets the workbench's own workspace only where it exists.** With a
declared start, every workspace is a definition or a saved one and is already reached.

**The dialog asks the same function.** Its first row and the `+ 1` in the count are drawn only while
the default is the workbench's own workspace.

## Risks / Trade-offs

- [A distribution already declaring `initial` changes for its users] → marked BREAKING, named in the
  release notes; the arrangement left in the workbench's own workspace stays in storage untouched,
  so reverting the distribution brings it back.
- [A store that reads back asynchronously briefly reports the reserved identifier before the read]
  → the transient value becomes the default function's answer; adoption is still decided after the
  read, and the existing asynchronous-store tests cover it.
