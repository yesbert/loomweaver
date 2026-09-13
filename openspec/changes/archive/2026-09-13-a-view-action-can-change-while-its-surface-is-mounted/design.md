## Context

See proposal.md, *Why*. What shapes this is that the mechanism for a rename already exists and the
actions were left out of it on purpose: the design note of the rename change decided that a rename
reaches the name only, and that adding a second thing later is additive while taking one away is
not. This is that second thing, asked for by a product.

A registered surface lives as one entry in the contribution registry, keyed by id, and its actions
are an array on that entry. The panel header computes the actions it draws from the entry the
registry holds, so replacing the entry in place, the way a rename does, already reaches it without
its being told.

The pane tab strip can draw a tab's actions too, but nothing feeds it any: the projection that
turns a registered entry into a tab carries an actions field that no producer fills. A surface
open in a content pane therefore shows no actions today, registered or replaced, which is a gap of
its own and older than this change. This change leaves it as found and adds the pressed state to
the strip's drawing all the same, so that the day a producer fills the field the strip is already
right.

The workbench already has one control whose selected look is driven from `aria-pressed`: the
segmented control, whose styling note says the accessible state *is* the styling hook so the two
cannot drift apart. The icon button the header and the strip use for actions has no such rule yet.

Actions exist on one runtime today. In-process, a plugin holds the action object it registered. A
sandboxed plugin sends its surface over the frame boundary as plain data, and the reduction that
happens on the way in keeps id, title, icon, order and the docking fields and drops everything
else, actions among them. Neither the specification nor the sandboxed-surfaces guide says so; it
is simply what the code does. A sandboxed surface therefore has no actions for this change to
replace, and giving it some is a different change: it would have to decide that a sandboxed action
names a command and never a callback, and carry `access` or refuse it, as the registration path
already refuses `access` today.

## Goals / Non-Goals

**Goals:**

- One call and one field, both plain data, so that the day a sandboxed surface carries actions the
  same call can be offered over the frame boundary without changing shape.
- A toggle that is a toggle to the eye and to assistive technology, with one source for both.

**Non-Goals:**

- Feeding a content pane's tab strip the actions of the surface open in it. See *Context*: the
  strip draws what it is given and is given nothing, and deciding what a content surface's actions
  should look like beside the pane's own controls is a change of its own.
- Actions on a sandboxed surface, and with them this call over the frame boundary. See *Context*:
  that is a gap of its own, named here and in the specification's limit, and left for a change that
  decides what a sandboxed action may carry.
- Removing an action after registration. A toggle needs to change, not to vanish; a caller who
  wants an action to disappear has a different need, and a removal can be added beside this later
  without unpicking anything.
- A live, self-updating action: no signal-valued field, no function the header calls on every
  render. See the first decision.
- A pressed state on rail items or bar buttons. Those have their own active vocabulary already,
  and the finding is about the actions on a surface.

## Decisions

**The action is replaced by a call, not read live from a signal.** The finding offers both. A
signal or a function on the action would be the more Angular-shaped answer in-process, and it
could never be offered to a sandboxed plugin, because neither survives the frame boundary: what
arrives is the value at send time, and the host would draw a state that never moves. Choosing it
now would bake in a shape that the sandbox can never share, so that when sandboxed surfaces do get
actions the contract would hold one way in-process and another over the frame. A call that carries
plain data is a shape both can share. The cost is that the plugin has to call it when its state
changes, which a plugin with a toggle already knows the moment of.

**One call upserts one action by id, on the surface named by id.** Alternatives considered: a call
that replaces the whole actions array, and a call that replaces only an action that exists. The
whole array would make every caller re-state actions it did not mean to touch, and would make it
easy to drop one by accident. Replace-only would refuse the case where an action appears after
registration, such as an action that only makes sense once something is loaded; adding the id then
is the natural extension of the same call and costs nothing. Upsert by id, ordered as the action's
own order says, is the shape that serves both without a second door.

**An unknown surface id is a no-op, like a rename.** A warning would be the alternative, and a
rename does not warn either; the two calls sit beside each other and behave the same.

**The state is one optional boolean on the action, drawn as `aria-pressed`.** Three values are
meaningful: on, off and not a toggle. `true` and `false` set the attribute; absent leaves it off,
so an action that says nothing is drawn and announced as it was before this change. The visible
pressed look hangs off the same attribute, the way the segmented control does, so what is announced
and what is seen cannot disagree. Alternatives: a `checkedWhen` against a context, as menu entries
have, which would need a context the actions do not carry; a separate `kind: 'toggle'` beside the
boolean, which says nothing the boolean's presence does not already say.

**It lives on the `ctx`, under the contributions permission.** The same permission a rename and a
registration need, because it changes what the workbench draws for the plugin's own contribution
and nothing else.

## What the tests can and cannot show

The assertion that a replaced action does not rebuild the surface will pass today and would also
pass under a re-registration, for the reason the rename change's note records: re-registration
overrides the entry in place. The assertion is kept as a guard, not as evidence that this path is
gentler; the argument for the call is that it does not re-run the registration path with its
warnings and checks to change one button.

Nothing here exercises the sandbox, and a test that a sandboxed surface has no actions to replace
would pin an accident rather than a guarantee, so none is written. The limit is stated in the
specification instead, which is where a reader looks for what holds on which runtime.

## Risks / Trade-offs

- A plugin that replaces an action on every state change but forgets one transition leaves a
  toggle showing the wrong state. → That is the price of a call over a live binding, stated
  plainly in the JSDoc: call it when the state changes. A live binding would not have worked in the
  sandbox at all.
- An upsert that adds an action can be used to grow a header without limit. → No different from
  registering many actions in the first place; the header already deals with many.
- The pressed look is added to a shared icon-button class used by every toolbar and strip control.
  → It only takes effect where `aria-pressed` is set, and nothing in the workbench sets it on an
  icon button today, so no existing control changes.
