> **Status:** approved.

## Why

The catalogue models one way a plugin arrives: a user browses it, is shown what the plugin would be
permitted to do, agrees, and installs it. That is the right model for software a person chooses for
themselves, and it is the wrong model for software an organisation issues.

In a business deployment the decision was made before the user opened the application. A team
publishes an application, an administrator enters it in the catalogue with the rights it needs, and
it is simply *there* the next time anyone loads the workbench — or gone, if it was withdrawn. Asking
each user to consent to something they cannot decline in any meaningful sense is not a safeguard; it
is a dialog in the way of their work, and it puts a support ticket one misclick away.

So there are two authorities, and the platform currently knows one of them. What the user chooses is
theirs to consent to, revoke and remove. What the operator deploys is none of those things.

## What Changes

- **A catalogue can carry plugins that are deployed rather than offered.** A deployed plugin is
  active because the operator said so; it holds the rights the entry names, without a consent dialog.
- **The catalogue is read when the application starts**, not only when someone opens the store, so
  that adding an entry reaches every user on their next load and withdrawing one removes it the same
  way.
- **What survives a lost catalogue is defined.** Deployed plugins become something the application
  needs in order to be itself, so a failed fetch must not silently produce an application without its
  features. The last known set is kept through the port that already exists for such things.
- **Three guarantees gain their subject.** That installing asks, that the user may manage and remove
  what is installed, and that any granted capability may be withdrawn are all true of what the user
  chose. None of them is true of what the operator deployed, and the contract should say which it
  means. **BREAKING** for the third: the guarantee is unconditional today.
- **What a deployed plugin is, and who provided it, is visible** — the user does not consent, but
  they are never left wondering where something came from or why they cannot remove it.

## Capabilities

### Modified Capabilities

- `plugin-store`: a catalogue may deploy as well as offer; it is read at startup and survives being
  unreachable; consent, management and removal are properties of what the user installed.
- `plugin-permissions`: withdrawing a capability is the user's right over the plugins they chose.

## Impact

- The catalogue port and its entries — an entry says whether it is offered or deployed, and the
  wiring gains what a startup read implies.
- `platform/libs/core/shell/src/lib/plugin-store/` — the install service, whose state is today
  entirely "what the user installed", gains a second, operator-owned set it does not own; the store
  dialog and the installed list, which today assume everything in them is removable.
- The permissions surface, which must state a deployed plugin's rights without offering to withdraw
  them.
- `docs/plugins.md` — the rungs become arrival paths with their authorities named.

Nothing is dissolved. No decision record covers this, and no capability is removed.

**Not in scope:** who an administrator is and how they authenticate, which is the product's own
concern; per-tenant catalogues, which the port already allows without any change here; and the
isolation level a deployed plugin runs at, which is `frame-plugin-isolation-levels` — the two changes
meet at the catalogue and are decided separately.
