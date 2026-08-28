> **Status:** approved.

## Why

`platform/libs/core/shell/src/lib/plugin-store` holds **21 concepts in one flat folder**, 36 files
with specs and templates. It is the second largest flat folder in the platform and the only slice
besides `regions/pane` over the 12-concept threshold.

The folder mixes four unrelated subjects with no signal in the tree about which is which: where
plugins come from, what happens when one is installed or removed, what happens when one is updated
or switched off, and the dialog the user actually sees. `format.ts` sits beside
`plugin-disable-guard.ts` for no reason other than the letter f preceding the letter p.

Unlike `regions/pane`, no single file here is oversized: the largest is well under 400 lines and
`plugin-store.service.ts` is 26. This is purely a folder problem, which makes it the smallest and
lowest-risk of the three cuts.

## What Changes

- `plugin-store` is cut into sub-themes named for what they do, following the pattern set by
  `regions/content` and `elements/`.
- Types and constants that sit beside a decorated class move into files named for the concept they
  model.
- Specs and templates follow their subject.
- The structure baseline loses its second folder entry.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. Files move between folders and no symbol changes name, shape or behaviour.
`.openspec.yaml` therefore sets `skip_specs: true`.

## Impact

**The proposed cut, 21 concepts into two themes and the dialog:**

| Theme | Concepts | Members |
|---|---|---|
| `catalog/` | 4 | `catalog-entries.ts`, `plugin-catalog.ts`, `provide-plugin-catalog.ts`, `format.ts` |
| `lifecycle/` | 9 | `install-consent.ts`, `consent-deps.ts`, `plugin-install.service.ts`, `plugin-deployment.service.ts`, `uninstall-confirm.ts`, `plugin-update.ts`, `update-consent.ts`, `plugin-enablement.service.ts`, `plugin-disable-guard.ts` |
| remainder | 8 | `plugin-store-dialog.ts`, `plugin-store-card.ts`, `plugin-store-detail.ts`, `plugin-store-settings.ts`, `plugin-store-title.ts`, `plugin-store.service.ts`, `installed-plugin.ts`, `installed-plugin-list.ts` |

Every folder lands under the threshold, and the remainder is the slice's own user interface rather
than a leftover pile.

**Two of these files were touched earlier in this audit.** `plugin-store-title.ts` was created to
break a cycle between the service and the dialog, and `plugin-store.service.ts` shrank to 26 lines
as a result. Both stay at the slice root, where the dialog they serve lives.

**Expected effect on the baselines.** The structure baseline loses its 21-concept entry. The cycle
baseline may move in either direction and is re-measured rather than predicted: a folder cut can
reveal a slice pair that a flat folder was hiding.

Depends on `structure-has-a-ratchet`. Independent of the other two cuts.
