export * from './lib/shell';
export * from './lib/provide-shell';
export * from './lib/shell-options';

export * from './lib/auth/auth-context';

export type {
  WorkbenchCarriedForm,
  WorkbenchCompression,
  WorkbenchPictureForm,
} from './lib/capture/picture-form';
export type { WorkbenchPictureSize } from './lib/capture/picture-size';
export { WorkbenchCaptureService } from './lib/capture/workbench-capture.service';
export type {
  WorkbenchPicture,
  WorkbenchPictureRequest,
} from './lib/capture/workbench-capture.service';

export * from './lib/commands/command-invocation.service';
export * from './lib/commands/command.service';
export * from './lib/commands/keyboard/format-chord';
export * from './lib/commands/keyboard/keybinding.service';
export * from './lib/commands/palette/entry/provide-command-palette-entry';
export * from './lib/commands/palette/entry/provide-quick-open-entry';

export * from './lib/contributions/contribution-registry';

export * from './lib/dialog/dialog-outlet';
export { DialogRef } from '@loomweaver/plugin-sdk';
export * from './lib/dialog/dialog.service';

export * from './lib/elements/button/lw-button';
export * from './lib/elements/button/lw-button.element';
export { LOOM_ICONS, type LoomIconName } from './lib/elements/icon/loom-icons';
export * from './lib/elements/icon/lw-icon.element';
export { provideIcons } from './lib/elements/icon/provide-icons';
export * from './lib/elements/markdown/lw-markdown.element';
export { defineLwMenu } from './lib/elements/menu/lw-menu.element';
export * from './lib/elements/nav-tree/lw-nav-group.element';
export * from './lib/elements/nav-tree/lw-nav-item.element';
export * from './lib/elements/nav-tree/lw-nav-tree.element';
export { forgetLwNavFolds } from './lib/elements/nav-tree/nav-fold-state';
export { defineLwProgressRing } from './lib/elements/progress/lw-progress-ring.element';
export { defineLwSelect } from './lib/elements/select/lw-select.element';
export * from './lib/elements/spinner/lw-spinner';
export * from './lib/elements/tooltip/lw-tooltip.element';

export * from './lib/features/feature-switches.service';

export * from './lib/foundation/bar-item';
export * from './lib/foundation/command-invoker';
export type { PluginIsolationLevel } from './lib/foundation/plugin-isolation-level';
export * from './lib/foundation/rail-item';
export * from './lib/foundation/required-plugins';
export * from './lib/foundation/shell-features';
export type { PaddingDefault } from './lib/foundation/surface-padding';
export * from './lib/workspace/usability/unusable-workspaces';

export { LocaleService } from './lib/i18n/locale.service';
export { type ServedLanguage } from './lib/i18n/served-languages';
export {
  provideTranslationNamespaces,
  TRANSLATION_NAMESPACES,
} from './lib/i18n/translation-namespaces';
export {
  provideTranslationOverrides,
  TRANSLATION_OVERRIDES,
} from './lib/i18n/translation-overrides';

export * from './lib/layout/layout';
export { ViewportService } from './lib/layout/viewport.service';

export * from './lib/notifications/notification.service';
export * from './lib/notifications/toast-outlet';

export * from './lib/permissions/capability-grant.service';
export * from './lib/permissions/provide-capability-grants';

export * from './lib/persistence/identity-scope/provide-identity-scoped-stores';
export * from './lib/persistence/key-value-store';
export * from './lib/persistence/settings-store';
export * from './lib/persistence/cross-tab/state-sync.service';
export * from './lib/persistence/working-state-store';

export * from './lib/plugin/enablement/plugin-enablement.service';
export { type PluginInfo } from './lib/plugin/enablement/plugin-info';
export * from './lib/plugin/frame/frame-plugin';
export * from './lib/plugin/frame/frame-plugin-runtime';
export * from './lib/plugin/plugin';
export * from './lib/plugin/plugin-runtime';

export { type PluginCatalogEntry } from './lib/plugin-store/catalog/catalog-entry';
export * from './lib/plugin-store/catalog/plugin-catalog';
export * from './lib/plugin-store/catalog/provide-plugin-catalog';
export { type InstalledPlugin } from './lib/plugin-store/lifecycle/installed-plugin';
export * from './lib/plugin-store/lifecycle/plugin-install.service';
export * from './lib/plugin-store/plugin-store.service';

export * from './lib/popout/popout.service';

export * from './lib/regions/bar/shell-brand';

export {
  provideUnauthorizedRedirect,
  type UnauthorizedHandler,
} from './lib/regions/content/access/content-access';
export * from './lib/regions/content/routing/provide-shell-router';
export { type ContentTabView } from './lib/regions/content/tabs/content-tab-projection';
export * from './lib/regions/content/tabs/content-tabs.service';
export { type QuickOpenTarget } from './lib/regions/content/tabs/quick-open-target';
export {
  provideTabAddressResolver,
  type TabAddressInput,
  type TabAddressResolver,
} from './lib/regions/content/tabs/tab-address';

export { type PaneHandle } from './lib/regions/pane/pane-handle';
export * from './lib/regions/pane/pane.service';
export type { RetentionDefault } from './lib/regions/pane/retention/retention-policy';
export { type PaneRef } from './lib/regions/pane/tree/pane-address';

export * from './lib/regions/panel/sidebar.service';

export * from './lib/regions/reset/app-reset.service';

export * from './lib/settings-dialog/lw-setting-row';
export * from './lib/settings-dialog/settings-model';
export * from './lib/settings-dialog/settings.service';

export * from './lib/text-size/font-scale.service';

export * from './lib/theme/theme.service';

export * from './lib/update/update-badge';
export * from './lib/update/update.service';

export * from './lib/version/lw-version';
export * from './lib/version/version.service';

export * from './lib/views/view';

export { type Workspace } from './lib/workspace/catalog/saved-workspaces';
export * from './lib/workspace/declaration/provide-workspaces';
export type { WorkspaceClaim } from './lib/workspace/workspace-claims';
export type {
  WorkspaceArea,
  WorkspaceAreaBase,
  WorkspaceColumnArea,
  WorkspaceDefinition,
  WorkspaceRowArea,
  WorkspaceTab,
  WorkspaceTabArea,
  WorkspaceTabEntry,
} from './lib/workspace/declaration/workspace-definition';
export * from './lib/workspace/workspace.service';
