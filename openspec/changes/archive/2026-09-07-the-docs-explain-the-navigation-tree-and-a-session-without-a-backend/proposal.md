# The docs explain the navigation tree, and a session without a backend

> **Status:** approved.

## Why

Two things the demo shows on its first screen have no page that explains them.

The **navigation tree** is a workbench element with three requirements behind it in `ui-primitives`:
the workbench draws it from a declaration, it marks the destination the current address lies under,
and a group folds and stays as the user left it for the session. The two pull requests that
introduced it touched one file under `docs/`, the design-tokens reference, where it sits as a
single list bullet among the host building blocks. One sentence in the sub-routes guide mentions
it. There is no how-to page, no recipe on the samples page, no entry in the site's sidebar, and
neither `llms.txt` nor `llms-full.txt` names the element, its event or the helper that clears its
folds. A reader who wants a sidebar navigation, and an assistant asked to write one, both build
their own.

The demo builds far more on it than the bullet shows: one navigation surface per module, docked in
the left panel and attached to the module's workspace; destinations hidden when no plugin registered
their route; the panel retitled to the area the user is in; a boolean attribute driven from Angular;
a group key that must not be the translated label. None of that is written anywhere but
`demo/src/navigation`.

The **session** is covered from both sides, gating in a weaver and the auth integration of a
distribution, and the integration guide shows a login page and a login dialog with complete
components. What it does not show is what someone trying the platform needs before they have an
identity provider: a session that stands in for one. The demo has exactly that, in
`demo/src/session`, as a third shape the guide never describes, a rail item with a menu whose
commands sign in, sign out and switch the account, with no login screen at all. And the
`auth-source` generator already writes the state half of it, three fixed snapshots and a function
that cycles them, which the auth guide never mentions. The one runnable example the guide does point
at is the testbed weaver inside the platform repository, which is not a place a reader from outside
is sent.

## What Changes

**A how-to page for the navigation tree.** `docs/weaver/navigation-tree.md`, in the authoring
group directly after the sidebar-surfaces page, walks through what the demo does with the notes
weaver every other page uses: the declaration, why the tree reports a choice rather than acting on
it and which capability the weaver needs to act, marking where the user is, folding and its
session memory, hiding destinations nobody registered, retitling the panel, the accessible name,
and content inside an item.

**Two recipes on the samples page.** Recipe 11, a navigation tree in the sidebar, as whole files.
Recipe 12, a session without a backend, the first recipe that does not live inside `activate(ctx)`:
what the `auth-source` generator writes, and the plugin that gives it a rail item and commands.

**The auth guide names the stand-in.** A section before the three existing ones says what the
generator writes, what the recipe adds, and where the boundary is: presentation, not protection,
with the real integration in the sections that follow. Its pointer at the testbed weaver is replaced
by one at the demo's session directory, which a reader can open.

**Three pages point at the new one.** The design-tokens bullet shrinks to the element's attributes
and events and defers the story; the sidebar-surfaces page names the tree among what a view's body
can use; the sub-routes guide links from its sentence about a navigation tree.

**The AI-readable files learn the same.** The new page joins `llms.txt`'s weaver list, and the
navigation family with its event and its fold helper joins the building-block inventory in
`llms-full.txt`. Only what this change adds; everything else those files miss is
`the-llms-files-carry-the-whole-contract`.

**Named and left for later.** A generator that writes recipe 11, and the commands that recipe 12
adds to what `auth-source` writes, are one follow-up change. The recipes come first so that the
generator writes something that has already been read and copied.

## Capabilities

### New Capabilities

None. Every behaviour these pages describe is already required.

### Modified Capabilities

None. `skip_specs: true` is set in this change's `.openspec.yaml`. The pages describe what
`ui-primitives`, `routing` and `access-gating` already guarantee; where a page found a gap in a
guarantee it would be a defect for its own change, and none was found.

## Impact

- `docs/weaver/navigation-tree.md`, new; `website/sidebar.mjs` for the guard that requires it
- `docs/samples.md`, recipes 11 and 12 and the recipe table
- `docs/distribution/auth.md`, the stand-in section and the replaced pointer
- `docs/reference/design-tokens.md`, `docs/weaver/sidebar-surfaces.md`,
  `docs/weaver/sub-routes-and-follows.md`, cross-references
- `llms.txt`, `llms-full.txt`, the entries for what this change adds
- No platform package, no published contract and no specification is touched
- No legacy source is dissolved by this change
