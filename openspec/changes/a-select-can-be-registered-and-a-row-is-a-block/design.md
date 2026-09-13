## Context

See `proposal.md`, Why. What already stands, established by reading the code on 2026-09-13:

- **The select's registration exists and is guarded.** It sits beside the element, checks whether the
  tag is already defined, and registers the select and the option together. The workbench calls it
  on start, and the script served to isolated surfaces calls it too. Only the package's entry file
  leaves it out, while icon, tooltip, button, markdown, navigation tree, menu and progress ring are
  exported. The published contract is the packed type declarations, so that is where the fix is
  confirmed.
- **The settings row's host has no display.** The component names no host class and no style sheet
  mentions the tag, so the host computes to inline. Its template is a flex container with its own
  padding, which is why the row looks right and its edges do not.
- **The settings surface separates rows with a divider on the container**, which is the case that
  draws nothing today.

## Goals / Non-Goals

**Goals:**

- Nothing the brief names as an element used by tag lacks a published registration, now or later.
- The row's outer box is a block, so borders and dividers aimed at it render.

**Non-Goals:**

- Changing how the workbench registers its elements on start.
- Giving the row a separator, spacing change or compact form of its own.

## Decisions

**Export the existing function rather than write a new one.** It is already idempotent and already
registers both tags. A second entry point would be a second thing to keep equal.

**Pin the rule with a test over the elements the workbench registers, not over the brief's prose.**
The workbench's start already lists every element it registers. A test that takes that list and
asserts each registration is reachable from the package entry fails the day an element is added
without being published. Parsing the brief for tag names would tie the test to wording and miss an
element the brief forgot.
*Alternative considered:* a repository guard script over the packed declarations. It would check the
real contract, but it only runs after packaging, so the failure arrives later and further from the
change that caused it. The unit test catches the same mistake at the source; the packed declarations
are still inspected once by hand when this change is applied.

**Make the host a block through the component's own host binding, not a rule in the shipped style
sheet.** The fault belongs to the component, and a consumer that uses the row without the precompiled
styles, or before they load, should still get a block. A host class keeps it in one place and is
covered by the component's own test.
*Alternative considered:* a `lw-setting-row { display: block }` rule beside the element defaults. It
works, but it separates the component from a fact about its own box.

## Risks / Trade-offs

- **A consumer who worked around the missing separator now draws two.** → Only where they added a
  border of their own to the row's surroundings. The changelog names it.
- **The export test follows the workbench's start list.** An element the workbench stopped
  registering on start would also drop out of the test. → That would be a visible change of its own,
  since the workbench's chrome would stop drawing it.
