## Context

The defects come from the readability review described in `the-code-reads-for-a-newcomer`. Each
platform defect was read a second time against the code and traced to `openspec/specs/`: nine are
already stated by a scenario and need only a test, seventeen are covered by a requirement whose
scenarios miss the case, and five are covered by no requirement (a crash, a leak or a promise made only
in published JSDoc). None turned out not to be real. Two came out worse than first reported: the list
menu also drops the icon of its active entry, and a menu-only rail entry hidden by right-click can
never be brought back.

The thirteen defects outside the contract (testbed, demo, example, website tools) carry no delta,
because those products are not under the platform's specs.

## Goals / Non-Goals

**Goals:**

- Every defect is reproduced by a test that fails on the current `main` before it is fixed.
- The fix of a defect lands before any refactoring slice that touches the same code.

**Non-Goals:**

- Refactoring. A fix changes what it must and nothing else; the cleanup around it is a task in
  `the-code-reads-for-a-newcomer`.
- The five defects that need a decision (below) until the owner has made it.

## Decisions

**One defect, one pull request, test first.** The test is written against the current code and must
fail there, as `CONTRIBUTING.md` asks; the fix follows in the same pull request. Several tiny defects
of one file (the CLI's three) may share a pull request when their tests are separate.

**Where a scenario is added, the test pins the scenario, not the file.** A test names the behaviour the
scenario states, so the later refactoring can move the code freely under it.

**Fix routes that keep the published surface.** The rename and action check for a foreign surface is
made in the plugin context, not by adding an owner parameter to the published registry methods. The
language fix makes the language service apply the port's answer and start with the shell, without a
new member. The frame declaration build reorders its replacements. The claims report widens the
published JSDoc of `claims` from "the same shape" to "overlapping claims of equal narrowness"; that is
a text correction.

**The generators follow the CLI where the two disagree.** The CLI already merges a build target value
by value, names a code-written style configuration, and escapes paths; the Nx route adopts the same
behaviour. The shared `applyAmendments` in the refactoring change comes after these fixes, so the fixes
stay small and each is testable on its own.

## Decisions for the owner

These five are behaviour choices. Each gets its spec delta through `/opsx:update` once decided.

1. **The agent adapter's calls left open at the end of a run.** Today only the last one is answered and
   the others vanish, which makes most model providers reject the next request. `flush` and `receive`
   return one answer each in the published types. Options: return a list (a breaking signature change,
   so a minor), or answer one call per `flush` and have callers loop until nothing is left (the
   signature stays, the documented usage and the generated panel change). Separately: run the leftover
   calls, or refuse them because their arguments never closed.
2. **Nested versus parallel command invocations.** Today every running invocation counts towards the
   depth limit, so sixteen calls that wait for the user block the seventeenth unrelated one. The
   browser keeps no call-chain context across an `await`. Options: count only invocations started while
   another command's run is on the stack (no surface change, but a loop that awaits once before calling
   itself again is no longer stopped), or carry the chain explicitly through the invoker (additive).
3. **A plugin state value with no JSON form.** Today writing no value or a function throws an internal
   type error. Options: refuse it with a message naming the plugin and the key (matches the published
   "values are JSON"), or treat writing no value as clearing the key (changes the published JSDoc and
   adds a guarantee).
4. **Browsing a plugin the operator deployed.** Today the detail pane offers Install for it, and
   installing writes a hidden record that takes over if the deployment is withdrawn. Options: mark it
   as provided and offer no install in the browse view, and optionally let the install service refuse
   a deployed id as well (which extends a requirement).
5. **The plugin store on a narrow screen.** Today the detail pane with the only Install button is
   hidden below the small breakpoint, which the accessibility requirement (reflow without loss of
   function) does not allow. The presentation is the owner's: for example the detail replacing the
   list with a way back. It is a UI change and is shown as a reviewable slice first.

Three demo items are marked uncertain by the review and are fixed only if the owner calls them defects:
cancelling the second "New customer" prompt still creates the customer (it may mean "city optional",
then the button should say Skip); sending an accepted quote turns it back into "sent"; the quotes
plugin failing to activate when browser storage is blocked needs a check in a browser that blocks it.

One question came up while fixing the quote commands, which now read their `choices` through a
getter. That works because the workbench reads the list whenever it describes or checks a command.
The published text, however, calls it "a fixed `choices` list", and a sandboxed plugin's declaration
is copied once when it registers. Whether "read when used" becomes a guarantee in `commands`, for
plugins in the page, is the owner's decision. Until then the demo relies on today's behaviour, and
its test pins it.

## Risks / Trade-offs

- [A fix changes behaviour a product relies on, such as the pane arrangement now reading the
  saved-workspace list from the settings port] → The release notes name every platform fix under
  "Fixed"; the ports fix only matters to a product whose two ports differ, which is exactly the case
  the contract promised to support.
- [A red test that passes on the old code proves nothing] → Each pull request states that the test
  was run against the unfixed code and failed, with the failure message.
- [End-to-end tests for UI defects are nightly only] → The defects are pinned by unit tests with the
  real components wherever the behaviour is reachable there; the testbed's end-to-end suite runs before
  the release that carries them.

## Migration Plan

None. The fixes ship in the next patch release, named under "Fixed". The adapter decision, if it takes
the breaking route, waits for a minor and is asked for separately.
