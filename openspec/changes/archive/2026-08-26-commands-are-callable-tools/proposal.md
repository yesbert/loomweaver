> **Status:** approved.

## Why

A command is already the workbench's one stable anchor for an action: a button, a keystroke and a
palette entry all point at the same identity, and one seam decides whether it may run. Everything an
automated caller needs is therefore almost there, except that a command takes no arguments, answers
nothing, and cannot be triggered by anyone but the workbench itself.

That gap forces any plugin that wants to offer the workbench's actions to something else — an
assistant driving the application, a script, a second plugin — to build a second registry beside the
first: its own list of actions, its own descriptions, its own dispatch, and its own idea of who may
run what. Two registries mean two answers to "may this run", and the one the user can see and revoke
is not the one that decides.

Products built on the platform are heading there now. Closing the gap in the command seam keeps the
answer singular: the actions an automated caller may reach are the actions the user could reach, by
the rules the user can already inspect and withdraw.

## What Changes

- A command MAY declare the arguments it accepts, in a described, enumerable form, and MAY answer
  with a result. Both are plain data, so they survive the sandbox boundary unchanged.
- A command MAY carry a description written for a reader that is not looking at the screen, separate
  from the translated title the workbench draws.
- A command declares whether it may be invoked by a caller other than the plugin that registered it.
  The default is that it may not.
- A plugin MAY invoke a command by its identity and receive its result, subject to a new coarse
  capability. The invocation runs through the one existing seam, so access gating, refusal
  reporting, failure handling and the detached-window rule apply unchanged.
- The workbench can enumerate the commands available to such a caller, already narrowed by that same
  seam: what the session qualifies for, what the surrounding window allows, and what the calling
  plugin has been granted.
- A caller that names a command it may not reach is refused in the way a refusal is already
  surfaced, rather than receiving silence.

No vocabulary from any agent or assistant protocol enters the platform. The platform gains the shape
an automated caller needs; what such a caller is, and which protocol it speaks, stays outside.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `commands`: a command may accept described arguments and answer with a result; a command declares
  whether a foreign caller may invoke it, defaulting to no; invoking by identity is added to the one
  seam every trigger already runs through, and the set of commands reachable by a foreign caller can
  be enumerated.
- `plugin-permissions`: the coarse capability set gains one entry covering invocation of commands
  the calling plugin does not own, revocable like the others.

## Impact

- `@loom/plugin-sdk` — `platform/libs/core/plugin-sdk/src/lib/command.ts` (argument declaration,
  result, machine-readable description, foreign-caller flag), `capability.ts` (the added capability),
  `plugin.ts` (invocation and enumeration on the plugin context). All additive; nothing registered
  today changes meaning.
- `@loom/shell` — the command registry and the single execution seam, the capability broker that
  routes and gates the new context members, and the permissions settings surface that must list the
  added capability.
- Sandbox transport — the invocation and its answer cross the plugin boundary, so both are
  constrained to structured data.
- `@loom/devkit` and `@loom/cli` templates, and the `scaffold_*` tools in `@loom/mcp`, so a newly
  generated plugin carries the fields in place rather than retrofitting them.
- `docs/` — a plugin-author guide covering the chain from declaring arguments to what the user sees
  in the permissions surface, and the JSDoc on the published contract that explains why the default
  is the quiet one.
- No dependency is added. No legacy source is dissolved by this change.
