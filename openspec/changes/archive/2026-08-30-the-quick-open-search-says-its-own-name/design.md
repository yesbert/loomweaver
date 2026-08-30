## Context

See `proposal.md` — Why.

Three facts decide this, and all three are settled rather than assumed.

The mode is already a signal on the search component, set from the data the opening command passes,
so nothing has to be threaded anywhere to know which mode is open. Both names already exist as
translation keys, used today for the modes' other text: the command search's title, and the title
the quick-open command already carries. Neither the wording nor the plumbing has to be invented.

And a bare dialog takes its title as an accessible name only. The dialog outlet renders a title
visibly in its non-bare branch; in the bare branch the title becomes the dialog's `aria-label` and
nothing else is drawn. Naming these two dialogs therefore changes nothing a sighted user sees.

## Goals / Non-Goals

**Goals:**

- The name announced matches the mode, on the container and on the focused control alike.
- A test that pins it, since the automated audit cannot.

**Non-Goals:**

- Rewording either name. The existing keys are the product's wording, and this change is about which
  one is used, not what it says.
- Changing the placeholder. It stays; it simply stops being the only thing that distinguishes the
  modes.

There is no non-goal about the shell's other bare dialogs, because there is nothing there to
exclude. Of the six the shell opens, four already pass a title — settings, the plugin store, and the
two curation dialogs. The two that do not are the two searches, and they are this change. What
looked like it might be a pattern is two forgotten arguments at one call site.

## Decisions

**Derive the field's name from the mode.** The search field's accessible name is a fixed translation
key today. It becomes a computed one, chosen by the mode signal already on the component. This is
the whole of the defect as a user meets it, and it is a change to one binding.

**Name the container where it is opened.** The commands that open the search already pass the mode;
they pass a title alongside it. This is not a choice between the call site and the dialog outlet: the
outlet already does its part, and four call sites already prove the route carries. The two that
forgot are the ones being fixed.

**Test against the name with the placeholder gone.** The test types into the field before asserting,
so it cannot pass on the placeholder that the requirement explicitly refuses to rely on. A test that
asserted before typing would have gone green against the defect.

## Risks / Trade-offs

**Two names for one component may read as two components to someone scanning the code.** → It is one
component in two modes, which the mode signal already says plainly. The names follow the mode rather
than introducing a second concept.

**The fix is invisible to the guard that would otherwise catch a regression.** → The automated audit
reports a control named for the wrong thing as correctly named, so it cannot protect this. That is
why the requirement states the limit and why the change owes a test rather than more auditing.
