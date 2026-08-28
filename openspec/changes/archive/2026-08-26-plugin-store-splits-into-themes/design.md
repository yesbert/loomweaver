## Context

The slice grew from one dialog into a store with a catalog, an install pipeline, an update path and
an enablement model, and the folder never changed shape. Nothing here is wrong; it is simply
unreadable at 21 siblings.

The themes are already legible in the names. Four files are about where plugins come from, nine are
about what happens to one over its life, and eight are the dialog and its parts.

## Goals / Non-Goals

**Goals**

- Every folder under `plugin-store` reads as one theme and stays under 12 concepts.
- No behaviour, no name and no published symbol changes.

**Non-Goals**

- Splitting any file. Nothing here is over 400 lines and inventing a split would be work without a
  finding.
- Technical sub-folders. `services/` would put four of the nine lifecycle files in a bucket and
  scatter the rest.
- Reducing the slice's dependency on `plugin`. That coupling is real and belongs to whichever change
  eventually addresses the slice pairs, with its own argument.

## Decisions

**Two themes, not four.** The obvious finer cut is `install/`, `updates/`, `enablement/` and
`installed/`, and it was rejected. It produces three folders of two files each, which is the
over-splitting Nx names explicitly as a failure symptom: more boundaries than the code has seams, and
a reader who now has to open four folders to follow one install. `lifecycle/` at nine is under the
threshold and names something real, namely everything that happens to a plugin after it is chosen.

**The dialog stays at the slice root.** `plugin-store-dialog.ts` and its four parts are the
composition of the themes, not a member of one. A folder named `ui/` would be a technical kind, and
a folder named `dialog/` inside a slice whose whole purpose is that dialog would say nothing.

**`installed-plugin.ts` and `installed-plugin-list.ts` go with the dialog, not with `lifecycle/`.**
They render what is installed; they do not change it. The distinction is the same command-query line
the pane cut uses.

**No barrel per theme.** Consistent with the rest of the shell, which has no barrels inside `lib/`.
Imports point at the file that owns the symbol, which is what makes the cycle checker meaningful.

## Risks / Trade-offs

**`lifecycle/` at nine is close to the threshold.** If it later crosses twelve, it splits again along
the line rejected here, and by then there will be evidence for where. Recording that here is cheaper
than guessing now.

**Deeper import paths for a slice with many cross-slice importers.** The compiler finds every one,
and the diff is mechanical.

**A folder cut can surface a slice pair that the flat folder hid.** The cycle baseline is
re-measured after the fact and trimmed or extended honestly, rather than being asserted in advance.

## Open Questions

Whether `format.ts` belongs in `catalog/` or at the slice root. It formats sizes and dates for
display, which is dialog work, but every one of its callers today is a catalog view. Decided during
implementation by where its importers actually sit.
