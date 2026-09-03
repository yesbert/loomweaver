## 1. Handle and facts

- [ ] 1.1 Add `pane-handle.ts` in `regions/pane/`: the branded `PaneHandle` type, a creator the
      service alone uses, and a resolver from handle to leaf id that answers nothing for a pane that
      is not in the content dock's tree.
- [ ] 1.2 Add `PaneService` in `regions/pane/pane.service.ts` with the read side: `panes()`
      (`PaneFacts` per leaf in tree order: handle, showing, itemCount, carriesAddress, maximized,
      minimized), `activePane()`, `isSplit()`, `maximized()`, `minimized()`, all computed from
      `PaneTreeService` and `PaneChromeService`.
- [ ] 1.3 Spec: with one pane, one fact carrying the address; after a split, two facts with the
      right `showing` and `itemCount`, exactly one carrying the address; `isSplit()` follows; a
      `computed` on `isSplit()` re-evaluates on split.
- [ ] 1.4 Spec: a handle survives a focus change and a split elsewhere; a handle of a closed pane
      resolves to nothing and every action with it is a no-op that leaves the tree unchanged.

## 2. Actions, one implementation each

- [ ] 2.1 `splitRight(handle?)` / `splitDown(handle?)`: shown path of the pane, duplicate check
      (`offRouterMountable` for off-router paths, never home or a view path), then
      `paneTree.splitPane`. Spec: duplicates like the toolbar; no-op when nothing can be shown twice.
- [ ] 2.2 `closePane(handle?)`: collect the unsaved-work candidates of every tab in the pane, guard,
      then `TabClosingService.closePrimaryPane` for the primary or `paneTree.closePane` for a
      sibling. Spec: the guard is asked with the pane's candidates; closing the primary promotes the
      neighbour and navigates; closing a sibling removes it.
- [ ] 2.3 `unsplit()`: candidates of every non-primary pane, guard, then `paneTree.unsplit`. Spec:
      asked when a sibling holds work, silent when none does, tree collapses to the primary.
- [ ] 2.4 `maximize(handle?)`, `minimize(handle?)`, `restore(handle?)` as explicit set/clear over the
      chrome service. Spec for each, including `restore()` without a handle un-maximising the area
      and `restore(handle)` bringing a minimised pane back.
- [ ] 2.5 `focus(handle)`: `paneTree.focusPane` with the active tab root, then navigate to the path it
      returns. Spec: the address moves to the pane's shown item; focusing the primary is a no-op.
- [ ] 2.6 `moveTab(path, handle)`: resolve the source via `paneTree.sourceOf`, then
      `PaneMoveService.moveToStrip`. Spec: the tab leaves the source and joins the target; unknown
      path or same pane is a no-op.

## 3. The controls call the service

- [ ] 3.1 `PaneView`: `splitPane`, `closePane`, `toggleMaximize`, `minimize`, `focusPane` call the
      service with the pane's handle (`toggleMaximize` picks `maximize`/`restore` from `maximized()`);
      remove the now-unused tree and chrome calls for these actions. Adjust `pane-view.spec.ts`
      accordingly.
- [ ] 3.2 `ContentArea`: `split`, `closePrimary`, `toggleMaximize`, `minimize` call the service for
      the primary; remove the direct tree and chrome calls. Adjust its spec.
- [ ] 3.3 `shell-seeds.ts`: `shell.content.splitRight` becomes `isSplit() ? unsplit() : splitRight()`;
      drop the `offRouterMountable`, `paneTree` and `auth` reads the command no longer needs (keep
      what other commands use). Adjust `shell-seeds.spec.ts`.
- [ ] 3.4 Spec (twin): a split from the pane view, from the content area and from the service leave
      the tree in the same shape; a close from each asks the same guard with the same candidates.

## 4. Pin the rules

- [ ] 4.1 Reachable while off: `content.splitRight` and `content.maximize` switched off through
      `FeatureSwitches`, the service still splits and maximises; the toolbar shows no control for
      either (rendered on `PaneView`).
- [ ] 4.2 Same guard: a pane with a dirty surface closed through the service asks
      `SurfaceCloseGuard` with the same candidates the close control collects.

## 5. Contract and documentation

- [ ] 5.1 Export `PaneService`, `PaneHandle` and `PaneFacts` from `@loomweaver/shell`.
- [ ] 5.2 `docs/reference/host-services.md`: new section *Panes*, in the style of the neighbouring
      sections: the boundary to `ContentTabsService` (content vs arrangement), handles and their
      lifetime, the facts, each action, the guards, and that switches do not reach it. Add `panes` to
      the `derived-from-specs` line.
- [ ] 5.3 Package the shell and run `check-api-docs.mjs`: every new export documented.

## 6. Verify and hand over

- [ ] 6.1 `npx nx run-many -t test lint -p shell` green; `npm run structure-check` and
      `check-import-cycles.mjs` match their baselines.
- [ ] 6.2 `openspec validate pane-service --strict` passes.
