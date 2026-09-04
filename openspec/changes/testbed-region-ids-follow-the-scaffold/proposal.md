> **Status:** proposed — not approved for implementation yet.

## Why

The testbed and the scaffold give the same word two meanings. In the testbed, `primary` is the left
panel and the left rail is `activity`. In a scaffolded product, `primary` is the left rail and the
left panel is `left-panel`. A region id is a plain string that nothing validates at build time, so
the collision is invisible until a contribution lands nowhere.

It has cost real defects. The weaver recipe docked an instanceable surface into `primary`, which is
a rail in a scaffolded layout, so a scaffolded `--instanceable` weaver rendered nothing while two
tests pinned the wrong id. The documentation carried both vocabularies side by side for months, and
readers copying a testbed-shaped snippet into a scaffolded product got silence.

The documentation review settled the vocabulary question: the scaffold's ids are canonical, and the
reference page now records the testbed's deviation in a sentence. Recording a deviation is weaker
than not having one. This change removes it at the source, so the repository has one set of region
ids and the sentence can go.

## What Changes

- The testbed distribution renames four region ids to the scaffold's vocabulary:

  | Today | After | Region |
  | --- | --- | --- |
  | `activity` | `primary` | rail, docked left |
  | `primary` | `left-panel` | panel, docked left |
  | `secondary` | `right-panel` | panel, docked right |
  | `activity-right` | `secondary` | rail, docked right |

- `top-bar`, `main`, `status-bar`, `left-footer` and `right-footer` keep their names. The first
  three already match the scaffold; the two footers have no scaffold counterpart and already follow
  the dock-prefixed pattern.
- Every contribution in the testbed weaver that targets a renamed region follows: rail items,
  docked surfaces, bar items and the `sidebars` maps of the declared workspaces.
- The sentence in `docs/reference/shell-anatomy.md` that records the deviation is removed, because
  after this change there is none.

No behaviour a consumer can observe changes. Region ids are each distribution's own choice, the
platform guarantees nothing about which strings a distribution picks, and the testbed is not a
published artifact. The change therefore carries no spec delta and sets `skip_specs: true`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. Region ids are a distribution's own naming, not a platform guarantee, so no requirement under
`openspec/specs/` changes. The change sets `skip_specs: true` in its `.openspec.yaml`.

## Impact

- `platform/apps/loom-testbed/src/main.ts`: the `regions` array, every `rail:` on a rail item, and
  the `sidebars` maps inside `provideWorkspaces`.
- `platform/libs/weavers/testbed-weaver/src/lib/plugin/testbed-surfaces.ts`,
  `testbed-chrome.ts` and `testbed-theme.ts`: `docks`, `rail` and `bar` targets.
- `platform/libs/weavers/testbed-weaver/src/lib/plugin/testbed.plugin.spec.ts`: the ids it pins.
- `docs/reference/shell-anatomy.md`: the deviation sentence added in #166 is deleted.
- `platform/apps/loom-testbed-e2e`: expected to need no change. Its matches on "activity" are the
  workbench label *Customize activity bar*, not a region id. The tasks verify this rather than
  assume it.
- Persisted layouts in a developer's browser key on region ids, so an existing testbed profile will
  not find its panels after the rename. *Reset app layout* restores it. This affects developers
  only; nothing ships from the testbed.
