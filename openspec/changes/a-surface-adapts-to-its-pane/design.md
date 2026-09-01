## Context

See proposal.md — Why. Three pieces of current state shape the approach.

The workbench mounts a surface in exactly three hosts: the content pane, the secondary pane beside
it, and a side panel. None of them establishes a sizing reference today, so a template's adaptive
rules resolve against the window.

Tailwind 4 carries container queries in core, with no plugin. An element becomes a reference with
`@container`, optionally named with `@container/<name>`, and a descendant targets it with
`@<size>:` for the nearest one or `@<size>/<name>:` for that one by name. The scale is its own:
`@md` is 28rem, `@3xl` is 48rem, and none of these numbers is the viewport breakpoint of the same
name. Tailwind is optional for our consumers, so whatever the shell does has to be legible to a
product writing plain CSS as well.

The repository already converted every weaver view except the two dashboards, each view declaring
`@container` at its own root and using bare `@md:` inside. Whatever the shell adds must leave those
views working untouched.

The tour recording has no tooling. Both commits that produced `assets/media/tour-*` added media files
only; the script is not in any branch, stash or sibling checkout, and not in the private context
repository either. It is gone rather than misplaced.

## Goals / Non-Goals

**Goals:**

- One reference, established by the workbench, that a surface author gets without arranging anything
  and cannot accidentally forget.
- The two dashboards laid out from the pane's width, with no horizontal overflow at any pane width
  the workbench can produce.
- A tour recording that is a command in the repository, so the next person to change a dashboard can
  reproduce the video instead of rebuilding the apparatus.

**Non-Goals:**

- Tokenising sizes. The dimension question stays where `docs/reference/design-tokens.md` leaves it:
  colour and type are tokens, measurements are utility classes.
- Converting the views that already carry their own reference. They are correct and stay as they are.
- Reproducing the previous tour frame for frame. It is a new recording of the same four beats.
- A general responsive-layout kit for weaver authors. The workbench supplies the reference; what an
  author does with it is the author's layout.

## Decisions

### The reference is a named container on each surface host

Each of the three hosts gets `@container/surface`, which both establishes the reference and names it.

Naming it does two useful things at once. A view that declares nothing still resolves bare `@md:`
against the pane, because the shell's reference is then the nearest one. A view that declares its own
`@container` shadows that for bare variants, exactly as it does today and as the already-converted
views rely on, while `@md/surface:` still reaches past it to the pane. So the guarantee holds for
both kinds of view, and the existing ones need no edit.

Alternatives considered. An **unnamed** `@container` on the hosts is one character shorter to use and
was rejected because a view with a nested container of its own would then have no way to reach the
pane at all. Asking every **author to declare** their own, which is the status quo, was rejected
because it is the thing that failed twice. A **width observed in TypeScript** and published as a
signal was rejected because it re-implements in script what the browser does in layout, and it would
not reach a plugin that styles with plain CSS.

For a product not on Tailwind, the name is the contract: `@container surface (width >= 40rem)` in an
ordinary stylesheet. That is worth a paragraph in `docs/reference/design-tokens.md`, next to the
existing note that the tokens work with any framework.

### Containment side effects are checked, not assumed

`container-type: inline-size` implies `contain: layout style inline-size`. The host becomes a
containing block, so a `position: fixed` descendant is positioned against the pane rather than the
window, and the host's own width stops depending on its contents.

The second effect is the one we want, and it is the same mechanism that fixes the chart cards. The
first is a behaviour change we do not want, and it is why this is a decision rather than a one-line
edit. Anything the workbench floats out of a surface — a context menu, a tooltip, a dialog, the
command palette, a drag ghost — has to still be positioned against the window. The suite already
covers each of those, so the check is to run them rather than to reason about them:
`menu`, `tooltip`, `dialogs`, `palette-polish` and `pane-drag`.

Should one of them prove to be positioned inside a surface rather than at an overlay root, the fix is
to move that overlay to the root, not to drop the containment.

### A container breakpoint is chosen from pane widths, not translated from the viewport one

`sm:` does not become `@sm:`. The viewport number includes the launcher rail, any open side panel and
the pane's own padding; the container number is the content width that is actually left. Each
breakpoint is therefore picked from the width at which that particular layout stops fitting, which is
a matter of looking at it, and the e2e test then pins the result rather than the reasoning.

### A card is allowed to shrink

Two things keep a card open today, and both are defaults rather than intentions. A grid or flex child
does not shrink below its content unless it is told to, and a chart canvas reports a content width.
So the cards that hold a chart are allowed to shrink, and the chart wrapper stops asserting a height
that is only right at one width. Without this the container queries alone would fire correctly and
the card would still overflow, which is why it is part of the same change rather than a follow-up.

### The tour is recorded by a script that drives the browser, not by the test runner

`platform/tools/record-tour.mjs`, beside the other checked-in tools, using the Playwright library
directly rather than the test runner. A tour is a timed animation, and the runner's parallelism,
retries and per-test timeouts work against that; there is also nothing to assert.

It records the testbed at 1280 by 800 to match what the current media is, runs the choreography twice
against the light and the dark theme, and hands the results to `ffmpeg` for the MP4, the GIF and the
poster still. It writes into `assets/media/` under the names the website's sync already demands, so a
partial run is caught by the site build rather than by a reader.

The cursor and the captions are drawn by the script as elements in the page before each beat, not
added afterwards in an editor. That is what makes the run reproducible, and it is also the only way
the GIF carries the captions, since a GIF has no subtitle track.

`ffmpeg` is a developer's tool here, not a dependency of the product: the script checks for it and
says what to install if it is missing, and nothing in CI runs it.

## Risks / Trade-offs

- **Containment changes where a fixed-position element lands.** → Run the five suites named above
  before anything else in the change is judged; treat a failure there as a signal to move the overlay
  to the root, not to abandon the containment.
- **The new tour will not look like the old one.** The timing, the cursor and the caption wording are
  being written from scratch, because only the output survived. → Accepted, and named in the proposal
  so it is not discovered at review. The four beats stay the same, and the split beat gains a
  dashboard that now behaves.
- **A container reference on a scrolling host is a place bugs hide.** The content host both scrolls
  and would now contain. → The narrow-pane tests assert the absence of horizontal overflow rather
  than a particular layout, so a regression shows up as a failure rather than as a look.
- **`ffmpeg` is not everywhere.** → Only a maintainer recording a tour needs it; the script fails
  with an instruction rather than a stack trace.
- **Pinning "nothing overflows" can pass vacuously** if the test measures an element that was never
  going to overflow. → Each test measures the dashboard's own scroll width against its client width
  at a pane width taken from a real split, and one of the two asserts the failure mode first by
  running against the unfixed template during implementation.
