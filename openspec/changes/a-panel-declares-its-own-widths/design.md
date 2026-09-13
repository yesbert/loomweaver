## Context

See `proposal.md`, Why. What already stands, established by reading the code on 2026-09-13:

- **One service holds every panel's width.** It keeps a map from region id to width in the working
  state store, under one key, synchronised between windows and re-read when the storage namespace
  changes. The default, minimum and maximum are module constants. Clamping uses them for every
  region, and both parsing and setting drop a width equal to the default, so the map only ever holds
  widths that differ from it. Reading a width falls back to the default.
- **The splitter reads the bounds from the service**, as one pair for every panel, for the keyboard's
  extremes, and computes a drag from the width it started at.
- **The panel binds its width inline**, returns no width on a compact viewport, where a fixed overlay
  width class applies instead, and zero when collapsed.
- **The distribution's sidebar service** sets a width only for a declared panel, then commits it as a
  released drag. The app reset clears the whole map.
- **A layout region is one flat shape** of identity, kind and dock, and the layout is provided as a
  plain value. Nothing validates it when it is provided today.

## Goals / Non-Goals

**Goals:**

- Default, bounds and the stored-width rule are per panel, read from the declared layout.
- A person's released width is kept as a choice, whatever the default is.
- A mistaken declaration fails where it is written, in every build.

**Non-Goals:**

- Changing the overlay on narrow viewports, the keyboard step sizes, or the storage key.

## Decisions

**The widths live on the panel's own region, and only a panel region can carry them.** The region
type becomes a union keyed by kind, where the panel member has optional `width`, `minWidth` and
`maxWidth` and the others do not. A width on a bar is then a compile error rather than a report.
Every existing literal still type-checks, because the fields are optional and the other members are
unchanged.
*Alternative considered:* flat optional fields on every region, as the finding proposed, with a
report for a width on a non-panel. It keeps the type simpler, and it turns a mistake the compiler
can see into one found at run time.
*Consequence:* code that builds a region from a variable of the wide kind type has to narrow it. The
changelog says so; the guides and scaffolds build literals.

**The service resolves bounds per region from the layout.** It reads the declared layout and exposes
the resolved start, minimum and maximum for a region id, filling each undeclared value with the
workbench's constant. Clamping, reading and the splitter's extremes take those per region. The
splitter asks for its own region's bounds instead of reading one pair.

**Every released width is stored, and only the reset removes it.** The rule that a width equal to the
default is not stored existed to keep the map small when the default was one number. With a default
per panel that can change between releases of a product, it silently turns a deliberate choice into
"no choice". Setting and parsing therefore keep any finite width, clamped to the region's bounds.
Reading returns the stored width, clamped again against the current bounds, or the declared start
width.
*Alternative considered:* storing a marker for "chosen" beside the width. The map already means
"chosen" by containing an entry, once entries equal to the default are no longer dropped.

**A stored width is clamped when read, not rewritten when the bounds change.** The stored value
stays as it was released; what is shown respects the current declaration. If a later declaration
widens the bounds again, the person's original width returns. Nothing needs to migrate.

**The declaration is checked when the layout is provided.** Providing the layout validates each panel
region after filling in the workbench's values, and throws naming the region if the narrowest
exceeds the widest or the start lies outside them. That is the moment the distribution's own code
runs, it happens in every build, and it matches how an overlay directory that resolves to the root is
refused.
*Alternative considered:* the composition report, as the finding proposed. The report runs in
development only, so a production build would silently clamp a contradiction nobody saw.

**The reset needs no change of its own.** Clearing the map already makes every panel read its start
width, and the start width is now the declared one, so the reset shows it at once.

## Risks / Trade-offs

- **Narrowing the region type can break a consumer who builds regions from a wide variable.** → Only
  that shape; literals are unaffected. Named in the changelog with the one-line narrowing.
- **More entries in stored state.** → One number per panel a person has resized, which is the same
  bound as before in practice.
- **A width stored before this release equal to the old default was never stored.** → Such a panel
  opens at its declared start width, which for a panel declaring nothing is the same value.

## Migration Plan

Nothing to migrate. Stored widths keep their key and format and are read under the new rule. A layout
that declares no widths behaves as before.
