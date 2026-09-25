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

## Decided by the owner

The owner decided the open behaviour choices on 2026-09-25. Each carries its delta in this change.

1. **The agent adapter's calls left open at the end of a run** keep the published signature: each
   `flush` answers one call, and callers ask until nothing is answered. The generated agent panel,
   the example and the documented usage loop accordingly. A call left open never received all of its
   arguments, so it is answered as refused and its command does not run. No breaking change, so it
   ships in a patch. (`commands`, *The connection an agent drives answers every call it opened*)
2. **Nested versus parallel command invocations:** only an invocation started from within another
   command's run, before that run first waits, counts towards the depth limit. No first-party command
   invokes another; the limit protects the programmatic route an agent and a plugin use. Carrying the
   chain explicitly was declined: it adds surface for a case nobody has, and a loop whose steps each
   wait is left to the plugin that builds it. (`commands`, *Invocations waiting side by side are not a
   chain*)
3. **A plugin state value with no data form** is refused with a message naming the plugin and the
   key; clearing stays the way to remove a key. (`persistence-ports`)
4. **A plugin the operator deployed** is shown as provided while browsing and offers no install, and
   the install service refuses a deployed id. (`plugin-store`)
5. **The plugin store on a narrow screen:** the detail replaces the list and offers a way back. It is
   shown to the owner as a slice before it is finished. (`plugin-store`)
6. **Waiting for the plugin store at activation:** the in-process state handle gains `onChange`, as
   the frame kit's handle has, which is additive and ships in a patch. The demo's welcome then waits
   for the store's answer. (`persistence-ports`)
7. **Found while fixing the testbed, and added here by the owner:** the frame kit keeps a state write
   made before its connection to the workbench and sends it once connected, instead of keeping it
   only in the surface. (`persistence-ports`)
8. **Choices read when used:** for a command registered by a plugin in the page, the choices are read
   whenever the command is described or checked, which is now a guarantee; an isolated plugin's
   choices are the ones it registered. The published JSDoc stops calling the list fixed. (`commands`)

The demo's uncertain items are defects: cancelling the second "New customer" prompt cancels the whole
creation, and an accepted quote can no longer be sent. The third, the quotes plugin with storage
blocked, was confirmed and fixed under 7.5.

From the refactoring change's list for the owner, `<lw-option icon>` showing the icon's name as text
where every other element draws the icon is treated as a defect here. No requirement names it, so it
gets a test and no delta, like the other defects covered only by published documentation.

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

None. The fixes ship in the next patch release, named under "Fixed". No decision took a breaking route:
the adapter keeps its signature, and the state handle's `onChange` is an addition.
