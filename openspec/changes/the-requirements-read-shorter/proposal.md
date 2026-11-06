> **Status:** approved.

## Why

Since OpenSpec 1.16, `openspec validate --all --strict` warns about every requirement whose text is
longer than 500 characters, and 159 requirements across 25 capabilities are. The run fails, so the
check the repository asks for before handing anything over no longer says anything.

## What Changes

- Each long requirement is shortened to the behaviour it states. Examples and edge cases move into
  scenarios, and a requirement that states several behaviours is split so that each states one.
- No guarantee is added, dropped or weakened. Every SHALL, SHALL NOT and MAY stays, every existing
  scenario keeps its title, and no requirement is renamed.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. The texts change, the guarantees do not, so the change carries no delta and edits the
capabilities in place.

## Impact

`openspec/specs/` only. `openspec validate --all --strict` passes again.
