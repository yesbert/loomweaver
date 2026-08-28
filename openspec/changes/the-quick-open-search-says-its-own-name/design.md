## Context

See `proposal.md` — Why.

Two facts decide most of this. The mode is already a signal on the search component, set from the
data the opening command passes, so nothing needs to be threaded anywhere to know which mode is
open. And both names already exist as translation keys, used today for the modes' other text: the
command search's title, and the title the quick-open command itself carries. Neither the wording nor
the plumbing has to be invented.

The dialog is opened bare and without a title, and the dialog outlet names a dialog only from its
title. A bare, untitled dialog is therefore unnamed. That is not specific to this surface; it is how
every bare dialog behaves today.

## Goals / Non-Goals

**Goals:**

- The name announced matches the mode, on the container and on the focused control alike.
- A test that pins it, since the automated audit cannot.

**Non-Goals:**

- Rewording either name. The existing keys are the product's wording and this change is about which
  one is used, not what it says.
- Auditing every other bare dialog in the shell for a missing name. If the fix turns out to belong
  in the dialog outlet, that becomes a broader question and gets its own change rather than being
  absorbed here.
- Changing the placeholder. It stays; it simply stops being the only thing that distinguishes the
  modes.

## Decisions

**Derive the field's name from the mode.** The search field's accessible name is currently a fixed
translation key. It becomes a computed one, chosen by the mode signal already on the component.
This is the whole of the defect as a user meets it, and it is a change to one binding.

**Name the container at the call site, not in the dialog outlet.** The commands that open the search
pass the mode; they can pass a title alongside it. Fixing it in the dialog outlet instead would mean
deciding what an unnamed bare dialog should fall back to across every bare dialog the shell opens,
which is a larger question with more surfaces to check.

Alternative considered and rejected for now: making the dialog outlet require a name for every
dialog. That is likely the right end state and it would close the same gap for surfaces nobody has
looked at yet. It is rejected here only because it is a different change with a different blast
radius, and bundling it would hide this defect's fix inside a refactor.

Open consequence worth stating: a bare dialog opened with a title today renders that title
visibly. Whether naming the container can be done without also drawing a heading the design does not
want is the one thing to check first; if it cannot, the container's name comes from an
`aria-label`-only path and the outlet gains that, narrowly.

**Test against the name, with the placeholder gone.** The test types into the field before
asserting, so that it cannot pass on the placeholder that the requirement explicitly refuses to rely
on.

## Risks / Trade-offs

**The container fix may reach further than one call site.** → If naming a bare dialog cannot be done
without drawing a heading, the outlet needs a narrow addition. That is still small, but it touches a
shared surface; the task list checks this before writing anything.

**Two names for one component may read as two components to someone scanning the code.** → It is one
component in two modes, which the mode signal already says plainly. The names follow the mode rather
than introducing a second concept.

## Open Questions

Whether the dialog container can carry an accessible name without a visible heading, given how the
outlet renders a titled bare dialog today. This does not change the requirement, the approach or the
task breakdown: either the call site passes a name, or the outlet gains an aria-label-only path, and
the first task settles it by looking.
