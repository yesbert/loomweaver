# View state that survives

<!-- derived-from-specs -->
> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/` — for this page: `persistence-ports` · `surfaces`. Where this page and a specification disagree, the
> specification is right, and that is a defect in this page: change the behaviour there, then
> explain it here.

**A hidden surface is destroyed as soon as it is clean.** Your surface is hidden when no pane renders
it: a tab switch, a minimised pane, a collapsed sidebar, the closed mobile drawer. The host then
destroys the instance and rebuilds it on return. Component-local fields do not survive that. They never
survived a reload either. The rule to author by is **evictable = reload-safe**: anything that must
survive an F5 belongs in `VIEW_STATE`. Then hiding costs you nothing. A surface that genuinely needs
its live instance kept while hidden (an expensive rebuild, a live connection) declares
`retain: 'always'` on its registration; `retain: 'never'` opts back into destruction when
the distribution flipped the app-wide default.

**Where a retained surface lives.** A retained routable surface is mounted by the host in **every**
pane — the URL-carrying pane included; its route only carries the address. The instance is keyed to
the pane it sits in, so handing the URL role between split panes moves the role and leaves each
pane's instance where it is: a split shows **two independent instances** of your surface,
deliberately. The price: the surface receives a host-fabricated `ActivatedRoute` everywhere — route
params work (a param change is a different tab, hence a different instance), but there are **no
resolvers, no query params, no live parameter streams**, and a nested `<router-outlet>` stays inert,
so **do not combine `retain` with `subRoutes`** (the host warns in dev mode; read the sub-segment
from the address instead). A surface that needs live routing should not declare `retain` — for
unsaved work, `DirtySurface` below is the guard.

A **sandboxed** (`iframe`) surface retains too. The host
hides it in place instead of destroying it. Your document keeps running, and the Penpal handshake is
not paid again — at a URL and at a dock alike. **Moving** it is where the browser decides: an `<iframe>`
that is removed and re-inserted the ordinary way reloads, so the host uses the browser's atomic move
where it exists (Chromium and Firefox today) and the surface then survives a collapsed sidebar and a
closed pane as well. Where the browser has no atomic move (WebKit today) the surface is rebuilt
instead. A split, a drag into another pane and a minimise still rebuild everywhere. So write your
surface so that a rebuild is survivable either way. `container` surfaces are always rebuilt.

## Where next

- [Authoring a weaver](../authoring-a-weaver.md): the map of these pages.
- [Samples](../samples.md): complete recipes to copy.
