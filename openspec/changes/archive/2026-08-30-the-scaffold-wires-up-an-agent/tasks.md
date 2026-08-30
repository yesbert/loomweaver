## 1. A package the output needs, as data

- [x] 1.1 Add the amendment kind that states a package the generated output needs, with the version it
      is needed at, following the existing rule that an amendment ensures presence rather than sets a
      value.
- [x] 1.2 Apply it on the route with workspace access: record the dependency in the project's manifest,
      adding only what is absent and leaving a version the consumer already chose in place.
- [x] 1.3 Report it on the routes without workspace access, among the steps that remain, saying what
      fails if it is skipped. A trial run names it and writes nothing.
- [x] 1.4 Tests for all three: it is written where it can be, it is named where it cannot, a consumer's
      own version survives, and a trial run only reports.

## 2. The connection itself

- [x] 2.1 Add the agent connection as a feature of the weaver, described once so every route offers it
      identically. Asking for it also produces the command it offers, per design.md — Decisions.
- [x] 2.2 Derive the permission that reaching commands beyond the weaver's own requires, from the
      feature rather than from consumer input, as the other features already do.
- [x] 2.3 Emit the connection: a factory over the published adapter, with no module-level state, the
      list asked for per run, every event handed over unfiltered, and the seam that decides about a
      call before it runs with an empty set of consequential commands to fill in.
- [x] 2.4 Emit its test, driving a real call as three events — a start, argument deltas and an end —
      and asserting the outcome comes back; plus a declined consequential call that never reaches the
      workbench.
- [x] 2.5 State the two packages the emitted files need as amendments from 1.1, at the versions
      design.md — Decisions settles, in one place.

## 3. Something to look at, and something to replace

- [x] 3.1 Emit the panel as a docked surface: the offered tools, the call as it streams, the outcome,
      and the line saying what the stand-in is. Own template file, semantic tokens, host building
      blocks, strings as keys in the bundles the weaver already emits.
- [x] 3.2 Emit the stand-in as one file the panel does not reference: it produces the protocol's own
      events and never reaches for the command itself.
- [x] 3.3 Make replacing it a one-file change, and confirm it by replacing it in a scratch workspace
      with a hand-written transport and changing nothing else.
- [x] 3.4 Say in the file's own header what it is and what replaces it, in the manner the generated
      development sign-in already uses.

## 4. Prove it runs, not only that it compiles

- [x] 4.1 Recipe tests: the emitted file map, the derived permission, the implied command, and that no
      transport, credential or model is emitted.
- [x] 4.2 Extend the nightly check that generates into a fresh application and asserts on what is
      served, so that it reaches the panel, runs a command from it and sees the outcome.
      - [x] The check now generates a weaver with the connection, installs only what the scaffold
            recorded, builds, and asserts the panel and the stand-in reached the served bundle and
            that the recorded package resolved to an installed one.
      - [x] The check serves what it built and opens it in Chromium, driven by Playwright as a
            library. Asserting it from an existing Playwright suite was considered and dropped: both
            suites point at an application that lives in this repository, while the one under test
            is created by the generator and takes the whole install-and-build the check already
            does. The demo's own panel shares no code with the generated one, so asserting there
            would be green without covering the generator at all.
      - [x] It reaches the panel, sees exactly the command the generator declared callable, is asked
            before a consequential call, and reads both outcomes: declining stops it, confirming
            runs it. A browser that will not start is reported as setup, like a registry failure.
- [x] 4.3 Repository check that the two recorded versions agree with what the platform itself
      resolves, so a bump cannot leave the generator behind quietly.
- [x] 4.4 Generate with the connection and with each of the surface-shaping features in turn, and
      confirm the output still passes the lint it emits for itself.

## 5. Say that it is generated

- [x] 5.1 `docs/scaffolding.md`: the option, what it emits, and that the stand-in is meant to be
      replaced.
- [x] 5.2 `docs/samples.md`: the agent recipe names the invocation that writes it, as the first five
      recipes already do.
- [x] 5.3 `llms.txt` and `llms-full.txt`: the generator list carries the new option.

## 6. Hand over

- [x] 6.1 `openspec validate --all --strict` and the repository's own guards for the touched projects.
- [x] 6.2 Open the pull request naming what a consumer gets on the first serve and what stays theirs.
