## 1. Before the edits

- [ ] 1.1 Confirm the barrel export of `PluginIsolationLevel` from `@loomweaver/shell` has merged
      on its own branch; if not, do that first, with a test that the packed declaration names it
- [ ] 1.2 Confirm `the-docs-explain-the-navigation-tree-and-a-session-without-a-backend` has been
      applied, so its page and its llms entries are in place
- [ ] 1.3 Package `plugin-sdk` and `shell`, re-run both audits against the packed declarations and
      the current `docs/`, and mark in the lists below what has changed since 2026-09-07

## 2. The guards

- [ ] 2.1 In `platform/tools/check-api-docs.mjs`, add a second pass that requires every non-exempt
      export of the four contracts to appear in `llms-full.txt` alone, reporting misses under their
      own heading so the two passes stay distinguishable
- [ ] 2.2 In `website/tools/sync-docs.mjs`, beside the sidebar check, push a problem for every page
      under `docs/` whose repo-relative path is not a link target in `llms.txt`
- [ ] 2.3 Run both; the lists they print are the acceptance criterion for sections 3 to 7
- [ ] 2.4 Update the guards table in `docs/reference/operations.md`: what `api-docs-check` now
      fails on, and that `sync-docs` fails on a page missing from `llms.txt`

## 3. The index, `llms.txt`

- [ ] 3.1 Add the fourteen single pages of `docs/distribution-api/` under the existing overview
      line, each with a one-line hook: appearance, commands, composition, dialogs-and-toasts,
      panes, plugins-at-runtime, reset, session, settings, sidebars, switches, tabs,
      windows-and-sync, workspaces
- [ ] 3.2 Add `docs/README.md` and `docs/reference/operations.md`, the second with a hook that
      says it is for whoever runs or contributes to the repository
- [ ] 3.3 Add `docs/reference/operations.md` to the reference list in `llms-full.txt` as well

## 4. The plugin contract in `llms-full.txt`

- [ ] 4.1 In the printed `PluginContext` interface, add `retitleSurface(id, title)`,
      `isShowingUnder(path)` and `readonly state: PluginState`, each with the capability it needs
      in the trailing comment
- [ ] 4.2 Add `isPreview` to the printed `PluginHost`
- [ ] 4.3 Add the missing fields: `retain`, `saveOn`, `closable`, `padded`, `iframe` on `View`;
      `retain`, `saveOn`, `closable`, `padded` on the content-route type; `title`, `tone`, `icon`,
      `dismissable` on the dialog `OpenOptions`; `fullWidth` on the component setting
- [ ] 4.4 Name the exports the file describes only in prose: `CAPABILITIES`, `meetsAccess`,
      `isAccessVisible`, `isAccessDisabled`, `PRODUCT_IDENTITY`, `LOOMWEAVER_IDENTITY`,
      `ProductIdentity`, `LwButtonSize`, `CommandScalar`, `CommandArgumentValue`, `MenuTrigger`,
      `NotificationAction`, `NotificationKind`, `DialogButton`, `DialogTone`, `DialogSize`,
      `RequireConfirmation`, `SelectOption`, `Disposable`, `PaneAreaBase`
- [ ] 4.5 Reword the error wording so it names `CapabilityError` as the one error class the SDK
      exports

## 5. The distribution contract in `llms-full.txt`

- [ ] 5.1 Write the required-plugins block: `provideRequiredPlugins`, `REQUIRED_PLUGINS`,
      `RequiredPlugins`, what a required plugin's failure does, and add it to the "which provider"
      index
- [ ] 5.2 Write the unusable-workspaces block: `UNUSABLE_WORKSPACES`, `UnusableWorkspaces`,
      `ANNOUNCE_UNUSABLE_WORKSPACES`, `withoutUnusableWorkspaceNotice`, `WorkspacesFeature`, and
      correct `provideWorkspaces` to accept definitions and features
- [ ] 5.3 Write the isolation-level block: `PluginIsolationLevel`, `PluginRung`,
      `DEFAULT_ISOLATION_LEVEL`, `CATALOG_MAX_ISOLATION_LEVEL`, `FramePlugin.level` and `origins`
      and `name`, `PluginCatalogEntry.level` and `deployed`, `PluginCatalogOptions.maxLevel`
- [ ] 5.4 Correct the remaining signatures from the packed declaration: `provideShell` with
      `retention` and `padding`; `WorkspaceService` with `initials`, `wouldSettle`, `settle`,
      `originOf`, `claimsOfWorkspace`, `destinationFor` and `switchTo(id, { keepAddress })`;
      `PluginStoreService.configure`
- [ ] 5.5 List the services the file omits, one line each, where it says what a distribution's
      code may do: `CommandService`, `CommandInvoker` and `COMMAND_INVOKER`,
      `CommandInvocationService`, `KeybindingService`, `ContributionRegistry` with its signals
      including `contentRoutes`, `DialogService`, `NotificationService`, `SettingsService`,
      `CapabilityGrantService`, `PluginEnablementService`, `UpdateService`, `VersionService`,
      `AuthContext`, `PluginRuntime`, `FramePluginRuntime`, `TranslocoHttpLoader`
- [ ] 5.6 Name the remaining exported tokens, components and types the audit listed, or add each
      to the checker's exemption map with its reason: the injection tokens from `SHELL_LAYOUT` to
      `LOOM_ICONS`, the storage-key constants, `LwSpinner`, `LwSettingRow`, `LwVersion`,
      `UpdateBadge`, `DialogOutlet`, `ToastOutlet`, and the types from `RegionType` to
      `WorkspaceBaselineState`
- [ ] 5.7 Add `validate-commands` to the tooling list for all three packages

## 6. The building blocks in `llms-full.txt`

- [ ] 6.1 Give every tag its attributes and events, in the primitives bullet and the frame-kit
      list: `<lw-button>` with `icon-only` and `disabled`; `<lw-select>` with `label`,
      `placeholder`, `disabled`, `compact`; `<lw-tooltip>` with `delay-ms` and `max-width`;
      `<lw-icon>` with `aria-label`; `<lw-menu>` with `lw-menu-select` and `lw-menu-dismiss`;
      `<lw-menu-item>` with `label`, `command`, `disabled`, `icon`, `shortcut`, `checkbox`,
      `checked`
- [ ] 6.2 Check the navigation family the sibling change added against the same standard

## 7. The capabilities the file was silent on

- [ ] 7.1 Accessibility: a block from the `accessibility` spec and `docs/reference/accessibility.md`,
      what the workbench guarantees, what a plugin inherits, the checklist a plugin author owns,
      and the colour-token rule
- [ ] 7.2 Product identity, the update half: installable, a failed update distinguished from
      broken offline storage, the quiet periodic check, `UpdateService` and the badge
- [ ] 7.3 Shell layout: the narrow viewport and what becomes a drawer, rail names decided per rail,
      a rail that scrolls with its anchored band staying
- [ ] 7.4 Routing: a deep link survives arriving before the plugin that answers it
- [ ] 7.5 The mental model: one sentence that `openspec/specs/` is the contract and wins over any
      guide
- [ ] 7.6 The container-query sizing rule from the design-tokens page, beside the line that tells
      an assistant to write plain CSS for sizes

## 8. The number

- [ ] 8.1 Correct "27 colours" to 29 colours and 2 font families in `llms-full.txt` and in
      `docs/reference/design-tokens.md`, counted from `theme.css`

## 9. Verification

- [ ] 9.1 `npm run api-docs-check` in `platform/` passes both passes with no new exemption that
      lacks a reason
- [ ] 9.2 `npm run sync` and `npm run check` in `website/` pass, and the site's copies of both
      files carry the absolute links
- [ ] 9.3 `npm run docs-style-check` in `platform/` for the design-tokens page
- [ ] 9.4 Read both files once top to bottom for a claim the additions now contradict, in
      particular the word "complete" and every list that presents itself as the whole
- [ ] 9.5 `openspec validate --all --strict`
