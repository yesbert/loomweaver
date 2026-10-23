## Context

See proposal.md for the finding. Each affected control sets its name with `aria-label` from its purpose
alone (a title, a command's title, a translation key) and draws other text beside it: initials, a
shortcut hint, the active view, a person's name. The checker reads the drawn text even where it is
`aria-hidden`, because a person who speaks commands sees it, and it compares word for word: the drawn
words must appear in the name as one contiguous run, case and punctuation aside.

The content tab with a badge is a different case. Its name is "Export, New" and it draws "Export" and
"New", but the two spans sit side by side with no whitespace between them in the page, because the
template compiler drops whitespace between elements. Anything that reads the drawn text gets
"ExportNew", one word that is not in the name.

Measured on the testbed with axe-core 4.14: the rail entry with initials, the status-bar entry with
initials, the command palette entry, the quick open entry, the view switcher and the badged tab. The
menu heading that leads to a command is NextPA's observation; the testbed's account menu heading
leads nowhere, so the audit does not reach it today.

## Goals / Non-Goals

**Goals:**

- Every control in the list passes the label-in-name check, and the audit runs the check.
- A product that declares a bar button with a label and a tooltip gets a correct name without knowing
  the rule.

**Non-Goals:**

- Naming what a distribution draws in its own component. That is the distribution's, as the limit in
  the spec says.
- Changing what any control shows. The look stays as it is.

## Decisions

### One function composes a name from what is shown and what it is for

A pure function takes the words a control shows and its purpose, and returns the name: the shown
words first, the purpose after them, joined by a comma. Where the purpose already contains the shown
words as a run, it returns the purpose unchanged, so a bar button whose tooltip already says its label
("EN, Language") is not named twice, and a button with a label and no tooltip stays named by its label.
Every affected template calls it instead of binding a title directly.

The comma follows the form the tab strip already uses for a title and its badge ("Export, New"), so a
screen reader pauses the same way everywhere.

It lives where every slice may read it. The shell's `foundation/` folder is at eleven concepts and takes
one more; if the structure check disagrees, it goes beside the menu wording instead, which already
composes names.

*Rejected: drop `aria-label` and let the name come from the content, with the purpose as visually hidden
text.* It gives the same name, but the name would then depend on the order and visibility of spans in
six templates and in the menu heading the shell draws by hand. One string from one function can be
pinned by a unit test per control; six DOM arrangements cannot.

*Rejected: draw initials as a decorative pseudo-element.* The checker would stop seeing them, but a
person still sees "NR" and may say "click NR". Putting them in the name makes that work; hiding them
from the checker only hides the defect.

### A shown shortcut goes after the purpose, and is announced as a shortcut

The command palette entry is named "Command palette ⌘K", the way a menu row with a shortcut is named
by its content today. The shortcut is a hint, not the control's label, so it follows the purpose rather
than leading it, which the check accepts because it asks for containment.

The control also carries `aria-keyshortcuts`, derived from the same chord the hint is drawn from: the
neutral modifier becomes Meta on macOS and Control elsewhere, the neutral delete key Backspace or
Delete. Deriving both from one chord means the spoken shortcut and the drawn one cannot disagree. The
same applies to a declared bar button that shows a shortcut.

*Rejected: keep the hint out of the name and announce it only through `aria-keyshortcuts`.* The check
still sees the drawn ⌘K, and the workbench draws its shortcuts on purpose.

### Shown parts are separated by real spaces

The template compiler drops whitespace between elements, so two spans side by side read as one word
to anything that reads the drawn text: "ExportNew" in a badged tab, "GHAccount" in a named rail entry
with initials, "Ada Lovelaceada@testbed.local" in a menu heading. Each place that draws two parts
side by side puts a whitespace text node between them: the tab's title and badge, a rail entry's
initials and name, a bar button's mark, label and hint, a menu heading's mark, name and second line.
Every one of these containers lays out as a flex box, where a whitespace node is not drawn, so
nothing changes on screen.

### The audit moves to axe-core 4.14

`@axe-core/playwright` goes to 4.14, which bundles the axe-core release where the rule is no longer
experimental. The audit's tags stay as they are; the rule is in `wcag21a`. This is part of this change
and not of the general dependency update, because without it the fix has no test.

## Risks / Trade-offs

- [A test or a product that finds a control by its exact old name, such as a button named "Account",
  stops finding it] → Our own end-to-end helpers are updated in this change. The release notes and the
  reply to F-055 name every control whose name changed, so NextPA can adjust its selectors when it
  adopts the release.
- [Names get longer for a screen reader, "NR, Account" instead of "Account"] → That is the cost the
  criterion asks for. The initials come first because that is what a person sees and says.
- [The menu heading's name repeats everything it shows: initials, name, address, then the purpose] →
  Accepted. The heading shows all three, and the check reads all three.
- [The audit catches only the controls on the screens it visits] → The unit tests pin each name
  directly, including the menu heading the testbed's audit does not reach.
- [A saved workspace in the rail shows initials derived from its name, so it is now named "QC,
  Quarter close" rather than "Quarter close"] → Accepted: the initials are what the rail shows when
  it shows no names, and the rule makes no exception for initials that abbreviate the purpose.

## Found while applying, left to its own change

An open submenu fails the same check, and not because of a name. The submenu is a menu nested inside
the entry that opens it, which is the form a weaver writes by hand, so while it is open every entry
in it counts as text the opening entry shows ("Set status Open Waiting Resolved"). No name can contain
that. The fix moves the open submenu out of the opening entry while keeping the authoring form, and it
touches how a published element is built, how its events travel and how it is placed. It gets a
change of its own. Until that lands, the testbed's submenu audit fails on this rule, and nothing
else in it does.
