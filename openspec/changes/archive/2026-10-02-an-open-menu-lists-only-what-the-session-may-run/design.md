## Context

`MenuService.open` resolves a slot against every registered command; `MenuService.offers`, added in
0.15.0, resolves against the commands `CommandService.available` admits. `available` is the rule the
palette uses: the session meets the command's access requirement, and in a pop-out the command
declares `popout`. Running a refused command from a menu ends in `CommandService.execute`, which
returns after a development warning.

## Goals / Non-Goals

**Goals:** one list of usable commands behind both the emptiness check and the open menu.

**Non-Goals:**

- A disabled look for a refused entry. A command has no "shown but inoperable" mode; only a
  contribution has, and a menu entry declares no access of its own.
- An `access` field on a menu entry. Nobody has asked for one, and the command already carries it.
- The workbench's own list menus (tabs a strip cannot show, view instances). They are not resolved
  from commands.

## Decisions

**Filter the commands, not the entries.** Both callers hand `resolveMenuItems` the same filtered
command list, and an entry whose command is missing from it is already dropped by the resolution.
The alternative, a second filter over resolved entries, would repeat the rule the resolution has.

**The heading follows the same list.** A heading that leads to a refused command stays as a heading
and stops being an entry, which is what happens today when the command is not registered.

**Checked state and shortcuts are unaffected.** They are read from the entries that remain.

## Risks / Trade-offs

- [A menu a signed-out user could open and read is now shorter or absent] → that is the intent; the
  release notes name it, and the guide says an entry follows its command's access.
- [A distribution's own menu on host chrome loses entries in a pop-out] → only commands that never
  ran there; the pop-out guide already says which commands a pop-out offers.
