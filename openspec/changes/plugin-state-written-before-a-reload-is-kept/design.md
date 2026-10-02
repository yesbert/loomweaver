## Context

`PluginStateService` and `ViewStateService` each carry their own trailing 400 ms timer per key.
Neither listens for the page going away, and neither bounds how long a busy key can postpone its
write. The plugin store already flushes when its last watcher is released; that covers a surface
being closed, not a reload. See proposal.md for the finding.

## Goals / Non-Goals

**Goals:**

- One held-write mechanism for both services, flushed when the page goes and bounded in its wait.
- No change to what a plugin or a product's store has to do.

**Non-Goals:**

- An immediate write a plugin can ask for (`set(value, { now: true })` or a `flush()`). The finding
  offers it as an alternative; with the flush on leaving and the bound it has no case left, and it
  would be a second way to say the same thing.
- Guaranteeing completion against an asynchronous store. The port has no synchronous or keep-alive
  write, and adding one is a change to the port, not to this defect.
- The layout stores (pane trees, panels). They do not debounce.

## Decisions

**One writer, owned by the persistence slice.** A small service hands out a held write per storage
key: `schedule(serialised)`, `cancel()`, `flush()`. It keeps the set of keys with something held, so
that leaving the page flushes them in one pass. Both services drop their own timers. The alternative,
adding a listener and a second timer to each service, repeats the defect's cause: the same rule
written twice.

**`pagehide`, not `beforeunload`.** `beforeunload` is cancellable and already carries the
unsaved-work prompt; flushing there would write before the user has decided to leave, which is
harmless but fires on a cancelled leave too. `pagehide` fires once the page is really going,
including on a reload, and is the event the back/forward cache honours. `visibilitychange` would
also flush on every tab switch, which is more writes for no gain on a desktop workbench.

**The bound is a maximum wait of 2000 ms, measured from the first held write.** Short enough that a
crash or a killed tab loses two seconds at most, long enough that a store behind a network call sees
a filter being typed as one or two writes. The 400 ms of quiet stays as it is. Both are constants;
no product has asked to tune them, and a switch nobody asked for is not offered.

**View state writes what was scheduled, not what the signal holds later.** Today the view-state
timer reads the signal when it fires and skips `undefined`. With the shared writer the serialised
value is captured at `set`, as the plugin store does; `reset` and `clear` cancel the held write, so
a cleared value cannot be written back on leaving.

**Each window flushes its own.** A pop-out has its own services and its own `pagehide`.

## Risks / Trade-offs

- [A network store's write on `pagehide` may be dropped by the browser] → stated as the limit of the
  guarantee in the spec and in the backend guide; the bound keeps the loss to two seconds of work.
- [A product's store sees more writes under continuous change] → at most one per key per two
  seconds, named in the backend guide's write profile.
- [Fake-timer tests of both services assume a single 400 ms timer] → they keep passing for the quiet
  case; the new cases are added beside them.
