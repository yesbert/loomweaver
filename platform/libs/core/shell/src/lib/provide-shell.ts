import {
  EnvironmentProviders,
  ErrorHandler,
  inject,
  Injector,
  isDevMode,
  provideBrowserGlobalErrorListeners,
  provideEnvironmentInitializer,
  Provider,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';
import {
  provideTransloco,
  provideTranslocoMissingHandler,
  TranslocoService,
} from '@jsverse/transloco';
import { detectInitialLang, SUPPORTED_LANGS } from './i18n/locale.service';
import { SettingsService } from './settings/settings.service';
import { settingOmitIds } from './settings/setting-omit';
import { ShellMissingTranslationHandler } from './i18n/missing-translation-handler';
import { TranslocoHttpLoader } from './i18n/transloco-loader';
import { defineLwIcon } from './elements/icon/lw-icon.element';
import { BAR_ITEM, provideBarItems } from './foundation/bar-item';
import { DEFAULT_BAR_ITEMS } from './regions/bar/default-bar-items';
import { RAIL_ITEM } from './foundation/rail-item';
import { VIEW } from './layout/view';
import { ContributionRegistry } from './plugin/contribution-registry';
import { ShellErrorHandler } from './permissions/capability-refusal';
import { COMMAND_INVOKER } from './foundation/command-invoker';
import { WORKSPACE_CLAIMS } from './foundation/workspace-claims';
import { UNUSABLE_WORKSPACES } from './foundation/unusable-workspaces';
import { UnusableWorkspacesService } from './workspace/usability/unusable-workspaces.service';
import { CommandInvocationService } from './commands/command-invocation.service';
import { KeybindingService } from './commands/keybinding.service';
import { DialogService } from './dialog/dialog.service';
import { defineLwTooltip } from './elements/tooltip/lw-tooltip.element';
import { defineLwSelect } from './elements/select/lw-select.element';
import { defineLwMenu } from './elements/menu/lw-menu.element';
import { defineLwMarkdown } from './elements/markdown/lw-markdown.element';
import { defineLwButton } from './elements/button/lw-button.element';
import { defineLwProgressRing } from './elements/progress/lw-progress-ring.element';
import { ContentTabsService } from './regions/content/tabs/content-tabs.service';
import { PaneTreeService } from './regions/pane/tree/pane-tree.service';
import { PaneMoveService } from './regions/pane/drag/pane-move.service';
import { RetentionCandidates } from './regions/pane/retention/retention-candidates';
import { SurfaceCloseGuard } from './regions/pane/close/surface-close-guard';
import { WorkspaceService } from './workspace/workspace.service';
import { ViewStateService } from './views/view-state.service';
import { ViewInstanceService } from './views/view-instance.service';
import { ViewMoveService } from './regions/panel/view-move.service';
import { ViewVisibilityService } from './regions/panel/view-visibility.service';
import { RailItemsService } from './regions/rail/rail-items.service';
import { RailMoveService } from './regions/rail/rail-move.service';
import { RailWorkspaceEntries } from './regions/rail/rail-workspace-entries';
import { PopoutService } from './popout/popout.service';
import { AuthContext } from './auth/auth-context';
import { AppResetService } from './layout/app-reset.service';
import { SHELL_LAYOUT } from './layout/layout';
import {
  RetentionDefault,
  SURFACE_RETENTION,
} from './regions/pane/retention/retention-policy';
import { FeatureSwitches } from './features/feature-switches.service';
import { PaddingDefault, SURFACE_PADDING } from './foundation/surface-padding';
import {
  CompositionReport,
  installCompositionReport,
} from './diagnostics/composition-report';
import { registerDefaultSettings } from './default-settings';
import { seedContributions, seedHostCommands } from './shell-seeds';
import { seedBuiltInMenus } from './shell-menu-seeds';

/** Options a distribution can pass to {@link provideShell}. */
export interface ShellOptions {
  /**
   * Contribution ids to hide — a distribution drops a default it does not want (e.g.
   * `['shell.language']`). A **lasting** filter, not a one-time delete: an id a plugin
   * registers later stays hidden too. To *replace* a default instead of hiding it, register
   * your own contribution with the same id (last-in wins) and do **not** omit it.
   *
   * Covers **every** contribution kind. Chrome — commands, views, bar items, rail items — is
   * addressed by bare id. The other kinds carry a **prefix**, because ids from different kinds may
   * coincide and there is exactly one shared omit set: an unprefixed omit stays chrome-only and never
   * silently takes a same-named contribution of another kind with it (`shell.language`, for one, is
   * both a top-bar item and a settings row).
   *
   * - `menu:<commandId>` — one menu entry, leaving the command itself (palette/shortcut) alive.
   * - `setting:<id>` — a whole section (`'setting:shell.permissions'`) or a single row
   *   (`'setting:shell.textSize'`); a section left without rows disappears.
   * - `route:<surfaceId>` — a routable surface's content route. It leaves the tab strip,
   *   the auto-open on deep-link and the pane target picker; its URL renders a neutral "not available
   *   here" placeholder rather than falling back to home, so a shared deep-link explains itself.
   *   Addressed by the surface **id**, while a route is *overridden* by its `path` (registering your
   *   own surface on the same path wins) — two handles, deliberately, for two different operations.
   */
  readonly omit?: readonly string[];

  /**
   * Whether to register the application's service worker — `true` by default, and inert in dev
   * either way. The shell owns the registration so that the update badge, the update
   * toast and `ctx.host.checkForUpdate()` work in a distribution that only ships the build
   * artefacts; you do **not** add `provideServiceWorker` yourself.
   *
   * Pass `false` when your build emits no `ngsw-worker.js` (no `serviceWorker` option in the build
   * target). Registration would otherwise 404 in production and log a failure. Nothing else
   * changes: `UpdateService` injects `SwUpdate` optionally, so it simply reports
   * {@link UpdateService.enabled} as `false` and never offers an update.
   *
   * `@angular/service-worker` stays a peer dependency regardless — the opt-out removes the
   * registration, not the import.
   */
  readonly serviceWorker?: boolean;

  /**
   * The app-wide retention default for **hidden** surfaces: `'destroy'` (the default) destroys a
   * hidden, clean surface, so state that must survive belongs in `VIEW_STATE`; `'retain'` keeps
   * every hidden instance alive at the price of memory growing with every surface ever shown. A
   * surface's own `retain: 'always' | 'never'` declaration wins over this default. `iframe` and
   * `container` surfaces are always rebuilt regardless.
   *
   * This is a storage policy for the developer, not a capability the user can see, which is why it
   * lives here rather than in `provideShellFeatures`.
   */
  readonly retention?: RetentionDefault;

  /**
   * The app-wide inset default for surfaces: `'none'` (the default) hands every surface the full
   * area of the pane it is mounted in, so what stands between its content and the pane edge is
   * whatever the surface itself draws; `'inset'` insets every surface the product composes, which
   * is comfortable for the prose, forms and lists most surfaces are.
   *
   * A surface's own `padded` declaration wins over this default, in both directions: a surface may
   * ask to be inset where the product asks for nothing, and to be flush where the product asks for
   * an inset. The declaration travels with the surface, so it holds at every mount point.
   *
   * Only whether there is an inset is settled here. How wide it is stays a styling question, so a
   * product that wants a different amount writes plain unlayered CSS rather than asking for a
   * token.
   */
  readonly padding?: PaddingDefault;
}

/**
 * Wires the neutral shell host (theme, i18n, icons, error handling) for a
 * distribution. A distribution adds its own router and product identity; the
 * bare platform falls back to the LoomWeaver identity.
 */
export function provideShell(
  options: ShellOptions = {},
): (Provider | EnvironmentProviders)[] {
  return [
    provideZonelessChangeDetection(),
    provideBrowserGlobalErrorListeners(),
    { provide: ErrorHandler, useClass: ShellErrorHandler },
    { provide: COMMAND_INVOKER, useExisting: CommandInvocationService },
    { provide: WORKSPACE_CLAIMS, useExisting: WorkspaceService },
    { provide: UNUSABLE_WORKSPACES, useExisting: UnusableWorkspacesService },

    provideHttpClient(),

    ...(options.retention === undefined
      ? []
      : [{ provide: SURFACE_RETENTION, useValue: options.retention }]),

    ...(options.padding === undefined
      ? []
      : [{ provide: SURFACE_PADDING, useValue: options.padding }]),

    ...(options.serviceWorker === false
      ? []
      : [
          provideServiceWorker('ngsw-worker.js', {
            enabled: !isDevMode(),
            registrationStrategy: 'registerWhenStable:30000',
          }),
        ]),
    ...provideBarItems(...DEFAULT_BAR_ITEMS),

    provideEnvironmentInitializer(() => defineLwIcon()),
    provideEnvironmentInitializer(() => defineLwTooltip()),
    provideEnvironmentInitializer(() => defineLwSelect()),
    provideEnvironmentInitializer(() => defineLwMenu()),
    provideEnvironmentInitializer(() => defineLwMarkdown()),
    provideEnvironmentInitializer(() => defineLwButton()),
    provideEnvironmentInitializer(() => defineLwProgressRing()),

    provideEnvironmentInitializer(() => {
      const registry = inject(ContributionRegistry);
      seedHostCommands(registry, inject(SHELL_LAYOUT), {
        dialogs: inject(DialogService),
        paneTree: inject(PaneTreeService),
        tabs: inject(ContentTabsService),
        workspace: inject(WorkspaceService),
        transloco: inject(TranslocoService),
        settings: inject(SettingsService),
        popout: inject(PopoutService),
        auth: inject(AuthContext),
        closeGuard: inject(SurfaceCloseGuard),
        retention: inject(RetentionCandidates),
        appReset: inject(AppResetService),
        features: inject(FeatureSwitches),
        injector: inject(Injector),
      });
      seedBuiltInMenus(registry, inject(SHELL_LAYOUT), {
        tabs: inject(ContentTabsService),
        paneMove: inject(PaneMoveService),
        viewMove: inject(ViewMoveService),
        viewVisibility: inject(ViewVisibilityService),
        railItems: inject(RailItemsService),
        railMove: inject(RailMoveService),
        paneTree: inject(PaneTreeService),
        viewStates: inject(ViewStateService),
        viewInstances: inject(ViewInstanceService),
        popout: inject(PopoutService),
        features: inject(FeatureSwitches),
        injector: inject(Injector),
      });
      seedContributions(registry, {
        views: inject(VIEW, { optional: true }) ?? [],
        barItems: inject(BAR_ITEM, { optional: true }) ?? [],
        railItems: inject(RAIL_ITEM, { optional: true }) ?? [],
        omit: options.omit ?? [],
      });
    }),

    provideEnvironmentInitializer(() => {
      if (!isDevMode()) {
        return;
      }
      const report = inject(CompositionReport);
      report.checkStaticContributions();
      installCompositionReport(report);
    }),

    provideEnvironmentInitializer(() => inject(KeybindingService).start()),

    provideEnvironmentInitializer(() => inject(RailWorkspaceEntries).start()),

    provideEnvironmentInitializer(() => {
      const settings = inject(SettingsService);
      settings.omit(settingOmitIds(options.omit ?? []));
      registerDefaultSettings(settings);
    }),
    provideTransloco({
      config: {
        availableLangs: [...SUPPORTED_LANGS],
        defaultLang: detectInitialLang(),
        fallbackLang: 'en',
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: TranslocoHttpLoader,
    }),
    provideTranslocoMissingHandler(ShellMissingTranslationHandler),
  ];
}
