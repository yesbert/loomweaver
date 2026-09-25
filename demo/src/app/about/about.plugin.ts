import { Plugin, PluginContext } from '@loomweaver/plugin-sdk';
import { AboutBody } from './about-body';
import { AboutDialog } from './about-dialog';
import { ABOUT_COMMAND } from './about-command';

const WELCOMED_KEY = 'welcomed';

function openAbout(ctx: PluginContext): void {
  ctx.ui.open(AboutDialog, { title: 'product.about.welcome', size: 'md' });
}

function welcomeOnce(ctx: PluginContext): void {
  const welcomed = ctx.state.watch<boolean>(WELCOMED_KEY);
  welcomed.onChange((value, loaded) => {
    if (!loaded) {
      return;
    }
    if (value !== true) {
      welcomed.set(true);
      openAbout(ctx);
    }
    welcomed.dispose();
  });
}

export const aboutPlugin: Plugin = {
  manifest: {
    id: 'about',
    name: 'About',
    capabilities: ['contributions', 'ui'],
  },
  activate(ctx) {
    ctx.registerCommand({
      id: ABOUT_COMMAND,
      title: 'product.about.title',
      description: 'product.about.commandDescription',
      icon: 'info',
      run: () => openAbout(ctx),
    });
    ctx.registerSettingsSection({
      id: 'about.settings',
      title: 'product.about.title',
      group: 'settings.group.options',
      order: 100,
      rows: [
        {
          id: 'about.settings.body',
          label: 'product.about.title',
          control: { kind: 'component', component: AboutBody, fullWidth: true },
        },
      ],
    });
    welcomeOnce(ctx);
  },
};
