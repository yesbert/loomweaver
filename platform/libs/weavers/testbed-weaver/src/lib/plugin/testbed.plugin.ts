import { Plugin } from '@loomweaver/plugin-sdk';
import { testbedContent } from './testbed-content';
import { testbedScratch } from '../state-readouts/testbed-scratch';
import { testbedSession } from '../state-readouts/testbed-session';
import { testbedActiveContent } from '../state-readouts/testbed-active-content';
import { registerSurfaces } from './testbed-surfaces';
import { registerIcons } from '../chrome/testbed-icons';
import { registerCommands } from './testbed-commands';
import { registerChrome } from '../chrome/testbed-chrome';
import { registerMenus } from '../chrome/testbed-menus';
import { registerSettings } from '../chrome/testbed-settings';
import { registerTheme, releaseTheme } from '../theming/testbed-theme';

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
