## Context

See `proposal.md`, Why. The mechanics as they stand:

- Every scaffold descriptor may carry `amend(values)`, which returns the workspace amendments the
  generated output needs. The CLI and the Nx generator apply them. The MCP route maps them through
  `describeAmendment` into a `remaining` list on the response, and omits the key when the list is
  empty.
- `authSourceAmendments(input, where)` returns `[]` when `where` is empty or the stand-in is
  `bare`. The weaver's `amendments` keeps the package amendments and drops the directory-bound ones
  in the same case.
- The MCP route passes no `where`, by design: it states structure, not location.
- The weaver output includes a generated `README.md` that lists the three wiring steps. The
  auth-source output includes no README.
- The icon provider line is directory-independent. The compose-plugin amendment is not: its
  `sourceRoot` and the asset glob need the directory.

## Goals / Non-Goals

**Goals:**

- Over MCP, the auth-source response names every step the CLI would have performed, each with its
  cost when skipped, without the server learning anything about the workspace.
- A test fails if a scaffold the MCP route offers produces files that need workspace wiring and
  names none of it.

**Non-Goals:**

- No change to what the CLI and the Nx generator do; they have the directory and apply the steps.
- No `where` argument on the MCP tools. The refusal to know the location is what keeps the server
  inside the client's review path.

## Decisions

**Prefer naming over a README, and keep the README for prose.** The requirement says the steps are
named in the output at generation time. A `remaining` list is that; a README is a file the client
writes, which the assistant may or may not read (the recorded weaver run read it, a second run wrote
it without reading). So the fix makes `authSourceAmendments` return the directory-independent
amendments when no directory is known, and describes the directory-bound ones with a placeholder
for the location, the way the weaver's README already phrases its asset glob (`<path to this
library>`). Alternative: emit a README like the weaver's. Not rejected, but secondary: it helps the
reader, it does not satisfy the requirement on its own.

**The test enumerates the scaffolds.** For each descriptor the MCP route offers, generate with no
directory, and assert that either `remaining` is non-empty or the recipe declares it needs no
wiring. The distribution and the agent weaver already have such tests; this generalises them so
the next recipe cannot ship with the gap.

## Risks / Trade-offs

- **A placeholder in a step reads as an error to an assistant.** → Phrase it as the weaver README
  does, as an instruction with a location the assistant chooses, and say so in the sentence.
- **The plain weaver run then also names steps it did not before**, which changes the existing
  test that expects `remaining` to be undefined. → That test encoded the README as the carrier;
  update it to expect the steps, and keep the README.
