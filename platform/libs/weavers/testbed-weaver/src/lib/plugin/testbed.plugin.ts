import { Plugin } from '@loomweaver/plugin-sdk';
import { testbedContent } from './testbed-content';
import { testbedScratch } from './testbed-scratch';
import { testbedSession } from './testbed-session';
import { testbedActiveContent } from './testbed-active-content';
import { registerSurfaces } from './testbed-surfaces';
import { registerIcons } from './testbed-icons';
import { registerCommands } from './testbed-commands';
import { registerChrome } from './testbed-chrome';
import { registerMenus } from './testbed-menus';
import { registerSettings } from './testbed-settings';
import { registerTheme, releaseTheme } from './testbed-theme';

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
    testbedContent.bind(ctx);
    testbedSession.bind(ctx.session);
    testbedActiveContent.bind(ctx.activeContent);
    testbedScratch.bind(ctx.state.watch('scratch'));
    registerSurfaces(ctx);
    registerIcons(ctx);
    registerCommands(ctx);
    registerChrome(ctx);
    registerMenus(ctx);
    registerSettings(ctx);
    registerTheme(ctx);
  },
  deactivate() {
    testbedContent.unbind();
    testbedSession.unbind();
    testbedActiveContent.unbind();
    testbedScratch.unbind();
    releaseTheme();
  },
};
