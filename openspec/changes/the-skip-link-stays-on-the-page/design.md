## Context

The shell draws the skip link as `<a href="#lw-main-content">` and relies on the browser's fragment
navigation to move the focus. The target is the body of the pane that carries the address, which
has `id="lw-main-content"`, `role="main"` and `tabindex="-1"`. Fragment navigation is only a
same-document jump when the resolved URL equals the current one, and under `<base href="/">` that is
true at the root alone. See proposal.md for the failure.

## Goals / Non-Goals

**Goals:**

- The link moves the focus without navigating, at every address and under any base.
- The tests run where it broke: an address below the root.

**Non-Goals:**

- What the working area is. Which element carries the main landmark, and whether a second pane
  belongs to it, is the landmark change taken up for F-044. This change only makes the link reach
  the element that carries the address today, so that change can move the target without touching
  the link.

## Decisions

**The link handles its own click and keeps its `href`.** A click handler prevents the default and
focuses the target. Enter on a focused link raises a click, so one handler covers pointer and
keyboard. The `href` stays: without it the element is no longer a link to assistive technology and
falls out of the focus order.

Rejected: an `href` built from the current address (`/assistants#lw-main-content`). It would make the
jump same-document, but it writes a fragment into the address, which the router then carries, and it
has to follow every navigation. Rejected as well: a `<button>`. A skip link is announced and expected
as a link, and the audit's `skip-link` rule looks for one.

**The target is looked up when the link is used, not when it is drawn.** The pane that carries the
address can change while the link sits in the page, so the handler reads the current element by its
id. Where none exists, the default is still prevented and nothing moves: a reload is never the
fallback.

## Risks / Trade-offs

- [The focused element scrolls the content] → The target is the pane body, which is already in
  view; `focus()` is called with `preventScroll` so a scrolled surface keeps its position.
- [jsdom performs no navigation, so a unit test cannot see the reload] → The unit test asserts that
  the default is prevented and the focus moves; the browser case asserts that no document loads.
