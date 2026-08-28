> **Status:** approved.

## Why

The permissions surface tells the user that a plugin running **in the application's own JavaScript
context** cannot reach the application. Under every trusted, in-process plugin it prints the isolated
plugin's line — *"it cannot reach this application, its storage or your session"* — which is not a
rough approximation but the exact opposite of the truth, printed in the one place a user goes to find
out what software is allowed to do to them.

The cause is a default doing work it was never meant for. A frame plugin that names no level runs
isolated, which is the right default for a frame plugin. The surface asks that same question about
every plugin, and a trusted one is never in the answer's book, so it receives the default — and the
default is the reassuring one.

The contract already forbids the same mistake one rung over: of an **embedded** frame plugin it says
the workbench shall not claim the plugin is held back from the hosting application. Nobody wrote the
sentence for the trusted rung, which is why nothing caught it. That is the
second half of the change: a statement the user is invited to rely on belongs in the contract, not in
whatever a template happened to render.

## What Changes

- The permissions surface SHALL state the rung a plugin actually runs at, and SHALL NOT describe a
  trusted, in-process plugin as isolated.
- A plugin whose rung is not one the isolation vocabulary covers SHALL be described in its own terms
  — what it is, not the nearest neighbour.
- The guarantee is written down, so the surface can no longer be silently wrong.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `plugin-permissions`: gains a requirement that what the surface says about a plugin's isolation is
  true of that plugin. The capability already governs what the surface offers and refuses; it did not
  yet govern what it asserts.

## Impact

- The permissions settings surface, and the question it asks about a plugin's level — today answered
  from a book that only frame plugins are written in.
- The strings behind that note: a trusted rung has none today, in either language.
- `openspec/specs/plugin-permissions/spec.md` — one added requirement.
- No published type changes. The distribution's composition already says which rung a plugin is on;
  nothing new has to be declared.

Nothing is dissolved: no decision record, guide or specification is superseded by this change.
