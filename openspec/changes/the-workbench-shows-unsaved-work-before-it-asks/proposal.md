> **Status:** proposed — not approved for implementation yet.

## Why

The workbench asks about unsaved work at exactly one moment: when something would destroy it. Until
then nothing says the work is there. A user who edits a field, switches to another tab and comes
back an hour later has no way to know which of six open documents is waiting to be saved, and no way
to find out except by trying to close each one. The dialog is a good last line; it is a poor first
one.

The demo made this visible rather than theoretical. It now carries one editable field, and the
prompt it raises was photographed for the guide, so the gap is on the page: the guide can show what
happens when you close, and nothing at all about what you see before you do.

There is a second half, and it is the reason this is one change rather than two. A tab is the only
place the workbench can mark, because the tab strip is its own chrome. Everything else worth marking
belongs to the product: a row in a list of documents, a count beside a module, a badge the
distribution puts in the status bar. The workbench cannot guess those, and the product cannot ask,
because unsaved work is not readable today. Both halves need the same answer to the same question,
*is there unsaved work at this address*, and writing that answer once for two callers is what keeps
it honest.

## What Changes

- **A tab whose work is unsaved is distinguishable from one whose work is saved.** One kind of tab,
  so one guarantee: the content strip, a pane's strip and the sidebar's alike. A pop-out carries no
  strip and is therefore out of it.
- **A tab that holds other work is marked when any of that work is unsaved.** This is the case the
  demo exercises: the unsaved surface is a container child, and the tab a user actually looks at is
  the container's. Closing already treats the two as one; showing must too.
- **The state is announced, not only drawn**, so that the mark is not a colour a screen reader
  cannot see.
- **Unsaved work becomes a readable fact.** A distribution reads it for every surface, as it reads
  any other workbench fact. A plugin reads it for the surfaces it registered itself, which is what a
  list marking its own documents needs, and is narrow enough that no plugin learns what another is
  editing.
- No change to what a surface reports. `DirtySurface` and the sandbox channel stay as they are: the
  surface says one thing, and this change is about who may then read it and where it shows.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `surface-retention`: gains the requirement that unsaved work is visible before it is asked about,
  with the container case as a scenario, and the requirement that it is readable as state. This is
  the capability that already carries *Closing asks before losing work* and *The same question is
  asked wherever work would be destroyed*; the marker is the same story one beat earlier, and
  splitting the two across capabilities would put one answer in two places. Its Purpose paragraph
  speaks only of lifetime and needs a sentence admitting what the capability has grown to cover.
- `plugin-runtime`: gains the plugin's own read, bounded to the surfaces the plugin registered, and
  the grant it sits behind.

`host-services` needs no delta. Its requirement *Workbench facts are readable as reactive state*
already fixes the shape for anything a distribution may read, and this adds a fact rather than a
rule.

## Impact

- `platform/libs/core/shell/src/lib/regions/pane/retention/`: the aggregation from an address to
  *has unsaved work*, which today exists only inside `pane-view.ts` as `closeCandidates` and inside
  `tab-closing.service.ts` as its own copy. Both become callers of one rule.
- `platform/libs/core/shell/src/lib/regions/pane/chrome/pane-tab-strip.*`: the mark, and the
  accessible name that carries it.
- `platform/libs/core/plugin-sdk/src/lib/plugin.ts`: the plugin's read.
- The distribution's service surface, for the fact.
- `docs/concepts/retention-and-unsaved-work.md`, `docs/weaver/unsaved-changes.md`,
  `docs/the-workbench.md`: what a user sees, and what a plugin may read.
- No legacy source is dissolved by this change.
