import { ContentRoute } from '@loomweaver/plugin-sdk';
import { View } from '../../layout/view';
import { surfaceForPanePath } from './pane-surface';

const home = { id: 'home', path: '', title: 'home.title' } as ContentRoute;
const entry = {
  id: 'entry',
  path: 'entry/:id',
  title: 'entry.title',
} as ContentRoute;
const routes = [home, entry];
const views = [{ id: 'outline', title: 'outline.title' }] as View[];

describe('surfaceForPanePath', () => {
  it('resolves a docked path to its view', () => {
    expect(surfaceForPanePath(routes, views, 'view:outline')).toBe(views[0]);
  });

  it('resolves an unknown docked path to nothing rather than to home', () => {
    expect(surfaceForPanePath(routes, views, 'view:gone')).toBeUndefined();
  });

  it('resolves a route path, and a sub-path to its parent route', () => {
    expect(surfaceForPanePath(routes, views, 'entry/e-01')).toBe(entry);
    expect(surfaceForPanePath(routes, views, 'entry/e-01/detail')).toBe(entry);
  });

  it('lets home answer for home', () => {
    expect(surfaceForPanePath(routes, views, '')).toBe(home);
  });

  it('does not let home answer for a path whose surface is gone', () => {
    expect(surfaceForPanePath(routes, views, 'retired/thing')).toBeUndefined();
  });
});

describe('surfaceForPanePath — container children', () => {
  const child = { id: 'app.item', title: 'item.title' } as View;
  const list = { id: 'app.list', title: 'list.title' } as View;
  const browse = {
    id: 'browse',
    path: 'browse/:id',
    title: 'browse.title',
    container: {
      children: [
        { surface: 'app.list', segment: 'list' },
        { surface: 'app.item', segment: 'item/:itemId' },
      ],
    },
  } as unknown as ContentRoute;
  const withContainer = [home, browse];
  const containerViews = [child, list];

  it('resolves the container itself for its own path', () => {
    expect(
      surfaceForPanePath(withContainer, containerViews, 'browse/alpha'),
    ).toBe(browse);
  });

  it('resolves a child below the container, values and all', () => {
    expect(
      surfaceForPanePath(
        withContainer,
        containerViews,
        'browse/alpha/item/e-01',
      ),
    ).toBe(child);
    expect(
      surfaceForPanePath(withContainer, containerViews, 'browse/alpha/list'),
    ).toBe(list);
  });

  it('resolves nothing for a path below the container that names no child', () => {
    expect(
      surfaceForPanePath(withContainer, containerViews, 'browse/alpha/gone'),
    ).toBeUndefined();
  });
});
