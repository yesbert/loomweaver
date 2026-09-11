## Context

See `proposal.md` — Why. What already stands, established by reading the code and the specs on
2026-09-11, so that the work does not start by rediscovering it:

- **The clash is already detected.** Bindings are built from the registered commands into a map keyed
  by the chord. Building that map already notices a second claim on a chord and already collects a
  sentence about it. The sentences are written to the console when the keyboard listener starts.
- **The chord already goes to the later registration**, because the map is written unconditionally.
  `commands` requires exactly that, so it is a decision rather than an oversight.
- **The report is a separate service.** It gathers two kinds of fault: ones it can see from what was
  contributed statically, which it also warns about unasked, and ones it works out on demand when
  asked to print. What it prints ends with a plain statement when it finds nothing.
- **The composition decides the clash.** In the incident, one command came from the weaver and the
  other from the distribution composing it. Neither file could see the other, and nothing about
  either was wrong on its own.

## Goals / Non-Goals

**Goals:**

- A developer who asks what is wrong with a composition is told about a claimed-twice shortcut, in
  the same place as every other composition fault.
- The report says which command the chord actually runs, not merely that there is a conflict.
- The end-to-end assertion that the testbed's report is sound starts guarding this class too.

**Non-Goals:**

- Changing who wins. That is stated in `commands` and stays.
- Removing the console warning, which keeps the `commands` guarantee without being asked for.
- Deciding anything about shortcuts that collide with the browser's own.

## Decisions

**Work it out from the registered commands, in the report.** The report already has two kinds of
problem and works the second kind out when asked. A clash is of that kind: it depends on everything
registered at that moment, including plugins activated since boot, so computing it when asked is both
simpler and more truthful than remembering what was true at start-up.

**Resolve the chord the way the keyboard does, not the way it is written.** Two commands can declare
the same chord in different words, and a chord means different keys on different platforms. So the
comparison uses the same resolution the key handling uses rather than comparing the declared strings.
Comparing the strings would miss the clash that actually bites and invent ones that do not.

**Name the winner, not just the conflict.** A report that says two commands share a chord leaves the
developer to work out which one they will get. The mistake being reported is precisely that a control
promises a shortcut that runs something else, so the report says which one runs.

**Leave the console warning alone.** It is the guarantee in `commands` and it fires unasked, which is
what makes it useful while someone is working. The report is what a developer consults deliberately.
Two messages about one fault is a small cost next to either one of them being absent.

**Do not go looking for the clash in the keyboard's own service.** The report reads the registered
commands the same way the bindings do. Making one service ask the other would tie a diagnostic that
runs on demand to a service that only starts once a listener is attached, which is a worse coupling
than resolving chords in two places that already share the resolution.

## Risks / Trade-offs

- **Two messages for one fault.** A developer who calls the report after seeing the console warning
  is told twice. → That is the lesser fault. The console warning is worth keeping because it appears
  without being asked for, and the report is worth having because it is what someone asks.
- **The end-to-end test that asserts the testbed reports nothing wrong becomes stricter.** A clash
  introduced later turns it red. → That is the point of the change, and it is why the incident is
  worth this work rather than a fix to the one command.
- **A product that deliberately overrides a shortcut is now told about it.** → It is told, not
  stopped, and only in development. A deliberate override is still worth seeing, because the control
  showing the superseded shortcut is still misleading.

## Open Questions

None.
