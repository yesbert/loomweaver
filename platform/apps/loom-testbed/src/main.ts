import { bootstrapApplication } from '@angular/platform-browser';
import { inject, provideEnvironmentInitializer } from '@angular/core';
import {
  Shell,
  ShellLayout,
  UpdateBadge,
  provideAuthSource,
  provideBarItems,
  provideCapabilityGrants,
  provideCommandPaletteEntry,
  provideIcons,
  provideIdentityScopedStores,
  provideLayout,
  provideQuickOpenEntry,
  provideRailItems,
  provideShellRouter,
  provideTranslationNamespaces,
  provideTranslationOverrides,
  providePlugins,
  provideRequiredPlugins,
  StateSyncService,
  providePluginCatalog,
  provideFramePlugins,
  provideShell,
  provideShellFeatures,
  provideUnauthorizedRedirect,
  provideWorkspaces,
} from '@loomweaver/shell';
import { provideProductIdentity } from '@loomweaver/plugin-sdk';
import { testbedAuth, testbedPlugin, testbedTheme } from '@loomweaver/testbed-weaver';
import { TESTBED_IDENTITY } from './app/testbed-identity';
import {
  TESTBED_FEATURES_KEY,
  testbedFeatures,
} from './app/testbed-features';

export const INITIAL_WORKSPACE_KEY = 'lw.testbed.initial-workspace';
export const CLAIMED_ENTRIES_KEY = 'lw.testbed.claimed-entries';

const TESTBED_PLUGIN_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3.5 21 20H3l9-16.5Z"/></svg>';

const layout: ShellLayout = {
  regions: [
    { id: 'top-bar', type: 'bar', dock: 'top' },
    { id: 'activity', type: 'rail', dock: 'left' },
    { id: 'primary', type: 'panel', dock: 'left' },
    { id: 'left-footer', type: 'bar', dock: 'left' },
    { id: 'main', type: 'content', dock: 'center' },
    { id: 'secondary', type: 'panel', dock: 'right' },
    { id: 'activity-right', type: 'rail', dock: 'right' },
    { id: 'right-footer', type: 'bar', dock: 'right' },
    { id: 'status-bar', type: 'bar', dock: 'bottom' },
  ],
};

try {
  await bootstrapApplication(Shell, {
    providers: [
      provideShellRouter(),
      provideShell({ omit: ['route:testbed.retired'] }),
      provideShellFeatures(
        testbedFeatures(localStorage.getItem(TESTBED_FEATURES_KEY)),
      ),
      provideIcons({ plugin: TESTBED_PLUGIN_ICON }),
      provideTranslationNamespaces('testbed', 'product'),
      provideTranslationOverrides(),
      provideProductIdentity(TESTBED_IDENTITY),
      provideAuthSource(() => testbedAuth.snapshot, {
        onIdentityChange: 'reload',
      }),
      provideIdentityScopedStores({
        identity: () => testbedAuth.snapshot().subject ?? null,
      }),
      provideEnvironmentInitializer(() => {
        const sync = inject(StateSyncService);
        const session = testbedAuth.connectSync({
          announce: (key) => sync.announce(key),
        });
        sync.register('external', session.key, () => session.refresh());
        const theme = testbedTheme.connectSync({
          announce: (key) => sync.announce(key),
        });
        sync.register('external', theme.key, () => theme.refresh());
      }),
      provideUnauthorizedRedirect((attemptedPath) =>
        attemptedPath === 'admin-area'
          ? `/login?from=${encodeURIComponent(attemptedPath)}`
          : null,
      ),
      provideLayout(layout),
      provideWorkspaces(
        {
          id: 'testbed.home',
          title: 'product.workspace.home',
          icon: 'testbedHome',
          sidebars: { primary: [], secondary: [] },
          content: { tabs: [{ path: '', closable: false }] },
        },
        {
          id: 'testbed.review',
          title: 'product.workspace.review',
          icon: 'workspaces',
          claims:
            localStorage.getItem(CLAIMED_ENTRIES_KEY) === 'review'
              ? ['entry/:id']
              : [],
          initial: localStorage.getItem(INITIAL_WORKSPACE_KEY) === 'review',
          sidebars: { primary: ['testbed.nav'] },
          content: {
            columns: [
              { size: 35, tabs: [{ path: 'entry/e-01', closable: false }] },
              { rows: [{ size: 60, tabs: ['search'] }, { tabs: ['notes'] }] },
            ],
          },
        },
        {
          id: 'testbed.dashboard',
          title: 'product.workspace.dashboard',
          icon: 'testbedDashboard',
          sidebars: { primary: [], secondary: [] },
          content: {
            tabs: [
              { path: 'dashboard/overview', closable: false, active: true },
              { path: 'dashboard/trends', closable: false },
              { path: 'dashboard/export', closable: false },
            ],
          },
        },
        {
          id: 'testbed.search',
          title: 'product.workspace.search',
          icon: 'search',
          content: { tabs: [{ path: 'search', closable: false }] },
        },
        {
          id: 'testbed.notes',
          title: 'product.workspace.notes',
          icon: 'edit',
          content: { tabs: [{ path: 'notes', closable: false }] },
        },
        {
          id: 'testbed.sandbox',
          title: 'product.workspace.sandbox',
          icon: 'testbedSandbox',
          claims: ['sandbox-rpc'],
          content: { tabs: [{ path: 'sandbox-rpc', closable: false }] },
        },
      ),
      ...provideRailItems(
        {
          id: 'testbed.workspace.home',
          rail: 'activity',
          icon: 'testbedHome',
          title: 'product.workspace.home',
          order: 0,
          workspace: 'testbed.home',
        },
        {
          id: 'testbed.workspace.review',
          rail: 'activity',
          icon: 'workspaces',
          title: 'product.workspace.review',
          order: 2,
          workspace: 'testbed.review',
        },
        {
          id: 'testbed.workspace.dashboard',
          rail: 'activity',
          icon: 'testbedDashboard',
          title: 'product.workspace.dashboard',
          order: 1,
          workspace: 'testbed.dashboard',
        },
        {
          id: 'testbed.workspace.search',
          rail: 'activity',
          icon: 'search',
          title: 'product.workspace.search',
          order: 3,
          workspace: 'testbed.search',
        },
        {
          id: 'testbed.workspace.sandbox',
          rail: 'activity',
          icon: 'testbedSandbox',
          title: 'product.workspace.sandbox',
          order: 5,
          workspace: 'testbed.sandbox',
        },
        {
          id: 'testbed.workspace.notes',
          rail: 'activity',
          icon: 'edit',
          title: 'product.workspace.notes',
          order: 4,
          workspace: 'testbed.notes',
        },
      ),
      provideCommandPaletteEntry(),
      provideQuickOpenEntry(),
      ...provideBarItems({
        id: 'shell.update',
        bar: 'right-footer',
        slot: 'end',
        component: UpdateBadge,
      }),
      provideCapabilityGrants({
        testbed: [
          'contributions',
          'ui',
          'host',
          'navigation',
          'session',
          'theme',
        ],
        'sandbox-rpc': ['contributions', 'ui', 'session'],
        'sandbox-static': ['contributions', 'navigation'],
      }),
      ...providePlugins(testbedPlugin),
      provideRequiredPlugins('sandbox-rpc'),
      ...provideFramePlugins(
        {
          id: 'sandbox-rpc',
          name: 'Sandbox (RPC)',
          entryUrl: '/sandbox-rpc/plugin.html',
          capabilities: ['contributions', 'ui', 'session'],
        },
        {
          id: 'sandbox-static',
          entryUrl: '/sandbox-static/plugin.html',
          capabilities: ['contributions', 'navigation'],
        },
      ),
      ...providePluginCatalog('/plugins/catalog.json'),
    ],
  });
} catch (error) {
  console.error(error);
}
