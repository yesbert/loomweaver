## Context

Every strip in the workbench, whether a pane of the main area, a sidebar or a container's inner
strip, is drawn by one tab strip component. Each tab is a native button with the tab role, so each is
in the focus order and Enter or Space already chooses it. Alt with an arrow reorders tabs through the
reorder directive on the same list element, and Alt+Shift with an arrow moves a view between sides.
The plain arrow keys, Home and End are unused on a tab. The strip component is 379 lines long, close
to the 400-line limit the structure check enforces.

## Goals / Non-Goals

**Goals:**
- The tabs keyboard pattern of the WAI-ARIA Authoring Practices, with manual activation, on every
  strip.
- Nothing the keyboard can do today stops working.

**Non-Goals:**
- An option for automatic activation (focus chooses). No one has asked for it, and a choice of tab
  navigates, which may load content or start a frame.
- Vertical arrow keys. The strips are horizontal; up and down stay free.
- The rail. It is not a tab list.

## Decisions

**A directive on the tab list owns the roving focus.** It reads the tabs from the list element when it
needs them, so it follows tabs that come and go without the strip telling it anything, and it leaves
the strip component untouched. Rejected: a `tabindex` binding per tab in the strip's template, backed
by a focused-tab signal in the component. It would put the state where the strip already owns drag,
reorder, menus and closing, and push the file past its limit.

**Which tab is the stop.** After each render, and whenever the focus enters or leaves the strip, the
directive gives `tabindex="0"` to one tab and `-1` to every other: the tab holding the focus while the
focus is in the strip, otherwise the selected tab, otherwise the first. Rejected: keeping the tab that
last had focus as the stop after the focus leaves. After the selection changes by pointer or by
navigation, re-entering would then land on a tab that is no longer the one shown, and the pattern's
guidance is to enter on the selected tab.

**Only unmodified keys.** Any key pressed with Alt, Ctrl, Meta or Shift is ignored, so the reorder and
move chords reach their handlers unchanged. A handled key's default is prevented, so a page does not
scroll on Home or End.

**Tabs are found by role, scoped to the list.** A tab counts only when its nearest tab list is the
directive's own element. A container's inner strip is a separate list with its own directive, so the
outer strip never walks into it and the other way round.

## Risks / Trade-offs

- [End-to-end tests that press Tab to reach a later tab] → Search the suite for them and move them to
  the arrow keys; the new behaviour is the point of the change.
- [A tab re-rendered under the focus loses its `tabindex`] → The directive re-applies after every
  render, so the stop is restored in the same frame.
- [Bundle size of `loom-shell`, at 919.5 of 920 kB] → The directive is small, but may cross the
  ceiling. If it does, the ceiling is raised by one step as a deliberate change, with the reason in the
  pull request.
