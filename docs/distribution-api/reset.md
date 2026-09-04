# Resetting the application

<!-- derived-from-specs -->

> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/` — for this page: `workspaces` · `shell-layout` · `host-services`. Where this page and a specification disagree, the
> specification is right, and that is a defect in this page: change the behaviour there, then
> explain it here.

The frame's own arrangement back to its defaults, and every workspace with it if you ask.

## Do it

```ts
const appReset = inject(AppResetService);

await appReset.reset();                      // the frame: rail, sidebars, sizes, order, view instances
await appReset.reset({ workspaces: true });  // and every workspace, asking about unsaved work once
```

## Read it

Nothing here is a signal; the frame's facts are read on [Panes](panes.md), [Sidebars](sidebars.md) and [Workspaces](workspaces.md).

## What asks about unsaved work

`reset()` asks before it touches anything and answers whether it was allowed. With `workspaces: true` the question is asked once for both parts, and nothing is reset if the answer is no.

## Switched off

No switch governs this page; `reset()` stays reachable whatever you switched off elsewhere.

## In depth

**The same path as `resetAll`.** With `workspaces: true` the workspaces' half runs through
`WorkspaceService.resetAll`, which is why the two halves share one question.

**The token.** The `APP_RESET_WORKSPACES` token is how the composition root hands the frame's reset
the workspaces' reset without the two slices depending on each other. `provideShell()` provides it;
you only meet it if you build your own composition root.

## Where the story is told

- [Resetting the arrangement](../distribution/resetting.md): the built-in commands and the dialog each one asks with.
- [Workspaces](workspaces.md): resetting one workspace, or all.
