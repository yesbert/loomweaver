## Context

`chrome-item-menu.ts` answers two questions with pure functions: which slot an item opens on
activation (`menuOnActivate`, from its declaration alone) and whether the item is offered
(`isOffered`, which since 0.15.0 asks the menu service whether the slot offers an entry). Rail, bar
and surface actions each bind the first to the menu directive and return early from their click
handler when it answers. `MenuService.offers` counts a heading that leads to a command as an entry,
because a menu holding only such a heading still opens.

## Goals / Non-Goals

**Goals:** one answer per item to "what does activation do now", used for drawing, for the directive
and for the click handler, so the three cannot disagree.

**Non-Goals:**

- A split button with a separate chevron. It would be a second control per item in every header.
- Reading a slot from a plugin.
- Changing a control that has no action of its own.

## Decisions

**The decision moves into one small service.** `ChromeItemOffers` takes an item and the context it
would open its menu with, and answers `offered` and `menuOnActivation`. It holds the command and menu
services, so the five call sites stop assembling the same two callbacks. The pure functions stay for
what depends on the declaration alone.

**Empty means no entry besides the item's own heading, when the item has an action.** For an item
with an action the emptiness check passes no heading; for one without, it passes the heading as in
0.15.0, since there a heading that leads somewhere is the only thing to open. This is what lets a
plugin declare `command`, `menu`, `menuTrigger: 'primary'` and a `menuHeader` naming the same command:
alone it runs the command, in company it opens a menu with that command first.

**The directive is told nothing while the menu is empty.** The binding for the menu on activation
answers the slot only while it will open, so the control carries no `aria-haspopup` and its click
reaches the ordinary trigger.

**The warning goes.** It told the author that the action never runs. That is no longer true, and a
warning for "your action runs only while the menu is empty" would fire for the intended use.

## Risks / Trade-offs

- [A click does two different things depending on other plugins] → the same is true of any menu that
  others fill; the announcement and the opened menu say which. The guide shows the pattern with the
  heading so the action stays one click or two away.
- [An item written for 0.15.0 with both an action and a menu reappears while its menu is empty] →
  it does what its action says, which is what its author declared.
