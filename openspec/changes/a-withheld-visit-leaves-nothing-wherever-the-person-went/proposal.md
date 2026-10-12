> **Status:** approved.

## Why

The change `a-claimed-address-reached-before-the-session-settles-cleanly` (merged in #796) made a
visit to claimed content that waited for the session take its tab out of the workspace it waited in.
A review before releasing it found three ways it still falls short of the requirement it pins in
`workspaces`, "A workspace may claim the content that belongs to it": the waiting SHALL leave nothing
behind, and what that workspace held at the address before the visit SHALL stay.

- **The person moved on while waiting.** The tab was taken out only when the address shown settled.
  A person who clicked another tab before the session arrived kept the provisional tab in the initial
  workspace, which is the reported defect again.
- **Two visits waited.** Only one waiting visit was remembered, so the first of two claimed addresses
  visited before the session stayed behind.
- **The person's own arrangement was read again.** Where the session adopts a namespace that already
  holds an arrangement, that arrangement replaces the provisional one. Taking tabs out of it at that
  point could remove a tab the person kept there, depending on which of the two runs first.

A second review of that fix found two more:

- **The person switched workspace while waiting.** The visit was forgotten when the session arrived
  in another workspace, so the provisional tab stayed in the one it waited in.
- **A pop-out window noted visits too**, although it never settles anything and its arrangement is
  the main window's.

The requirement does not change; the implementation does not yet meet it.

## What Changes

- Every visit that waits for the session is remembered, per address and workspace, and kept until
  its workspace is active again; arriving in that workspace takes out what now qualifies.
- A pop-out window remembers no waiting visit.
- When the session qualifies, every waiting visit the person is no longer looking at is taken out of
  the workspace it waited in; the one shown settles as before, and takes out any other that now
  qualifies with it.
- Where the session adopts a namespace whose arrangement is read again, the waiting visits are
  forgotten instead, because the arrangement read is the person's own.
- `CommandService.chordOf` gains JSDoc, and the JSDoc of `shortcutOf` no longer claims every hint asks
  there.
- Review nitpicks: the chosen segment keeps an outline in forced-colours mode, and a menu collects its
  chords while it draws its rows instead of in a second walk.

No API change; ships as a patch.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. This fixes the implementation of an unchanged requirement in `workspaces`.

## Impact

- The shell's address settlement, a new internal service for waiting visits, and the re-read after a
  namespace adoption.
- `CommandService` JSDoc, the menu drawing, the segmented class contracts.
- Three unit tests added to the spec of settling once the session arrives.
