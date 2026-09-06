## Context

See proposal.md, *Why*. What shapes the approach is what the demo and the platform already hold.

Payment matching is a `FramePlugin` with an `entryUrl` of `/payments/plugin.html`, composed through
`provideFramePlugins`. An installable catalogue entry is the same thing: a plugin the workbench spawns
from an address on the product's own origin. So the move from composed to installable changes where
the entry is declared, not what the plugin is.

The platform carries the read side of both questions this change asks. `ContributionRegistry` exposes
`contentRoutes` as a signal of every reachable address, and `PluginInstallService` exposes `installed`
as a signal the sandbox runtime reconciles against, so an install spawns the plugin at once and a
removal unloads it, both without a reload. Both are exported from `@loomweaver/shell`, which a
distribution may inject.

The demo's navigation tree is the demo's own view over a static `MODULES` list. Nothing in it reacts
to what is registered.

## Goals / Non-Goals

**Goals:**

- Show the whole way a plugin arrives: browse, read, consent, install, and see it appear where it
  belongs.
- Show that a plugin's own settings reach the plugin, by making one of them visibly change what it
  draws.
- Keep the tree honest without a special case: an entry is drawn while its address is reachable.

**Non-Goals:**

- A catalogue of invented plugins. One real entry that does something is worth more than three
  placeholders, and every placeholder would need its own content to not read as filler.
- The deployed half of the catalogue. The operator-deployed case is real and worth showing, but it
  answers a different question and belongs to whoever asks it next.
- Updating a plugin. The update flow needs a second version of the entry to have anything to offer,
  which is a catalogue that changes over time, which the demo has no way to produce yet.
- Making the navigation tree a place plugins contribute to. See the decision below.

## Decisions

**The tree filters against what is reachable; plugins do not contribute to it.** The tree could be
made a surface a plugin declares its place in. That would hand the product's own structure to plugins,
and the contract would then have to answer who owns the order, what happens when two plugins claim the
same area, and what stops a plugin from settling where the product keeps its most important view.
Those are real questions with exactly one case to answer them from today. The alternative costs the
demo three lines: the tree reads `contentRoutes` and draws an entry while its address is there. It is
the same rule for all six modules, and because the source is a signal, the tree follows an install
live. If a second product needs plugins to bring navigation structure with them, that is a change with
a shape taken from practice.

**Payment matching is offered, not deployed.** A deployed entry is active without being asked about,
so nothing about the demo would change except a line in the store. Offered means the visitor sees the
consent the capability exists for, and it means the area is missing until they act — which is the
point, not a defect. The cost is that the demo shows one view fewer on a first visit, and we take it.

**The tolerance is what proves the boundary.** Three of the four settings are ordinary state a plugin
could fake by ignoring them. The tolerance changes which statement the plugin draws beside an amount,
so a visitor who moves it sees a value cross the sandbox RPC and take effect. A setting that only
persists proves nothing about isolation.

**A module never lands on an address a plugin brings.** Finance opened on payment matching, which
was safe while the plugin was composed and is not once it can be absent: switching to the module then
lands nowhere, and a tree that reads where it is finds nothing at all — the whole module draws empty,
not just the one area. Finance opens on Receivables instead. The rule generalises: a workspace's
landing address must be one the product itself answers.

**The catalogue is a document the demo serves.** `providePluginCatalog` takes an address, the workbench
refuses anything not same-origin, and the demo already serves JSON from `demo/public/api`. Nothing is
gained by hand-building a catalogue object in code, and serving it is what a product does.

## Risks / Trade-offs

- **The demo's first impression loses a view.** A visitor who never opens the store never sees payment
  matching. Mitigation: the store sits in the rail where the account and the workspaces are, and the
  entry is the only thing in it, so it is hard to miss and quick to act on.
- **The end-to-end suite reaches payment matching in several specs.** Those will fail until they
  install it first. Mitigation: install is a step the suite takes, and it is worth a helper, the way
  the account switch became one.
- **A plugin the user removed stays removed.** The install is persisted user-locally, so a visitor
  who removes it and returns finds it gone and may not remember why. Mitigation: this is the honest
  behaviour of an install, and the store says what is installed.

## Open Questions

None.
