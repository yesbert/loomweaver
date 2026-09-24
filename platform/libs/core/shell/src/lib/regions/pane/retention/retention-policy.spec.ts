import { ContentRoute } from '@loomweaver/plugin-sdk';
import { routeRetains } from './retention-policy';

const route = (fields: Partial<ContentRoute>): ContentRoute =>
  ({ path: 'p', ...fields }) as ContentRoute;

describe('routeRetains', () => {
  it('keeps what the route declares, and the default for what it leaves open', () => {
    expect(routeRetains(route({}), 'destroy')).toBe(false);
    expect(routeRetains(route({ retain: 'always' }), 'destroy')).toBe(true);
    expect(
      routeRetains(route({ iframe: '/f.html', retain: 'always' }), 'destroy'),
    ).toBe(true);
    expect(routeRetains(route({}), 'retain')).toBe(true);
    expect(routeRetains(route({ retain: 'never' }), 'retain')).toBe(false);
  });

  it('never retains a container, whatever it declares', () => {
    expect(
      routeRetains(
        route({ container: { children: ['a'] }, retain: 'always' } as never),
        'retain',
      ),
    ).toBe(false);
  });
});
