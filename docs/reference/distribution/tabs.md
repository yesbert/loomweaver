# Tabs

<!-- derived-from-specs -->
> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/` — for this page: `content-tabs` · `host-services`. Where this page and a specification disagree, the
> specification is right, and that is a defect in this page: change the behaviour there, then
> explain it here.

The content area is router-addressed, so most navigation is just routing. This service is for the
things routing alone cannot express — the tab strip's own state.

## Do it

```ts
const tabs = inject(ContentTabsService);

tabs.navigateTo('doc/readme');                 // navigate, fire-and-forget
tabs.open({ path: 'doc/readme', title: 'README.md', titleIsLiteral: true });
tabs.keep('doc/readme');                       // promote a preview tab
tabs.pin('doc/readme'); tabs.unpin('doc/readme');
tabs.close('doc/readme'); tabs.closeOthers('doc/readme');
tabs.revealContentTab('doc/readme');           // focus the tab where it already lives

tabs.activeContent();                          // { surfaceId, path, params } | null
tabs.tabs();                                   // the visible strip
tabs.quickOpenTargets();                       // everything `mod+p` can reach
```

## What asks about unsaved work

`close`, `closeOthers`, `closeToRight` and `closeAll` ask about unsaved work exactly as the × and the tab menu do, through the same guard, and close only what the answer allows.

## Switched off

`content.close`, `content.pin`, `content.preview` and `content.escalate` take the user's controls away; every method here keeps working for you. The content area's **arrangement** (splits, panes) is [Panes](panes.md); this page is about what the panes hold.

## In depth

`revealContentTab` is the one to reach for when a tab may live in a split pane: it activates it in
place instead of re-opening a duplicate in the primary pane.

## Where the story is told

- [Content area: routes and tabs](../../weaver/content-area.md): how a surface becomes a tab.
- [Following tabs](../../distribution/content-routing.md#following-tabs) and [Routing](../routing.md).
