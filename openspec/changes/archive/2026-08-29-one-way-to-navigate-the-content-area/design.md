## Context

See proposal.md — Why. The state that shapes the approach:

The workbench observes every navigation already. One effect reacts to the router settling and
reconciles the tab strip from the new address, and it can tell a navigation the workbench itself
started from one it did not, because the workbench's own call records its target first. Everything
this change needs is therefore observable at a point that already exists; nothing has to be
intercepted earlier.

The two behaviours that today sit only on the workbench's own call are different in kind. Handing the
address to the part of the arrangement that already holds the content is a reaction: it can happen
when a navigation is seen. Refusing to leave a pop-out is a veto: it has to happen before the
navigation completes, or the window has already left. Content addresses are gated by a guard today
that waits for the workspace to settle, so a veto has a place to live.

Whether the window is a pop-out is settled once, at startup, from the address the window was opened
at. That matters here: it stays true after a navigation has changed the address, which is exactly
the case this change is about.

## Goals / Non-Goals

**Goals:**

- One observable behaviour for a navigation, whatever started it.
- The fix lands where navigations are already observed and already gated, so there is no new
  interception layer and no new place a navigation can be missed.
- Both halves pinned by tests that would have caught today's behaviour.

**Non-Goals:**

- Not touching the plugin contract. `ctx.navigateContent` keeps its signature, its capability and its
  return value; it simply stops being the only form that behaves correctly.
- Not making the workbench's own call redundant. It stays the form a sandboxed plugin has, the form
  the capability broker can refuse, and the form that reports whether the navigation happened.
- Not widening what a plugin may do. A trusted, in-process plugin can already drive the router
  directly, with or without this change; a sandboxed one cannot reach it at all, because it runs in
  another document and only ever speaks over the boundary. The capability gate guards the workbench's
  call, never the browser's own navigation, and that is unchanged.
- Not revisiting which part of the arrangement carries the address, how the pointer moves, or what a
  pop-out shows.

## Decisions

**The hand-off moves to where a navigation is observed, and stays where it is for the workbench's own
call.** The reaction could be placed in one spot for every navigation, which reads tidier. It is
worse: for the workbench's own call the hand-off happens *before* the address changes, so the
arrangement is already right when the content arrives, whereas reacting afterwards would show the
content landing in one place and then moving. So the workbench's own path keeps doing it early, and
the observation point covers the navigations that path never saw. The reaction is a no-op when the
address is already carried by a part that holds the content, which is what makes running it in both
places harmless.

*Alternative rejected:* documenting the difference instead of removing it. That is what the situation
already amounted to, and it fails on the same ground every time: the form that misbehaves is the one
that looks like ordinary framework code, and the misbehaviour only shows up once a user has split a
pane or popped a tab out, which is not when the author is reading.

**The pop-out veto is a guard on content addresses, beside the one that already waits for the
workspace.** A pop-out exists to show one thing, and every content address is by definition an
address that would take it out of that. Refusing there is precise, and it needs no knowledge of who
started the navigation. The refusal reports itself to the developer in the same words the workbench's
own call already uses, so the two do not drift into two explanations of one rule.

*Alternative rejected:* refusing inside the tab layer, where the workbench's own call refuses today.
That layer sees a navigation only once it has been allowed, which is too late for a veto: the window
would have left the pop-out and been sent back, which is a flash rather than a refusal.

**Browser history is treated as an ordinary navigation, not as a special case.** Going back to
content another pane holds reaches it there. This follows from the requirement rather than being
chosen separately, and it is the behaviour a user would predict, since back is a request for content
they had.

## Risks / Trade-offs

- **The hand-off now runs on navigations it never ran on, including the first one after startup.** →
  It already declines in the two situations that matter: when the address names nothing addressable,
  and when the part carrying the address already holds the content. The observation point also waits
  for the stored arrangement to be restored before it reconciles, so it cannot act on a half-built
  one. Covered by a test that the first navigation of a session behaves as it does today.

- **A guard that refuses is easy to get wrong in the direction of refusing too much.** → It refuses
  only in a window that was opened as a pop-out, decided from the address the window started at
  rather than the address it is on. The main window is never affected. A test pins that the main
  window navigates normally with the guard installed.

- **Reaching an existing copy is a change of behaviour for an application that relied on the second
  copy appearing.** → Nothing in the published contract ever promised that, and the workbench's own
  call has behaved this way from the start, so the inconsistent half is the one being removed. Named
  in the proposal's Impact so it is not a surprise.

- **A test that only asserts "the tab exists" would pass against today's behaviour.** → The tests
  assert *where* it is: which part of the arrangement carries the address and that no second copy
  appeared, which is precisely what today fails.
