> **Status:** approved.

## Why

The demo has one rail, on the left, and it carries two unrelated things at once. Its top band is the
six modules, which answer *where am I*. Its bottom band is workspaces, settings, switch account and
sign out, which answer nothing of the kind. The rail work that landed earlier found exactly this
shape to be the weak one: a bottom band heavier than the band above it.

The workbench has offered a second rail all along. The testbed docks one on the right; the demo
never has, and three parts of the published contract are therefore invisible in the thing we show
people. *Move to the other rail*, with its menu entry, its drag and its `Alt+Shift+Arrow`, cannot do
anything with one rail. A rail entry that opens a menu on an ordinary click has no example. A rail
entry drawn from a person's initials rather than an icon has none either, although the account entry
is the case the contract describes it for.

## What Changes

- The demo declares a rail on the right. The left rail keeps the modules and settings; everything
  that is about the session or the arrangement moves to the right.
- **The assistant gets an entry**, at the top of the right rail, beside the panel it reveals. Today
  a visitor who collapses the assistant has no obvious way back to it.
- **Workspaces move** to the bottom of the right rail.
- **Switch account and sign out stop being two rail entries.** They become one account entry that
  opens a menu on click, headed by who is signed in. Signed out, the same entry offers to sign in.
- **The entry is drawn from the account it stands for**: one of the demo's two accounts carries a
  photograph, the other carries its initials. Switching between them therefore shows, in one
  gesture, the ladder the contract describes for such an entry.
- **Settings stays on the left**, at the bottom, where a visitor's habit puts it.
- The demo's translations carry the labels of the menu, in both languages.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. Every part of this is a distribution declaring its own chrome out of what the platform already
guarantees: a layout region, rail items, a menu slot with its contributions, and the auth gating a
rail item already accepts. The change declares `skip_specs` accordingly.

If drawing it turns out to need something the workbench does not offer, that is a finding worth its
own change, and worth more than a requirement guessed in advance.

## Impact

- `demo/src/app/app.config.ts` declares the layout and every rail item. The layout gains one region;
  the rail items split across two rails and three of them are replaced by one account entry.
- `demo/src/session/` holds the demo's session and its account status bar item. The account entry
  reads the same session, and the menu runs what the two rail items ran before.
- The demo's translations gain the account menu's labels.
- `demo/public/` gains the photograph the first account is drawn from. It is served by the demo
  itself, so no other origin has to be allowed.
- The demo's end-to-end suite knows one rail; a test that reaches for a rail item by position may be
  reaching into the wrong band afterwards.

No legacy source is dissolved by this change.
