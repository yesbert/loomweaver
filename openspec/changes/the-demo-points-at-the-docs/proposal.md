> **Status:** proposed — not approved for implementation yet.

## Why

The live demo shows everything the platform can do in one product, and a visitor cannot tell what
is the platform and what is the sample product. The first outside comment said exactly that: "still
don't get the point, the live demo is not very useful". The documentation explains every one of
those features, but nothing in the demo points there, and nothing in the docs points back at the
place in the demo where a feature can be seen. The two exist side by side and do not know each
other.

Closing that gap is not one edit. What a link from the demo to a doc should look like, where it
sits, whether it is part of the product's chrome or a layer the demo adds, and how the docs answer
in turn: none of that is decided, and deciding it in a pull request would be too late. The
discussion is the first step of this change, and its result shapes the rest.

## What Changes

- The discussion, first. What a visitor should be able to learn from the demo without leaving it,
  which of the platform's features are worth pointing at, what the pointer looks like, where it
  lives, and whether it is a thing the demo adds or something a product could use as well. The
  result is written into the design note and the remaining tasks are shaped by it.
- Then whatever the discussion decides: the demo carries pointers to the docs, the docs carry the
  place in the demo where the feature shows, and the visitor's question "what is what" gets an answer
  on the screen where it is asked.

## Capabilities

### New Capabilities

None yet.

### Modified Capabilities

None yet. The change starts with `skip_specs` because the discussion decides whether anything the
platform guarantees changes. Where the pointer becomes a platform feature rather than a demo
decoration, this change is updated with the delta before the build starts.

## Impact

- The demo, its documentation and the docs site; decided by the discussion.
- No legacy source is dissolved by this change.
