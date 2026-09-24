import {
  EnvironmentProviders,
  ErrorHandler,
  inject,
  InjectionToken,
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
import {
  detectInitialLang,
  FALLBACK_LANGUAGE,
  resolveServedLanguages,
  SERVED_LANGUAGES,
} from './i18n/served-languages';
import { SettingsService } from './settings/settings.service';
import { settingOmitIds } from './settings/setting-omit';
import { ShellMissingTranslationHandler } from './i18n/missing-translation-handler';
import { TranslocoHttpLoader } from './i18n/transloco-loader';
import { LocaleService } from './i18n/locale.service';
import { defineLwIcon } from './elements/icon/lw-icon.element';
import { BAR_ITEM, provideBarItems } from './foundation/bar-item';
import { DEFAULT_BAR_ITEMS } from './regions/bar/default-bar-items';
import { RAIL_ITEM } from './foundation/rail-item';
import { VIEW } from './views/view';
import { ContributionRegistry } from './contributions/contribution-registry';
import { CapabilityRefusalErrorHandler } from './permissions/refusal-error-handler';
import { COMMAND_INVOKER } from './foundation/command-invoker';
import { DIALOG_CLOSE_GUARD } from './dialog/dialog-close-guard';
import { SurfaceCloseGuard } from './regions/pane/unsaved-work/surface-close-guard';
import { WORKSPACE_CLAIMS } from './foundation/workspace-claims';
import { UNUSABLE_WORKSPACES } from './foundation/unusable-workspaces';
import { UnusableWorkspacesService } from './workspace/usability/unusable-workspaces.service';
import { CommandInvocationService } from './commands/command-invocation.service';
import { KeybindingService } from './commands/keybinding.service';
import { DialogService } from './dialog/dialog.service';
import { defineLwTooltip } from './elements/tooltip/lw-tooltip.element';
import { defineLwNavTree } from './elements/nav-tree/lw-nav-tree.element';
import { defineLwSelect } from './elements/select/lw-select.element';
import { defineLwMenu } from './elements/menu/lw-menu.element';
import { defineLwMarkdown } from './elements/markdown/lw-markdown.element';
import { defineLwButton } from './elements/button/lw-button.element';
import { defineLwProgressRing } from './elements/progress/lw-progress-ring.element';
import { ContentTabsService } from './regions/content/tabs/content-tabs.service';
import { PaneTreeService } from './regions/pane/tree/pane-tree.service';
import { PaneMoveService } from './regions/pane/drag/pane-move.service';
import { WorkspaceService } from './workspace/workspace.service';
import { ViewStateService } from './views/view-state.service';
import { ViewInstanceService } from './views/view-instance.service';
import { ViewMoveService } from './regions/panel/view-move.service';
import { ViewVisibilityService } from './regions/panel/view-visibility.service';
import { RailItemsService } from './regions/rail/rail-items.service';
import { RailMoveService } from './regions/rail/rail-move.service';
import { RailWorkspaceEntries } from './regions/rail/rail-workspace-entries';
import { PopoutService } from './popout/popout.service';
import {
  APP_RESET_WORKSPACES,
  AppResetService,
} from './regions/reset/app-reset.service';
import { SHELL_LAYOUT } from './layout/layout';
import { SURFACE_RETENTION } from './regions/pane/retention/retention-policy';
import { FeatureSwitches } from './features/feature-switches.service';
import { PaneService } from './regions/pane/pane.service';
import { SURFACE_PADDING } from './foundation/surface-padding';
import { ANNOUNCE_UPDATES } from './update/announce-updates';
import {
  CompositionReport,
  installCompositionReport,
} from './diagnostics/composition-report';
import { registerDefaultSettings } from './default-settings';
import { registerHostCommands } from './host-commands';
import { registerBuiltInMenus } from './built-in-menus';
import { ThemeService } from './theme/theme.service';
import { FontScaleService } from './text-size/font-scale.service';
import { ShellOptions } from './shell-options';

interface ProvidedContributions {
  readonly views: readonly Parameters<ContributionRegistry['addView']>[0][];
  readonly barItems: readonly Parameters<
    ContributionRegistry['addBarItem']
  >[0][];
  readonly railItems: readonly Parameters<
    ContributionRegistry['addRailItem']
  >[0][];
  readonly omit: readonly string[];
}

const WORKBENCH_ELEMENTS: readonly (() => void)[] = [
  defineLwIcon,
  defineLwTooltip,
  defineLwSelect,
  defineLwNavTree,
  defineLwMenu,
  defineLwMarkdown,
  defineLwButton,
  defineLwProgressRing,
];

function valueIfSet<T>(
  token: InjectionToken<T>,
  value: T | undefined,
): Provider[] {
  return value === undefined ? [] : [{ provide: token, useValue: value }];
}

function angularRuntime(): (Provider | EnvironmentProviders)[] {
  return [
    provideZonelessChangeDetection(),
    provideBrowserGlobalErrorListeners(),
    { provide: ErrorHandler, useClass: CapabilityRefusalErrorHandler },
    provideHttpClient(),
  ];
}

function portBindings(): Provider[] {
  return [
    { provide: COMMAND_INVOKER, useExisting: CommandInvocationService },
    { provide: DIALOG_CLOSE_GUARD, useExisting: SurfaceCloseGuard },
    { provide: WORKSPACE_CLAIMS, useExisting: WorkspaceService },
    { provide: UNUSABLE_WORKSPACES, useExisting: UnusableWorkspacesService },
    {
      provide: APP_RESET_WORKSPACES,
      useFactory: () => {
        const workspaces = inject(WorkspaceService);
        return () => workspaces.resetAll();
      },
    },
  ];
}

function optionProviders(
  options: ShellOptions,
  served: readonly string[],
): (Provider | EnvironmentProviders)[] {
  return [
    { provide: SERVED_LANGUAGES, useValue: served },
    ...valueIfSet(SURFACE_RETENTION, options.retention),
    ...valueIfSet(SURFACE_PADDING, options.padding),
    ...valueIfSet(ANNOUNCE_UPDATES, options.announceUpdates),
    ...(options.serviceWorker === false
      ? []
      : [
          provideServiceWorker('ngsw-worker.js', {
            enabled: !isDevMode(),
            registrationStrategy: 'registerWhenStable:30000',
          }),
        ]),
  ];
}

function workbenchElements(): EnvironmentProviders {
  return provideEnvironmentInitializer(() => {
    for (const define of WORKBENCH_ELEMENTS) {
      define();
    }
  });
}

function applyThemeAndTextSize(): void {
  inject(ThemeService);
  inject(FontScaleService);
}

function registerWorkbenchContributions(options: ShellOptions): void {
  const registry = inject(ContributionRegistry);
  registerHostCommands(registry, inject(SHELL_LAYOUT), {
    dialogs: inject(DialogService),
    panes: inject(PaneService),
    workspace: inject(WorkspaceService),
    transloco: inject(TranslocoService),
    settings: inject(SettingsService),
    popout: inject(PopoutService),
    appReset: inject(AppResetService),
    features: inject(FeatureSwitches),
    injector: inject(Injector),
  });
  registerBuiltInMenus(registry, inject(SHELL_LAYOUT), {
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
  registerProvidedContributions(registry, {
    views: inject(VIEW, { optional: true }) ?? [],
    barItems: inject(BAR_ITEM, { optional: true }) ?? [],
    railItems: inject(RAIL_ITEM, { optional: true }) ?? [],
    omit: options.omit ?? [],
  });
}

function registerProvidedContributions(
  registry: ContributionRegistry,
  provided: ProvidedContributions,
): void {
  for (const view of provided.views) {
    registry.addView(view);
  }
  for (const item of provided.barItems) {
    registry.addBarItem(item);
  }
  for (const item of provided.railItems) {
    registry.addRailItem(item);
  }
  registry.omit(provided.omit);
}

function reportCompositionInDevelopment(): void {
  if (!isDevMode()) {
    return;
  }
  const report = inject(CompositionReport);
  report.checkStaticContributions();
  installCompositionReport(report);
}

function registerSettings(options: ShellOptions): void {
  inject(SettingsService).omit(settingOmitIds(options.omit ?? []));
  registerDefaultSettings();
}

function startupRegistrations(
  options: ShellOptions,
): (Provider | EnvironmentProviders)[] {
  return [
    ...provideBarItems(...DEFAULT_BAR_ITEMS),
    provideEnvironmentInitializer(applyThemeAndTextSize),
    provideEnvironmentInitializer(() =>
      registerWorkbenchContributions(options),
    ),
    provideEnvironmentInitializer(reportCompositionInDevelopment),
    provideEnvironmentInitializer(() => inject(KeybindingService).start()),
    provideEnvironmentInitializer(() => inject(LocaleService)),
    provideEnvironmentInitializer(() => inject(RailWorkspaceEntries).start()),
    provideEnvironmentInitializer(() => registerSettings(options)),
  ];
}

function translation(
  served: readonly string[],
): (Provider | EnvironmentProviders)[] {
  return [
    provideTransloco({
      config: {
        availableLangs: [...served],
        defaultLang: detectInitialLang(served),
        fallbackLang: FALLBACK_LANGUAGE,
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: TranslocoHttpLoader,
    }),
    provideTranslocoMissingHandler(ShellMissingTranslationHandler),
  ];
}

/**
 * Wires the neutral shell host (theme, i18n, icons, error handling) for a
 * distribution. A distribution adds its own router and product identity; the
 * bare platform falls back to the LoomWeaver identity.
 */
export function provideShell(
  options: ShellOptions = {},
): (Provider | EnvironmentProviders)[] {
  const served = resolveServedLanguages(options.languages);
  return [
    ...angularRuntime(),
    ...portBindings(),
    ...optionProviders(options, served),
    workbenchElements(),
    ...startupRegistrations(options),
    ...translation(served),
  ];
}
