> **Status:** approved.

## Why

The demo has three workspaces and, under each, content. It has no second navigation level at all,
because it has never had a section deep enough to need one. So the one question a visitor asks about
a workbench, *how do I find my way around something large*, is the one question the demo cannot
answer. Its left sidebar holds a list of quotes, which is data, not a way through the product.

That is also why the rail work that just landed could only be judged in the testbed: the demo has
nothing that overflows and nothing that needs a name it does not already have.

An ERP is the right shape to answer it with. It is a domain everyone recognises without
explanation, it is genuinely deep, and it is the shape our own products have. Along it the demo can
show what a rail entry actually is here, which is not a page but a whole arrangement: leave the
dunning run half done, jump to stock, come back and find the tabs as they were. A plain menu tree
cannot do that, and it is the thing worth showing.

## What Changes

- The rail carries the main modules: Overview, Sales, Finance, Procurement, Inventory, People. Each
  is a workspace, so switching modules restores what was open in that module.
- The left sidebar carries the module's functional areas, and under an area its views. Where a
  module has few areas the list is flat; where it has many the areas fold open and shut.
- **Only views live in the tree.** An action does not: *New customer*, *Start dunning run* and
  *Stock count* become a button beside the content they act on, and a command in the palette. Every
  other entry in a tree changes what the user is looking at; an entry that instead does something,
  and in the dunning case does something with consequences, reads the same and is not.
- The tree is deliberately lopsided, because a balanced one proves nothing: one module with no
  second level, one with six areas, one area with a single view.
- What the demo already has moves rather than being rebuilt: the quote list and the quote document
  become Sales, the sandboxed payment plugin becomes an area of Finance, the dashboard becomes
  Overview.
- Modules gain real content one at a time. The tree is complete in breadth from the first slice;
  depth arrives with the content that fills it, so the demo never shows a page that exists only to
  be a menu target.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. This is a distribution's own composition, built out of what the platform already guarantees: a
plugin contributes a view to a sidebar, an entry navigates to an address, a rail entry switches a
workspace, a command is reachable from the palette. Nothing here asks the workbench for something
new, and the change declares `skip_specs` accordingly.

If building it turns out to need something the platform does not offer, that is a finding worth its
own change, and worth more than a guessed requirement written in advance.

## Impact

- `demo/src/app/app.config.ts` declares three workspaces and the rail items that switch them. Both
  lists grow, and the sidebars each workspace holds change from a data view to a navigation view.
- `demo/src/quotes/` registers the quote list as a sidebar view. It stops being the sidebar and
  becomes a view in the content area, addressed from the tree.
- `demo/src/insights/insights.plugin.ts` registers the dashboard at the root address. It becomes the
  Overview module, and is the module that deliberately has no second level.
- `demo/src/payments/` is a sandboxed frame plugin. It becomes the single view of a Finance area,
  which is also the deliberate case of an area with one child.
- The demo's translations carry every label of the tree, in both languages.
- The demo's end-to-end suite has no notion of a navigation tree yet.

No legacy source is dissolved by this change.
