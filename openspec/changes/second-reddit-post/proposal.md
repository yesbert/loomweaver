> **Status:** proposed — not approved for implementation yet.

## Why

The launch post went to r/angular on 2026-09-04 as a story with the tour video. Both reviews of
the marketing say not to repeat it: the next post goes to a different community with a different
angle, because the same text in a second place reads as spam and reaches the same people. The
angle the Angular community did not need (what LoomWeaver is for Angular) is exactly the one a
frontend or open-source community would: plugin isolation as the alternative to micro-frontends, or
the maintainer's view on why a product should be built as plugins on a thin core.

This change captures the idea. The post is written tomorrow, in the owner's voice.

## What Changes

- **One post in one subreddit that is not r/angular.** Candidates, one to be chosen: r/javascript
  with the plugin-isolation and micro-frontend-alternative angle and the tutorial as the link;
  r/webdev with the same angle, if its self-promotion rules allow it outside a showcase day;
  r/Angular2 only if it turns out to be a materially different audience from r/angular, which is
  checked, not assumed. r/opensource is a meta audience with few Angular readers and is not a
  candidate.
- **A different angle, not a different wording.** The post leads with the problem the chosen
  community has, and the project appears as the author's answer to it, disclosed as "my own project"
  in the first line.
- **Whatever the sub's rules require.** Self-promotion rules, flair and posting days are read
  before drafting; a sub whose rules exclude the post is dropped, not worked around.

No behaviour changes and no guarantee changes: the post lives on Reddit, so the change declares
`skip_specs`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. The change declares `skip_specs: true`.

## Impact

**Repository.** Nothing.

**External.** One Reddit post from the owner's account. Reddit is unreachable from the assistant's
environment, so the owner posts and pastes comments in.

**Depends on.** `position-as-angular-plugin-platform`, so the link lands on the new first screen.
If `dev-to-tutorial-article` is published first, the post can link to it instead of to the
repository, which is the drive-by-link problem solved.

**Legacy sources dissolved.** None.
