## Context

See proposal.md, *Why*. What shapes the approach is where the demo declares its chrome today.

Everything in the rail is declared statically in `demo/src/app/app.config.ts` through
`provideRailItems`, and the two account entries carry an inline `run` that calls the demo's own
session object. The session itself is a small signal store with two accounts and a signed-out state,
already read by the shell through `provideAuthSource` and by the status bar item beside it.

A statically declared item is a value, not a signal. It cannot say *Gambit the Cat* in a menu heading
and then say *Jonas Weiler* after the switch. The contract's answer to that is registration from a
plugin: `registerRailItem` and `registerMenuItem` both replace by id, so registering the same id
again is how an entry changes. The demo has no plugin for its session yet.

## Goals / Non-Goals

**Goals:**

- Make the two bands of the rail answer one question each: the left says where the visitor is, the
  right says what surrounds them and who they are.
- Show the three parts of the rail contract the demo cannot show with one rail: moving an entry
  across, a menu opened by an ordinary click, and an entry drawn from a person rather than an icon.
- Keep every behaviour that exists today reachable, including from the command palette.

**Non-Goals:**

- A notification centre. An entry with a count needs a store of messages the platform does not keep,
  and inventing one here would be a product feature wearing a demo's clothes.
- The plugin store. The demo declares no catalogue, so the entry would open on an empty shelf. It is
  worth its own change.
- Moving theme, look or language out of the bars they sit in. A rail of switches becomes the drawer
  where everything unplaced ends up.

## Decisions

**The account is one entry that opens a menu, not two entries that act.** Today *Switch account* and
*Sign out* are two rail items, and neither says whose account it is about. One entry drawn from the
signed-in person, opening a menu headed by their name, says it once and reads as the thing every
workbench puts in that corner. The contract has the exact shape for it: `menuTrigger: 'primary'`
makes the ordinary click open the menu, `menuHeader` names who it is about, and `initials` draws the
entry from the person rather than from a fixed glyph. Rejected alternative: keeping two entries and
adding a third that shows the name, which is three entries where one is meant.

**The session becomes a plugin of the demo, and registers that entry itself.** The heading and the
initials change when the account changes, and a statically provided item cannot. A small
`session` plugin registers the rail item and re-registers it as the snapshot changes, which the
contract's replace-by-id rule turns into an update rather than a duplicate. The same plugin
registers the menu's entries and the commands behind them, so *Switch account* and *Sign out* stay
in the palette, where they are today. Rejected alternative: leaving the item in `app.config.ts` with
a fixed icon and no name in the heading, which is less code and gives up exactly the thing worth
showing.

**One account carries a picture, the other its initials.** The contract draws such an entry from a
picture where there is one, from initials where there is not, and from an icon where there is
neither, and the host falls back on its own so a caller never handles the ordinary case. Giving both
accounts a photograph would hide two thirds of that; giving neither would hide all of it. So the
first account carries one and the second does not, and switching between them shows the ladder in a
single gesture. The picture is a real photograph rather than a generated placeholder, because a
placeholder avatar reads as a placeholder and says nothing about what the entry can do. It ships in
`demo/public/`, served by the demo itself, since reaching a picture is the caller's own affair and a
foreign origin would have to be allowed by the demo's content policy for no gain.

**Signed out, the same entry offers to sign in.** The rail item's own `access` gating hides an
entry the session does not meet, which would leave a hole where the account was. So the entry is
always there and its menu follows the session: signed in it offers switching and signing out, signed
out it offers signing in. The heading then names the product rather than a person.

**The assistant entry runs a command, not an inline reveal.** Revealing a docked surface needs the
plugin context, which a statically declared rail item does not have. The agent plugin gains a
command that reveals its own chat surface, and the rail item names that command. As a command it is
also in the palette, which is where a visitor who has hidden the rail will look.

**Settings stays on the left.** It is the one entry in the bottom band that is neither session nor
arrangement, and every workbench a visitor knows keeps it in the bottom left corner. Habit wins over
symmetry here.

## Risks / Trade-offs

- **A rail item that re-registers on every session change could flicker or lose its place.** The
  contract says last-in wins by id, and the rail keeps an item's band and order from its
  declaration, so the replacement lands where the original stood. Mitigation: a test that switches
  the account and reads the entry back, rather than trusting the rule.
- **The end-to-end suite reaches for rail entries.** A test written when there was one rail may find
  the wrong band, or nothing. Mitigation: the suite is read through before the change is called
  done, not after the next failure.
- **Two rails are two edges to lay out.** The right rail sits between the content and the assistant
  panel, and the window gets narrower for everything else. Mitigation: it is looked at once at a
  small window before the change is closed, the way the modules were.

## Open Questions

None.
