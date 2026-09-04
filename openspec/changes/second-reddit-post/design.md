## Context

See proposal.md, *Why*. What shapes the approach:

- The r/angular post exists; its title, its video and its story are used up for Reddit. The Show HN
  was killed by the new-account filter and is not repeated; HN is a separate route by email and
  not part of this change.
- Reddit communities read self-promotion rules strictly, and most want the story and the problem
  in the body, not a link. A link-only post is the drive-by launch both reviews warn against.
- The owner's voice rule applies in full: start from the owner's text, keep the idioms, no
  copywriter punch, "my own project" in the first line.

## Goals / Non-Goals

**Goals:**

- A second community meets the project through the problem it has, in the owner's voice.
- No reader who saw the r/angular post recognises the text.

**Non-Goals:**

- No repost to r/angular, no cross-post, no HN.
- No more than one subreddit in this change; a second is a second change with its own angle.

## Decisions

**Subreddit and angle are chosen together, tomorrow.** The angle follows the community, not the
other way round: r/javascript and r/webdev get plugin isolation against micro-frontends. The outside
review's default is r/javascript with the dev.to tutorial as the link, because it accepts
problem-shaped posts and because a link to an article is not a link to a repository. Reddit could
not be reached to re-verify either sub's rules; task 1.2 does that on the day. The decision is recorded here before the draft starts.

**Rules first, draft second.** The sub's rules, flair and any self-promotion day are read and
recorded in the tasks before a word is drafted.

**Body carries the argument; the link is one line at the end.** If the dev.to tutorial is out, the
link goes there; otherwise to the demo.

## Risks / Trade-offs

- [The sub removes self-promotion regardless of quality] → Read the rules first; drop the sub
  rather than argue with a moderator.
- [The post reads as marketing] → The voice rule and the problem-first structure are the
  mitigation; the owner reads it as a redditor before posting.

## Open Questions

- Which subreddit, and therefore which angle. Default from the review: r/javascript.
- Whether to wait for the dev.to tutorial so the post can link to it. Default from the review: yes.
- The outbound link carries `?ref=reddit-<sub>`, following the positioning change's convention.
