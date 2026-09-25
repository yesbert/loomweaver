import { bootstrapApplication } from '@angular/platform-browser';
import {
  provideAuthSource,
  provideBarItems,
  provideCommandPaletteEntry,
  provideIcons,
  provideIdentityScopedStores,
  provideLayout,
  provideQuickOpenEntry,
  provideShell,
  provideShellFeatures,
  provideShellRouter,
  provideTranslationNamespaces,
  provideTranslationOverrides,
  provideUnauthorizedRedirect,
  Shell,
  UpdateBadge,
} from '@loomweaver/shell';
import { provideProductIdentity } from '@loomweaver/plugin-sdk';
import { testbedAuth } from '@loomweaver/testbed-weaver';
import { provideTestbedCapture } from './app/capture/provide-capture';
import { provideTestbedCrossTabSync } from './app/cross-tab-sync';
import { e2eSwitches } from './app/e2e-switches';
import { TESTBED_IDENTITY } from './app/testbed-identity';
import { TESTBED_LAYOUT } from './app/testbed-layout';
import { provideTestbedPlugins } from './app/testbed-plugins';
import { provideTestbedWorkspaces } from './app/testbed-workspaces';

const TESTBED_PLUGIN_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3.5 21 20H3l9-16.5Z"/></svg>';

try {
  await bootstrapApplication(Shell, {
    providers: [
      provideShellRouter(),
      provideShell({ padding: 'inset', omit: ['route:testbed.omitted'] }),
      provideShellFeatures(e2eSwitches.features()),
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
      provideUnauthorizedRedirect((attemptedPath) =>
        attemptedPath === 'admin-area'
          ? `/login?from=${encodeURIComponent(attemptedPath)}`
          : null,
      ),
      provideTestbedCapture(),
      provideTestbedCrossTabSync(),
      provideLayout(TESTBED_LAYOUT),
      ...provideTestbedWorkspaces(),
      provideCommandPaletteEntry(),
      provideQuickOpenEntry(),
      ...provideBarItems({
        id: 'shell.update',
        bar: 'right-footer',
        slot: 'end',
        component: UpdateBadge,
      }),
      ...provideTestbedPlugins(),
    ],
  });
} catch (error) {
  console.error(error);
}
