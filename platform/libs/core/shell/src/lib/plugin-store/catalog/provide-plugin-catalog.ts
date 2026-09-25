import {
  EnvironmentProviders,
  Provider,
  inject,
  provideEnvironmentInitializer,
} from '@angular/core';
import { SettingsService } from '../../settings/settings.service';
import { PluginStoreSettings } from '../plugin-store-settings';
import { ContributionRegistry } from '../../contributions/contribution-registry';
import { PluginStoreService } from '../plugin-store.service';
import { DEFAULT_STORE_TITLE } from '../plugin-store-dialog';
import { FramePluginRuntime } from '../../plugin/frame/frame-plugin-runtime';
import {
  PLUGIN_CATALOG,
  PluginCatalog,
  urlPluginCatalog,
} from './plugin-catalog';
import { PluginDeploymentService } from '../lifecycle/plugin-deployment.service';
import { PluginCatalogEntries } from './plugin-catalog-entries';
import { PluginIsolationLevel } from '../../foundation/plugin-isolation-level';
import { CATALOG_MAX_ISOLATION_LEVEL } from './plugin-catalog';

/** Options for {@link providePluginCatalog}. */
export interface PluginCatalogOptions {
  /**
   * Transloco key (or literal) for the store's settings-section title — brand the store per product
   * (e.g. `'product.marketplace'`). Defaults to the built-in `settings.pluginStore` ("Plugin store").
   */
  readonly title?: string;
  /**
   * The highest level this catalog may confer on what it carries. Defaults to the strict one, so a
   * catalog can never hand out an embedded application unless the composition said it may. An entry
   * asking for more is refused rather than started lower — a plugin running below what it needs
   * fails in ways nobody can trace back to a line of configuration.
   */
  readonly maxLevel?: PluginIsolationLevel;
}

/**
 * Wires the plugin store into a distribution: provides the catalog (a same-origin JSON URL
 * or a custom {@link PluginCatalog} implementation), makes sure the frame runtime is active even
 * when no plugin is composed statically, and registers the store's entry points: a settings section
 * (`setting:shell.pluginStore`, omit-able) whose Browse button opens the **store dialog** (a
 * searchable list and an in-app detail pane with the plugin's README), plus the palette command
 * `shell.openPluginStore`. The title is brandable via {@link PluginCatalogOptions.title}. Installing
 * and uninstalling happens in the store; an installed plugin that declares its own settings gets its
 * own entry under the **Community plugins** nav group. Place after `provideShell()`.
 */
export function providePluginCatalog(
  source: PluginCatalog | string,
  options: PluginCatalogOptions = {},
): (Provider | EnvironmentProviders)[] {
  const catalog =
    typeof source === 'string' ? urlPluginCatalog(source) : source;
  const title = options.title ?? DEFAULT_STORE_TITLE;
  return [
    { provide: PLUGIN_CATALOG, useValue: catalog },
    ...(options.maxLevel
      ? [{ provide: CATALOG_MAX_ISOLATION_LEVEL, useValue: options.maxLevel }]
      : []),
    provideEnvironmentInitializer(() =>
      inject(FramePluginRuntime).activateAll(),
    ),
    provideEnvironmentInitializer(() => {
      const deployment = inject(PluginDeploymentService);
      void inject(PluginCatalogEntries)
        .load()
        .then((entries) => deployment.adopt(entries))
        .catch((error: unknown) => {
          console.error(
            'The plugin catalog could not be read; the plugins it last deployed stay active.',
            error,
          );
        });
    }),
    provideEnvironmentInitializer(() => {
      const store = inject(PluginStoreService);
      store.configure(title);
      inject(ContributionRegistry).addCommand({
        id: 'shell.openPluginStore',
        title,
        icon: 'plugin',
        run: () => {
          store.open();
        },
      });
      inject(SettingsService).register({
        id: 'shell.pluginStore',
        title,
        group: 'settings.group.options',
        order: 20,
        rows: [
          {
            id: 'shell.pluginStoreBrowse',
            label: title,
            control: {
              kind: 'component',
              component: PluginStoreSettings,
              fullWidth: true,
            },
          },
        ],
      });
    }),
  ];
}
