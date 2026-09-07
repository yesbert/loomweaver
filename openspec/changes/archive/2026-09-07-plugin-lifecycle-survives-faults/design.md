## Context

See `proposal.md` — Why. What the approach stands on:

- **The runtime keeps one context per active plugin id.** Activation creates a context, stores it
  under the plugin's id, and hands it to the plugin. A failure handler today looks the context up
  by id again, which is exactly why a late failure finds the wrong one: after a deactivate and a
  second activate, the id maps to the newer context.
- **Deactivation is four steps in a row**: undo the contributions, run the plugin's teardown,
  forget the context, release the grants. A throwing teardown stops after step two, and because
  unloading everything is a loop over that sequence, it stops the loop as well.
- **The translation namespaces are one provided value.** Each declaration provides the whole list,
  and Angular keeps the last provider for a token that is not a multi-provider. The loader injects
  that token and asks for one bundle per name in it.
- **The token that carries the namespaces is part of the published contract**, so a product may
  inject it. The scaffold already joins a second bundle into the existing declaration, so the
  generated path is not what this change repairs; the hand-written one is.

## Goals / Non-Goals

**Goals:**

- A failure can only ever undo the activation that produced it.
- Unloading a plugin always completes, and unloading all of them always reaches the last one.
- Declaring namespaces twice is a correct composition root, not a silent loss.

**Non-Goals:**

- No new reporting channel. Activation failures reach the developer console today, and the new
  failures do the same; routing them through a central error handler is a separate question.
- No change to the scaffold's joining of declarations, and no rewrite of what it already produced.
- No change to how a bundle is served or nested; only how many are asked for.

## Decisions

### A failure is matched to its activation by the context it was given

Each activation already creates its own context, so the failure handler receives that context
along with the error and compares it to the one currently stored under the id. Only when they are
the same is anything undone. When they differ, the failure is reported as belonging to an
activation that has since been replaced, and nothing is touched: the earlier context was already
undone when the plugin was deactivated.

The alternative, an activation counter per id, adds state the runtime would have to keep in step
with the map. The context is that state already.

### Deactivation undoes its bookkeeping whether or not the teardown throws

The teardown runs inside a guard, and forgetting the context and releasing the grants happen in
its finally branch, so the plugin is gone from the runtime's point of view even when its own code
failed. Undoing the contributions stays before the teardown, as today, because a teardown may rely
on the workbench no longer showing its surfaces.

Unloading everything collects each failure instead of letting the first one escape, and reports
them after the loop. That is what the spec means by "after everything has been undone": the report
must not be the thing that prevents the work. The failure is reported to the developer console,
which is where an activation failure goes today, and the method does not throw. A caller that
unloads everything is tearing down; there is nothing left for it to do with an exception.

The alternative, letting the first failure escape after finishing the loop, would make a teardown
that throws look like a failure of the caller. It is the plugin's failure, and it is reported as
such.

### Declarations accumulate behind the same token

Each call to declare namespaces contributes to a multi-provider that is private to the shell, and
the published token gains a factory that flattens those contributions in provider order and drops
a name that was already seen. The loader keeps injecting the published token and sees a flat list,
as it does today; so does any product that injects it.

The alternative, turning the published token itself into a multi-provider, would change the shape
a product receives when it injects the token, from a list of names to a list of lists. Keeping the
token's shape means no product changes, whether it declares once or twice.

Deduplication keeps the first occurrence, so the order a bundle is loaded in is the order it was
first declared in. Order matters only for which bundle wins when two declare the same name, and
that is the same bundle, so the choice is free; first occurrence is the one that reads naturally
in a composition root.

## Risks / Trade-offs

- **A product that injected the token to write its own provider for it** now finds that its
  provider replaces the factory and the accumulated declarations. → Accepted; the token is
  documented as read, not written, and the declaring function is the one door.
- **A late failure of a superseded activation is reported although nothing is undone.** A reader
  of the console sees a failure for a plugin that is working. → The report says it belongs to an
  activation that was replaced, so the reader can tell the two apart.
- **Collecting teardown failures delays the first report until the loop ends.** → The loop is
  synchronous and short; the delay is not observable.
