## Context

See proposal.md, *Why*. What shapes the approach:

- The quote document in the demo is a container of three child surfaces (positions, customer,
  margin) that opens for one quote. None of them takes input today, and none implements the dirty
  contract, so the shell has nothing to ask about. The plugin SDK publishes that contract, and the
  weaver guide *Unsaved changes* shows it on an editor view.
- The picker behind *New tab* lists content routes that are hosted at a bare path: no slash in the
  path, no parameter, no sub-routes, not chromeless. The demo's navigation is a tree under modules,
  which is what its ERP shape was built to show, so every route has a slash.
- The capture script photographs the demo from a known state per motif. A new motif is a name and
  the steps to reach the state.
- The guide `docs/the-workbench.md` already has a section for quick open and the picker with one
  picture, and a section under *What else comes along* for the unsaved-work prompt without one.

## Goals / Non-Goals

**Goals:**

- A visitor of the demo meets the unsaved-work prompt by doing something a bookkeeper would do.
- The *New tab* button in the demo opens something.
- Both can be photographed by the capture script and land on the pages that describe them.

**Non-Goals:**

- No persistence of the edit beyond the session. The demo has no backend, and a save that "works"
  is a save into memory.
- No decision here about whether the picker should offer nested routes. That is looked at with the
  demo in front of us, and answered in a platform change if it is a platform question.
- No new module, no new content beyond the field that is edited.

## Decisions

**The editable field is on the quote document, and it is one field.** A note or a payment-terms
field on the customer child is enough to make the surface dirty, and enough to show the prompt. A
whole form would be a feature of the demo's own, and the demo is not the product. The alternative,
a new "editor" view somewhere, would show the prompt on something nobody would edit.

**The dirty state is where the plugin SDK says it is.** The child surface implements the published
dirty contract with a save that resolves after writing to session state, exactly as the weaver
guide shows, so the demo is also a check that the guide's recipe works on a container child.

**The picker question is answered by trying the honest option first.** The overview dashboard is a
route the demo could host at a bare path without lying about its navigation; if it reads well in
the picker and in the tree, that is the answer and the demo changes. If a bare-path route sits
wrongly beside a tree of nested ones, the picker's rule is what should change, and this change
records that as a finding and leaves the motif out.

**Two motifs, same script.** `unsaved-changes` edits the field, closes the tab and waits for the
prompt; `tab-picker` opens the picker from the tab strip. No second tool.

## Risks / Trade-offs

**An edit that persists for the session can confuse the next screenshot run.** → Each capture
context starts with fresh storage, as the script already does for the welcome dialog.

**The bare-path route may prove the wrong answer after it is built.** → It is one route and one
line to take out; the finding is what stays.

**The e2e suite grows by a test that edits and closes.** → It runs nightly, not in the merge gate,
which is where the demo suite already lives.

## Open Questions

Which field on the quote document is edited, and whether the dashboard at a bare path reads well.
Both are settled by looking, and neither changes the approach or the tasks.
