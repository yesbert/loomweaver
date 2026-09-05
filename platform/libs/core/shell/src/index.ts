export * from './lib/shell';
export * from './lib/provide-shell';
export * from './lib/foundation/shell-features';
export * from './lib/features/feature-switches.service';
export * from './lib/foundation/unusable-workspaces';
export type { RetentionDefault } from './lib/regions/pane/retention/retention-policy';
export {
  provideTranslationNamespaces,
  provideTranslationOverrides,
  TRANSLATION_NAMESPACES,
  TRANSLATION_OVERRIDES,
} from './lib/i18n/transloco-loader';
export * from './lib/elements/button/lw-button';
export * from './lib/elements/button/lw-button.element';
export * from './lib/elements/markdown/lw-markdown.element';
export * from './lib/elements/nav-tree/lw-nav-group.element';
export { forgetLwNavFolds } from './lib/elements/nav-tree/nav-fold-state';
export * from './lib/elements/nav-tree/lw-nav-item.element';
export * from './lib/elements/nav-tree/lw-nav-tree.element';
export * from './lib/elements/spinner/lw-spinner';
export * from './lib/elements/tooltip/lw-tooltip.element';
export * from './lib/version/lw-version';
export * from './lib/notifications/toast-outlet';
export * from './lib/update/update-badge';
export * from './lib/dialog/dialog-outlet';
export * from './lib/settings/lw-setting-row';
export * from './lib/settings/settings-model';
export * from './lib/settings/settings.service';
export * from './lib/persistence/key-value-store';
export * from './lib/persistence/settings-store';
export * from './lib/persistence/working-state-store';
export * from './lib/persistence/identity-scoped-stores';
export * from './lib/persistence/state-sync.service';
export * from './lib/popout/popout.service';
export * from './lib/workspace/provide-workspaces';
export type {
  WorkspaceArea,
  WorkspaceAreaBase,
  WorkspaceColumnArea,
  WorkspaceDefinition,
  WorkspaceRowArea,
  WorkspaceTab,
  WorkspaceTabArea,
  WorkspaceTabEntry,
} from './lib/workspace/workspace-definition';
export * from './lib/version/version.service';
export * from './lib/notifications/notification.service';
export * from './lib/dialog/dialog-ref';
export * from './lib/dialog/dialog.service';
export * from './lib/update/update.service';
export * from './lib/auth/auth-context';
export * from './lib/theme/theme.service';
export * from './lib/layout/layout';
export * from './lib/foundation/bar-item';
export * from './lib/foundation/rail-item';
export * from './lib/layout/view';
export * from './lib/regions/content/routing/provide-content-router';
export {
  provideUnauthorizedRedirect,
  type UnauthorizedHandler,
} from './lib/regions/content/access/content-access';
export * from './lib/regions/content/tabs/content-tabs.service';
export * from './lib/regions/pane/pane.service';
export * from './lib/workspace/workspace.service';
export { type Workspace } from './lib/workspace/baseline/workspace-state';
export * from './lib/regions/reset/app-reset.service';
export * from './lib/regions/panel/sidebar.service';
export * from './lib/text-size/font-scale.service';
export * from './lib/plugin-store/plugin-store.service';
export { type PaneHandle } from './lib/regions/pane/pane-handle';
export { type QuickOpenTarget } from './lib/regions/content/tabs/quick-open-target';
export { type ContentTabView } from './lib/regions/content/tabs/content-tab-projection';
export {
  provideTabAddressResolver,
  type TabAddressInput,
  type TabAddressResolver,
} from './lib/regions/content/tabs/tab-address';
export * from './lib/plugin/contribution-registry';
export * from './lib/commands/command.service';
export * from './lib/commands/keybinding.service';
export * from './lib/commands/format-chord';
export * from './lib/commands/search-entry/provide-command-palette-entry';
export * from './lib/commands/search-entry/provide-quick-open-entry';
export * from './lib/plugin/plugin';
export * from './lib/plugin/plugin-runtime';
export * from './lib/plugin/sandbox/frame-plugin';
export * from './lib/plugin/sandbox/sandbox-plugin-runtime';
export * from './lib/foundation/command-invoker';
export * from './lib/commands/command-invocation.service';
export * from './lib/permissions/capability-grants';
export * from './lib/foundation/required-plugins';
export * from './lib/permissions/capability-grant.service';
export * from './lib/plugin-store/lifecycle/plugin-enablement.service';
export { type PluginInfo } from './lib/plugin-store/lifecycle/plugin-info';
export * from './lib/plugin-store/lifecycle/plugin-install.service';
export {
  type InstalledPlugin,
  type PluginCatalogEntry,
} from './lib/plugin-store/installed-plugin';
export * from './lib/plugin-store/catalog/plugin-catalog';
export * from './lib/plugin-store/catalog/provide-plugin-catalog';

export { type LoomIconName } from './lib/elements/icon/loom-icons';
export { provideIcons } from './lib/elements/icon/provide-icons';
export * from './lib/elements/icon/lw-icon.element';
