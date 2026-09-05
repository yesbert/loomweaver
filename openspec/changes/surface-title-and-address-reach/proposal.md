> **Status:** approved.

## Why

Two small things a product needs and the contract does not offer. Both were found by building a
navigation tree for the demo's sidebar, and both were worked around rather than solved.

**A surface cannot change the name it is known by.** The title is fixed at registration, so a
sidebar whose header should say where the user is cannot say it. The workaround is to register the
same surface again with a different title, which does work and does not disturb the mounted view,
but it is a trick: it re-runs the whole registration path, warnings included, to change one string.
Anyone who wants a header that follows the user has to find that trick first.

**Nobody can ask whether the address shown lies under an address they name.** A plugin reads the
active address and compares it itself, and the obvious comparison is wrong: `startsWith` makes
`sales/quotes` match `sales/quotesomething`. The comparison has to break on segment boundaries, and
that is a rule the platform knows and every consumer would rediscover. We got it wrong once in the
demo on the first attempt, and the symptom was quiet: a deep link marked nothing in the tree.

Neither is a navigation feature. They are the two places where building navigation ran into the
contract, and they are worth having whether or not the workbench ever ships a tree of its own.

## What Changes

- A surface may be given a new title while it runs, under the id it registered with, and everywhere
  the workbench names it follows: the tab, the panel header, the picker.
- A plugin may ask whether what is currently shown lies at or under an address it names, with the
  comparison breaking on segment boundaries so that a longer name is not mistaken for a deeper
  address. The answer is live, like reading the active content, and needs the same permission.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `surfaces`: the requirement *The declaration carries the labels the workbench draws* says where a
  title comes from and says nothing about it ever changing. A requirement is added beside it for a
  title that can be replaced while the surface is mounted.
- `routing`: the requirement *A plugin may read what is currently shown* gives the address and its
  values. A requirement is added beside it for the question that is actually asked of an address,
  whether the current one lies under it, so that the segment rule lives in one place.

## Impact

- `platform/libs/core/plugin-sdk/src/lib/plugin.ts` carries the `ctx` surface both additions land on.
- `platform/libs/core/shell/src/lib/plugin/host-plugin-context.ts` implements them for the in-process
  runtime, and the sandbox runtime beside it has to answer the same, or say plainly that it does not.
- `platform/libs/core/shell/src/lib/plugin/contribution-registry.ts` holds the registered surfaces and
  is where a title is replaced without re-running registration.
- The demo's navigation tree drops its re-registration trick and its own copy of the segment rule.
- `docs/reference/` and the published contract documentation gain the two names, because a published
  name that is not documented is not published.

No legacy source is dissolved by this change.
