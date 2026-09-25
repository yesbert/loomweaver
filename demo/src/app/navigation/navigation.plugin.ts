import { Plugin } from '@loomweaver/plugin-sdk';
import { ModuleNavView } from './module-nav-view';
import { MODULES, navSurfaceId } from './module-tree';
import { moduleIcons } from './module-icons';
import { navigationActions } from './navigation-actions';

export const navigationPlugin: Plugin = {
  manifest: {
    id: 'navigation',
    name: 'Module navigation',
    capabilities: ['contributions', 'navigation'],
  },
  activate(ctx) {
    navigationActions.bind(ctx);
    ctx.contributeIcons(moduleIcons);

    for (const module of MODULES) {
      if (module.areas.length === 0) {
        continue;
      }
      navigationActions.remember(navSurfaceId(module.id), module.titleKey);
      ctx.registerSurface({
        id: navSurfaceId(module.id),
        title: module.titleKey,
        icon: module.icon,
        component: ModuleNavView,
        docks: ['left-panel'],
        padded: false,
      });
    }
  },
  deactivate() {
    navigationActions.unbind();
  },
};
