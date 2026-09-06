> **Status:** approved.

## Why

The demo says it stands on a plugin platform and then shows a workbench whose plugins are all
welded in. The one capability a visitor came to see, that an application can be extended without a
developer rebuilding it, is the one the demo cannot show. `plugin-store` carries twelve requirements
about a catalogue, consent, installing, updating and removing, and the demo exercises none of them.

The material is already there. Payment matching is a sandboxed plugin served from the demo's own
origin, which is exactly what an installable entry is. Today it is composed at build time, so the
one plugin that could demonstrate the store is the one thing standing in its place.

The same goes for a plugin's own settings. The contract lets a plugin contribute a settings section,
carries it across the sandbox boundary, and groups it apart from the product's own so that an
installed plugin cannot present itself as part of the product. The demo's settings show two sections,
both the product's.

## What Changes

- The demo serves a **catalogue** from its own origin, carrying one entry: payment matching, offered
  rather than deployed, so the visitor walks the whole way from browsing to consent to installing.
- **Payment matching stops being composed.** It arrives through the catalogue or not at all, which is
  what makes installing and removing observable.
- **The navigation tree shows an entry only while its address is reachable**, and draws no area whose
  entries are all missing. Installing the plugin makes the *Payment matching* area appear, removing it
  makes it go, both without a reload. This is one rule for all six modules rather than a special case
  for one.
- **The plugin contributes four settings of its own**: a tolerance for how far an amount may differ
  and still count as matching, whether an exact match is confirmed automatically, the sort order and
  the period shown. The tolerance visibly changes what the plugin draws, so a value crossing the
  sandbox boundary can be seen doing it.
- **The store is reachable from the right rail**, beside the other things that are about the
  workbench rather than the work.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. Every part of this is a distribution using what the platform already guarantees: a catalogue
provider, a sandboxed plugin served same-origin, the read side of what is registered, and a settings
section a plugin contributes. The change declares `skip_specs` accordingly.

If building it turns out to need something the workbench does not offer, that is a finding worth its
own change, and worth more than a requirement guessed in advance.

## Impact

- `demo/src/app/app.config.ts` composes payment matching through `provideFramePlugins` and must stop;
  it gains a catalogue and a rail entry for the store.
- `demo/public/` gains the catalogue document. The plugin's own files stay where they are, since an
  installable entry is an `entryUrl` on this origin and that is what they already are.
- `demo/public/payments/` gains the settings section and the behaviour behind the tolerance.
- `demo/src/navigation/` decides what the tree draws; it gains the rule about reachable addresses.
- The demo's end-to-end suite opens payment matching in several places and will not find it until it
  is installed.

No legacy source is dissolved by this change.
