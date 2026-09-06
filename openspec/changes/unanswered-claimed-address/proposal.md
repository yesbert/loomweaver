> **Status:** approved.

## Why

Open the workbench at an address a workspace claims, and let nothing answer it: the user is handed
to whichever workspace claims the starting address, silently. Nothing says the address is gone, and
nothing says why they are somewhere else. Measured in the demo, an address a removed plugin used to
answer is indistinguishable from an address that never existed: both land in the starting workspace
with the address left in the bar.

For every product that lets a user install plugins this is an ordinary Monday. A tab on a plugin's
address is open, the plugin is removed or the operator drops it from the catalogue, and the next
time that address is opened the workbench moves the user out of the module they were in without a
word.

The workbench already answers the neighbouring case properly. Content a distribution removes keeps
its address and shows an explanation there rather than falling back to the starting screen, and a
workspace whose stored arrangement leaves it with nothing is still entered rather than handed away.
Both exist because being moved somewhere else without explanation is worse than an empty screen with
a reason on it. The case in the middle, an address a workspace claims and nothing answers, was never
covered.

## What Changes

- An address that a workspace claims and that nothing answers **lands in that workspace** and
  explains itself there, instead of settling the user into the workspace that claims the starting
  address.
- The explanation is the one the workbench already shows for content a distribution removed, so a
  user meets one wording for one situation rather than two for the same thing.
- An address **no** workspace claims is unchanged: the starting screen stays the answer for a
  mistyped address, because there is nothing better to be said about it.
- The waiting a deep link already gets is unchanged: a plugin that has not registered yet is the
  expected case, and nothing is reported while the address is still being waited for.

## Capabilities

### Modified Capabilities

- `routing`: an unanswered address that a workspace claims now has a stated outcome — it lands in
  that workspace with an explanation — where the capability previously stated only that the
  workspace's remembered arrangement is left alone.

## Impact

- The content router decides what an unmatched address resolves to; it gains the claimed-address
  case beside the one it already has for removed content.
- The workspace that claims an address is known to the workspace machinery; the router has to ask it
  before falling back.
- No published type or provider changes. A distribution that declares no workspaces sees no
  difference, because nothing claims anything.

No legacy source is dissolved by this change.
