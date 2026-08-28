<!--
For anything beyond a small, self-contained change, please open an issue first — the design
conversation is cheaper before the work than after it. See CONTRIBUTING.md.
-->

## What this changes

<!-- One or two sentences. Link the issue if there is one. -->

## Why

<!-- What problem this solves. If it changes something a capability guarantees, name the capability. -->

## How you verified it

<!--
Which commands you ran and what you checked by hand. For a bug fix, please confirm the new test
actually fails against the old code — a test that passes either way proves nothing.
-->

- [ ] `npx nx run-many -t lint --all`
- [ ] `npx nx run-many -t test --all`
- [ ] `npx nx build loom-testbed`

## Checklist

- [ ] Commits are signed off (`git commit -s`) — see the DCO section in `CONTRIBUTING.md`
- [ ] No comments added to code, apart from JSDoc on the published contract
- [ ] Templates live in their own `.html` files; only semantic design tokens used
- [ ] No AI attribution in commit messages or in this description
