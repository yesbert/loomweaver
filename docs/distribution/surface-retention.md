# Surface retention

<!-- derived-from-specs -->
> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/` — for this page: `surface-retention`. Where this page and a specification disagree, the
> specification is right, and that is a defect in this page: change the behaviour there, then
> explain it here.

One rule governs every surface and every hiding gesture: **a hidden surface is destroyed as
soon as it is clean.** "Hidden" means rendered by no pane of this window: a tab switch, a minimised or closed pane, a
collapsed sidebar and the closed compact drawer all hide a surface. By default
(`retention: 'destroy'`) the instance is destroyed and rebuilt on return. Component-local fields
therefore do not survive. State that must survive belongs in `VIEW_STATE`. `VIEW_STATE` also
survives a reload — the invariant is *evictable = reload-safe*. A surface can opt out individually with `retain: 'always'` on its declaration (an
expensive rebuild, a live connection), and a distribution can flip the
app-wide default with `provideShell({ retention: 'retain' })` — the surface declaration
(`'always'`/`'never'`) wins over the default.

A retained routable surface is host-mounted in **every** pane — the URL pane included, where its
route only carries the address — and its instance is keyed to the pane it sits in, so handing the
address between split panes leaves each pane's instance where the user put it. The trade: a retained
surface sees a host-fabricated route (route params work; resolvers, query params and nested
`subRoutes` outlets do not), and flipping the app-wide default to `'retain'` applies that trade to
every surface that does not opt out with `'never'`.
**Sandboxed (`iframe`) surfaces retain too**: a retained one is hidden in place rather than destroyed, so
the plugin's document keeps running and no Penpal handshake is paid per tab switch. It is still rebuilt
whenever it would have to *move* — a split, a drag into another pane, a minimise — because moving an
`<iframe>` element in the DOM reloads it. `container` surfaces are always rebuilt. A retained instance is
destroyed once its tab is actually **closed** — retention covers hiding, not closing.

**"Clean" is the plugin's word.** A surface component that implements `DirtySurface` (see
[authoring a weaver](../weaver/unsaved-changes.md)) is never destroyed
while it reports unsaved changes, so no hiding gesture ever loses work or needs a prompt. Destruction
that the user initiates — closing a tab, closing a pane, *close others/all/to the right* — goes
through the **host's own localised dialog**. Its buttons are *Save* · *Discard* · *Cancel*; Save
appears only when the surface can save. That gives one wording, one translation and one keyboard
behaviour across every plugin, and no plugin draws its own dialog. The one exception is the optional
`surfaceBeforeClose` veto a surface can implement. The veto runs first, carries a host-enforced
timeout and a guaranteed **"Close anyway"** escape, and never bypasses the unsaved-changes ask for a
still-dirty instance. **Programmatic destruction asks too.** Disabling, uninstalling or updating a plugin (the switches in
*Permissions* and the plugin store) runs the same unsaved-changes dialog over the affected instances
before anything is destroyed. So does resetting a workspace. **Switching** a workspace never asks:
each workspace remembers its own arrangement, and a dirty surface survives the switch parked, under
the same retention rule as any hidden surface. The `beforeClose` veto is
deliberately *not* consulted there — a plugin cannot veto its own removal.
Closing the browser window while anything is dirty triggers the native `beforeunload`
prompt — whose wording and language are the **browser's own**: browsers ignore page-supplied text
there and localise it to the browser UI language, not the app's. There is nothing to wire — all of
this rides on `provideShellRouter()`. The complete
author-side recipe — component, save flow, `saveOn: 'hide'`, veto, and the sandboxed variant — is
[recipe 8 in Samples](../samples.md#an-editor-with-unsaved-changes).

## Where next

- [Building a distribution](../building-a-distribution.md): the composition root and the map of these pages.
- [Distribution API](../distribution-api/index.md): everything your own code can do once the product runs.
