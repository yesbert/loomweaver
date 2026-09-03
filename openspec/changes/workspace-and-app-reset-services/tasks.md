## 1. Guards move into the services

- [ ] 1.1 `RetainedViewStash.parkedInstancesOf(workspaceId)`: the instances `evictWorkspace` would
      destroy. Spec.
- [ ] 1.2 `WorkspaceService.reset(id?)`: `Promise<boolean>`; for the active workspace ask
      `confirmDiscard(retention.all())` first, elsewhere no question; a private unguarded path does
      the work. `resetAll()`: ask once with all candidates, then reset each through the unguarded
      path; `Promise<boolean>`.
- [ ] 1.3 `WorkspaceService.remove(id)`: `Promise<boolean>`; ask `confirmDiscard` with the parked
      instances of that workspace before evicting and removing.
- [ ] 1.4 `AppResetService.reset()`: `Promise<boolean>`; ask `confirmDiscard(retention.all())`, then
      reset the frame.
- [ ] 1.5 Specs (with a capturing guard): reset of the active workspace asks and reports; a refused
      guard leaves the arrangement and reports `false`; reset of a non-active workspace asks
      nothing; `resetAll` asks once for several workspaces; `remove` asks with the parked instances
      when there are any and not otherwise; app reset asks and reports.

## 2. The commands keep only their dialogs

- [ ] 2.1 `shell.workspace.reset`: after the confirm, `void workspace.reset(named || undefined)`;
      drop `closeGuard`/`retention` from the command.
- [ ] 2.2 `shell.app.reset`: after the dialog, if workspaces are included `await workspace.resetAll()`
      and stop on `false`; then `await appReset.reset()`. Drop the command's own guard. Remove
      `closeGuard` and `retention` from `HostCommandDeps` if nothing else uses them, and from
      `provide-shell.ts`.
- [ ] 2.3 Adjust `shell-seeds.spec.ts`; add: the workspace reset command calls the service with the
      named workspace; the app reset command calls `resetAll` before `reset` and skips the app reset
      when `resetAll` answers `false`.
- [ ] 2.4 Adjust `workspace-dialog.spec.ts` and any spec that calls `reset`, `resetAll` or `remove`
      synchronously.

## 3. Pin the rules

- [ ] 3.1 Reachable while off: `workspaces.enabled` switched off through `FeatureSwitches`,
      `switchTo` still switches and `reset` still resets.
- [ ] 3.2 Together once: `resetAll()` then `reset()` on the app service asks the guard once when a
      surface is dirty (capturing guard that answers yes), and both resets happen.

## 4. Contract and documentation

- [ ] 4.1 Export `WorkspaceService`, `AppResetService` and the `Workspace` record type from
      `@loomweaver/shell`.
- [ ] 4.2 `docs/reference/host-services.md`: sections *Workspaces* and *Resetting the application*
      in the style of the neighbouring sections: facts, actions, what asks and what does not, the
      boolean, the two-call order for a full reset. Add `workspaces` to the `derived-from-specs`
      line.
- [ ] 4.3 `docs/building-a-distribution.md`: where the workspace dialog and the app reset are
      described, point at the reference for driving them from code.
- [ ] 4.4 Package the shell and run `check-api-docs.mjs`: every new export documented.

## 5. Verify and hand over

- [ ] 5.1 `npx nx run-many -t test lint -p shell` green; `npm run structure-check` and
      `check-import-cycles.mjs` match their baselines; the testbed production build passes.
- [ ] 5.2 `openspec validate workspace-and-app-reset-services --strict` passes.
