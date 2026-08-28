## Context

See proposal.md — Why. What shapes the approach is that two ways of getting the same plugin into the
same list carry different amounts of information about it.

A plugin the operator deployed or the user installed arrives through a catalogue entry, and an entry
carries display metadata because a store has to draw it. A plugin the distribution composed arrives
as a registration whose fields are all mechanism — where its code is, what it asks for, how much the
browser holds it back. Nothing there is meant to be read by a person, so the surfaces that must show
a person something fall back to the identifier.

The identifier is not a bad fallback. It is stable, it is what everything else is keyed on, and it is
never wrong. It is simply not a name.

## Goals / Non-Goals

**Goals:**

- A distribution can say what its frame plugin is called, in one place, without a catalogue.
- What the user reads is what the composition said, and what the machinery matches stays the
  identifier.
- A composition that says nothing behaves exactly as it does today.

**Non-Goals:**

- **A translated name.** The composition writes one string. A plugin whose name should follow the
  interface language has a translation key's worth of machinery behind it, and no one has asked for
  that; the trusted rung does not have it either.
- **Any other display metadata.** No description, no author, no icon. Those are a catalogue's job and
  a store's, and inventing a second half-catalogue on the registration is how two sources of the same
  truth begin.
- **Deriving a name from the identifier.** Turning `payments` into "Payments" is a guess that reads
  as a fact, and it would be wrong the first time an identifier is not a word.
- **Changing what is keyed on.** Nothing is looked up, granted or stored by name.

## Decisions

### The name lives on the registration, beside the identifier

One optional field on what a distribution already writes for a frame plugin. Absent, everything is as
it is today.

*Why not a catalogue entry for composed plugins* — a catalogue is the operator's list of what may be
installed, and a composed plugin is not installable; it is already there. Giving it an entry to carry
one string would mean maintaining a second registration of the same plugin and deciding which wins.

*Why not take the name from the plugin itself, over its channel* — because the plugin would then name
itself in the surface where the user decides what to trust it with, and a name is exactly the field a
plugin should not control there. The distribution vouches; the plugin does not introduce itself.

### An absent name shows the identifier, and nothing prettier

A composition that says nothing gets the current behaviour, stated rather than defaulted. Titlecasing
or de-kebabing the identifier is rejected: it invents, and what it invents is presented with the same
confidence as a name the distribution actually chose.

## Risks / Trade-offs

- **One more optional field on the published contract.** → It is additive and absent-by-default, so
  no existing composition changes; the cost is a release, not a migration.
- **A name and an identifier can disagree about what a plugin is.** → The requirement pins that the
  name is read and never matched, and a scenario covers two compositions naming one plugin
  differently.
- **Someone will want the name translated next.** → Then that is its own change, with the question of
  where a distribution's translation keys live answered properly rather than smuggled in here.

## Migration Plan

Nothing to migrate. The field is optional, its absence is current behaviour, and consumers pick it up
whenever they next take a release.
