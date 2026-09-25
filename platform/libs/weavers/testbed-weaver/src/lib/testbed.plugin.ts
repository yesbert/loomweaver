import { Plugin } from '@loomweaver/plugin-sdk';
import { registerAccessGating } from './access-gating/register-access-gating';
import { testbedContext } from './bound-context';
import { registerChrome } from './chrome/register-chrome';
import { registerMenus } from './chrome/register-menus';
import { registerIcons } from './chrome/testbed-icons';
import { registerSettings } from './chrome/testbed-settings';
import { registerContainers } from './containers/register-containers';
import { registerDashboard } from './dashboard/register-dashboard';
import { registerDialogs } from './dialogs/register-dialogs';
import { entryTabs } from './entry-tabs/entry-tab-actions';
import { registerEntryTabs } from './entry-tabs/register-entry-tabs';
import { registerNavigation } from './navigation/register-navigation';
import { registerPages } from './routed-pages/register-pages';
import { registerSandboxedSurfaces } from './sandboxed-surfaces/register-sandboxed-surfaces';
import {
  registerReadouts,
  releaseReadouts,
} from './state-readouts/register-readouts';
import { registerTheme, releaseTheme } from './theming/testbed-theme';

export const testbedPlugin: Plugin = {
  manifest: {
    id: 'testbed',
    name: 'TestbedWeaver',
    capabilities: [
      'contributions',
      'ui',
      'host',
      'navigation',
      'session',
      'theme',
    ],
  },
  activate(ctx) {
    testbedContext.bind(ctx);
    registerIcons(ctx);
    registerPages(ctx);
    registerDashboard(ctx);
    registerEntryTabs(ctx);
    registerContainers(ctx);
    registerNavigation(ctx);
    registerReadouts(ctx);
    registerSandboxedSurfaces(ctx);
    registerAccessGating(ctx);
    registerDialogs(ctx);
    registerChrome(ctx);
    registerMenus(ctx);
    registerSettings(ctx);
    registerTheme(ctx);
  },
  deactivate() {
    testbedContext.unbind();
    entryTabs.reset();
    releaseReadouts();
    releaseTheme();
  },
};
