# Tabs

<!-- derived-from-specs -->

> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/` — for this page: `content-tabs` · `host-services`. Where this page and a specification disagree, the
> specification is right, and that is a defect in this page: change the behaviour there, then
> explain it here.

The content area is router-addressed, so most navigation is just routing. This service is for the
things routing alone cannot express: the tab strip's own state.

## Do it

```ts
const tabs = inject(ContentTabsService);

tabs.navigateTo('doc/readme');                 // navigate, fire-and-forget
tabs.open({ path: 'doc/readme', title: 'README.md', titleIsLiteral: true });  // a titled dynamic tab
tabs.keep('doc/readme');                       // promote a preview tab
tabs.pin('doc/readme'); tabs.unpin('doc/readme');
tabs.close('doc/readme'); tabs.closeOthers('doc/readme');
tabs.closeToRight('doc/readme'); tabs.closeAll();
tabs.revealContentTab('doc/readme');           // focus the tab where it already lives
```

Use `navigateTo` when the address alone says what to show; use `open` when the tab needs a title the address does not carry, or should open as a preview.

## Read it

```ts
tabs.activeContent();                          // { surfaceId, path, params } | null
tabs.tabs();                                   // the visible strip
tabs.quickOpenTargets();                       // everything `mod+p` can reach
```

What is active is `activeContent()`: the surface, its path and its parameters, or `null`, as a plugin reads it through `ctx.activeContent`. The strip is `tabs()`, in strip order. What quick-open can reach is `quickOpenTargets()`: the open tabs, and the unopened routes the session may open.

## What asks about unsaved work

`close`, `closeOthers`, `closeToRight` and `closeAll` ask about unsaved work exactly as the × and the tab menu do, through the same guard. They close only what the answer allows.

## Switched off

`content.close`, `content.pin`, `content.preview` and `content.escalate` take the user's controls away; every method here keeps working for you.

## In depth

**Reveal, do not duplicate.** `revealContentTab` is the one to reach for when a tab may live in a
split pane. It activates the tab in place and that pane takes the address, instead of opening a
second copy in the address pane.

**Scope.** This page is about what the panes hold. The content area's arrangement, splits and
panes, is [Panes](panes.md).

## Where the story is told

- [Content area: routes and tabs](../weaver/content-area.md): how a surface becomes a tab.
- [Following tabs](../distribution/content-routing.md#following-tabs): tabs whose address is computed.
- [Routing](../reference/routing.md): what carries over from the Angular router unchanged.
