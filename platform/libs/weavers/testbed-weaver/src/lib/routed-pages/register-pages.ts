import { PluginContext } from '@loomweaver/plugin-sdk';
import { testbedContext } from '../bound-context';
import { TestbedHomeView } from './testbed-home-view';
import { TestbedOwnerView } from './testbed-owner-view';
import { TestbedSearchView } from './testbed-search-view';

export const HOME_PATH = '';
export const SEARCH_PATH = 'search';
export const NOTES_PATH = 'notes';
const SEARCH_MORE_MENU = 'testbed/search/more';

export function registerPages(ctx: PluginContext): void {
  ctx.registerSurface({
    id: 'testbed.home',
    title: 'testbed.home.title',
    routable: { path: HOME_PATH },
    component: TestbedHomeView,
  });
  ctx.registerSurface({
    id: 'testbed.search',
    title: 'testbed.search.title',
    routable: { path: SEARCH_PATH },
    padded: false,
    component: TestbedSearchView,
    actions: [
      {
        id: 'testbed.search.home',
        icon: 'testbedHome',
        title: 'testbed.search.goHome',
        order: 0,
        command: 'testbed.go.home',
      },
      {
        id: 'testbed.search.more',
        icon: 'more',
        title: 'testbed.search.more',
        order: 1,
        menu: SEARCH_MORE_MENU,
        menuTrigger: 'primary',
      },
      {
        id: 'testbed.search.alone',
        icon: 'edit',
        title: 'testbed.search.alone',
        order: 3,
        command: 'testbed.go.notes',
        menu: 'testbed/search/alone',
        menuTrigger: 'primary',
        menuHeader: { title: 'testbed.notes.title', command: 'testbed.go.notes' },
      },
      {
        id: 'testbed.search.unfilled',
        icon: 'add',
        title: 'testbed.search.unfilled',
        order: 2,
        menu: 'testbed/search/unfilled',
        menuTrigger: 'primary',
      },
    ],
  });
  ctx.registerMenuItem({ menu: SEARCH_MORE_MENU, command: 'testbed.go.notes' });
  ctx.registerSurface({
    id: 'testbed.notes',
    title: 'testbed.notes.title',
    routable: { path: NOTES_PATH },
    retain: 'always',
    saveOn: 'hide',
    loadComponent: () =>
      import('./testbed-notes-view').then((m) => m.TestbedNotesView),
  });
  ctx.registerSurface({
    id: 'testbed.omitted',
    title: 'testbed.omitted.title',
    routable: { path: 'omitted' },
    loadComponent: () =>
      import('./testbed-notes-view').then((m) => m.TestbedNotesView),
  });
  registerOwnerFacets(ctx);

  ctx.registerCommand({
    id: 'testbed.go.home',
    title: 'testbed.home.title',
    icon: 'testbedHome',
    run: () => testbedContext.navigateTo(HOME_PATH),
  });
  ctx.registerCommand({
    id: 'testbed.go.search',
    title: 'testbed.search.title',
    icon: 'search',
    run: () => testbedContext.navigateTo(SEARCH_PATH),
  });
  ctx.registerCommand({
    id: 'testbed.go.notes',
    title: 'testbed.notes.title',
    icon: 'edit',
    run: () => testbedContext.navigateTo(NOTES_PATH),
  });
}

function registerOwnerFacets(ctx: PluginContext): void {
  for (const [index, facet] of ['queue', 'profile'].entries()) {
    ctx.registerSurface({
      id: `testbed.owner.${facet}`,
      title: `testbed.owner.${facet}`,
      order: index,
      routable: {
        path: `owner/:ownerId/${facet}`,
        follows: true,
      },
      component: TestbedOwnerView,
    });
  }
}
