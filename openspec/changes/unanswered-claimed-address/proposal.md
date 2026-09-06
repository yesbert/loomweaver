> **Status:** approved.

## Why

Open the workbench at an address a workspace claims, and let nothing answer it. Measured in the demo,
at the address of a plugin that is not installed: the address stays in the bar and the content area
says the view is not available, which is right. But the active workspace is the one that claims the
starting address, so the user reads that explanation under a foreign sidebar, with the tree of a
module they did not ask for — and the module they did ask for looks empty rather than incomplete.

The explanation is therefore already there. What is missing is that it is shown in the wrong place.

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

- An address that a workspace claims and that nothing answers **makes that workspace the active
  one**, so the explanation already shown at the address is read in the place it is about, with that
  workspace's sidebars and its tree.
- The explanation itself is unchanged. The workbench already keeps the address and says the content
  is not available; nothing about that wording or its trigger moves.
- An address **no** workspace claims is unchanged: the starting screen stays the answer for a
  mistyped address, because there is nothing better to be said about it.
- The waiting a deep link already gets is unchanged: a plugin that has not registered yet is the
  expected case, and nothing is reported while the address is still being waited for.

## Capabilities

### Modified Capabilities

- `routing`: an unanswered address that a workspace claims now says which workspace the user is left
  in, where the capability previously stated only that the workspace's remembered arrangement is
  left alone and that fallback content may be shown.

## Impact

- The workbench already answers an unmatched address with the unavailable placeholder; that path is
  untouched.
- What changes is which workspace is active while that placeholder is shown. The workspace machinery
  can already name the workspace that claims a path; nothing asks it in this case yet.
- No published type or provider changes. A distribution that declares no workspaces sees no
  difference, because nothing claims anything.

No legacy source is dissolved by this change.
