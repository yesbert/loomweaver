## Context

See proposal.md, *Why*.

Opening a preview only ever touches the pane carrying the address: the content tabs service reads
and writes that pane's tabs, finds the first preview among them and replaces it. Which pane carries
the address follows focus, so every pane gets a working slot once it is focused, and a pane that
gives up the address keeps its tabs, preview flags included.

The preview flag is lost in exactly one place: when the move service hands a tab from one pane to
another, it drops the flag if the source carries the address and the target does not. A move in
any other direction carries the flag along. The one existing test covers the direction that drops
it, moving a preview from the address pane into a sidebar.

The case that breaks the slot: pane B shows a preview it kept while not carrying the address; the
user drags that preview onto the strip of the address pane A, which already shows one. A now holds
two, and the replacement finds only the first.

## Goals / Non-Goals

**Goals:**

- One rule for every move between panes, applied in the one place all move routes pass through.
- The brief, the published type and the guide say what the requirement says.

**Non-Goals:**

- Normalising arrangements saved before the fix. An arrangement restored with two previews in one
  pane is possible only if the user produced it with the defect; see *Risks*.
- Opening a preview anywhere but in the pane carrying the address. That is
  *a-tab-opens-beside-the-pane-carrying-the-address*.

## Decisions

### A move between panes drops the preview flag, always

The departing tab loses its preview state whenever source and target are different panes. Within one
pane, reordering never reaches the move service, so nothing changes there. The drag, the tab menu and
the split-out command all go through the same two move functions, which keeps every route identical
as the panes capability requires.

Rejected: carrying the preview along and letting the target keep only one. It needs a second rule for
which of the two survives, and whichever loses would be promoted or closed by a drop the user did not
aim at it. It would also contradict the move out of the address pane, which already promotes and
which the existing test pins.

Rejected: dropping the flag only when the target already holds a preview. It makes the same drag
promote or not depending on something the user cannot see at the moment of dropping.

### The documentation names the pane by what the user sees

"The URL strip" is an internal name. The brief and the JSDoc say "the pane carrying the address,
the one the user last focused", because that is the sentence a plugin author needs to predict where
the preview lands.

## Risks / Trade-offs

- **A drag that used to keep a preview now promotes it.** Between two panes neither of which carries
  the address, the flag used to survive. → That direction was the one that could produce two previews
  in a pane; the promotion is what the direction out of the address pane already did.
- **A saved arrangement may still hold two previews in one pane.** → Only if the defect produced it.
  The next preview replaces one of them, and the other stays italic until kept or closed, which is
  visible and loses nothing. Normalising on restore would be code for a state that stops arising.
