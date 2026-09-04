# Switches

<!-- derived-from-specs -->

> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/`. For this page: `gesture-configuration` · `host-services`. Where this page and a specification disagree, the
> specification is right, and that is a defect in this page: change the behaviour there, then
> explain it here.

The capability switches, live: read them, change them while the application runs, and keep the capability when you take the control away.

## Do it

```ts
const switches = inject(FeatureSwitches);

switches.update({ content: { splitRight: false } }); // change switches while the app runs
```

## Read it

```ts
switches.content.splitRight();                        // Signal<boolean>: the current value
switches.current();                                   // the whole ShellFeatures set as it stands
```

Each group (`switches.content`, `switches.sidebar`, `switches.rail`, `switches.workspaces`, `switches.windows`, `switches.commands`) is a `SwitchSignals<…>`: one read-only `Signal<boolean>` per switch, under the same names as the declaration. `current()` is the whole `ShellFeatures` set as it stands. Read a switch where you draw your own control for the same capability, so the two never disagree:

```ts
// Your own split button, shown only while the capability is on.
@if (switches.content.splitRight()) { <button (click)="split()">Split</button> }
```

## What asks about unsaved work

Nothing on this page asks: `update` moves controls and closes no surface. Switching off acts forward, so nothing the user arranged is destroyed.

## Switched off

Every switch is on this page. The services on the other pages stay reachable whatever you switch off, which is the first rule under _In depth_.

## In depth

**Starting value, then live.** What you pass to `provideShellFeatures` is the **starting value**. From
there the switches are live: `update` takes the same partial shape as the declaration and merges
group by group. Every control, menu entry, drop target and shortcut that honours a switch follows it
at once.

**Three rules** to know before you reach for `update`:

- **A switch moves the control, it does not remove the capability.** With `content.close` off, the ×
  and the close entries are gone for the user. For you, `ContentTabsService.close()` still works,
  with the same unsaved-work question the × would have asked. That is what lets you hide the built-in control
  and offer the action from your own.
- **Switching off acts forward, not backward.** A pane the user split stays split when you turn
  `splitRight` off. A collapsed sidebar stays collapsed when you turn `sidebar.collapse` off, with no
  control left to expand it. Put the state where you want it before you take the way away.
- **The shell does not remember a switch.** `update` writes nothing to any store, and the next start
  begins from the declaration. If a change should survive, and for whom (device, user, tenant), store
  it yourself with the [persistence stores](../distribution/persistence.md)
  and replay it with `update` at start.

**The token.** `SHELL_FEATURES` stays exported as the declaration itself; read the current value
from the service, never from the token.

## Where the story is told

- [Switching capabilities off](../distribution/switching-capabilities-off.md#switching-capabilities-off): every switch, what it takes away, and the declaration with `provideShellFeatures`.
