import { paramsOfPattern } from '../content-path';
import { ContentRoute } from '@loomweaver/plugin-sdk';
import {
  collidingParam,
  computedTabAddress,
  followingTabAddress,
} from './tab-address';

describe('computing a following tab address', () => {
  const params = { cedentId: 'US003950', programId: '205470' };

  it('substitutes the known values by name', () => {
    expect(
      computedTabAddress(
        'cedents/:cedentId/programs/:programId/treaties',
        params,
      ),
    ).toBe('cedents/US003950/programs/205470/treaties');
  });

  it('truncates before the first value it does not know', () => {
    expect(
      computedTabAddress(
        'cedents/:cedentId/programs/:programId/reports/:reportId',
        params,
      ),
    ).toBe('cedents/US003950/programs/205470/reports');
  });

  it('writes a value the way the address holds it, so it stays one segment', () => {
    expect(
      computedTabAddress('people/:name/notes', { name: 'Müller & Söhne a/b' }),
    ).toBe('people/M%C3%BCller%20&%20S%C3%B6hne%20a%2Fb/notes');
  });

  it('finds the value of a parameter whose name the address encodes', () => {
    const values = paramsOfPattern('artikel/:größe', 'artikel/42');

    expect(values).toEqual({ größe: '42' });
    expect(computedTabAddress('artikel/:größe/details', values)).toBe(
      'artikel/42/details',
    );
    expect(computedTabAddress('artikel/:gr%C3%B6%C3%9Fe/details', values)).toBe(
      'artikel/42/details',
    );
  });

  it('leaves a pattern without parameters alone', () => {
    expect(computedTabAddress('dashboard/overview', params)).toBe(
      'dashboard/overview',
    );
  });

  it('yields the empty address when the very first value is unknown', () => {
    expect(computedTabAddress(':tenantId/home', {})).toBe('');
  });
});

describe('where a following tab leads', () => {
  it('is nowhere while only a home route that owns everything below it would answer', () => {
    const routes = [
      { path: '', rest: true },
      { path: 'cedents/:cedentId/treaties', follows: true },
    ] as unknown as ContentRoute[];

    expect(
      followingTabAddress(routes[1], {
        routes,
        params: {},
        activePath: 'settings',
        resolver: null,
      }),
    ).toBeNull();
  });
});

describe('the parameter-name collision rule', () => {
  it('accepts the same name under an identical prefix', () => {
    expect(
      collidingParam(
        'cedents/:cedentId/programs/:programId/pricing',
        'cedents/:cedentId/programs/:programId/treaties',
      ),
    ).toBeUndefined();
  });

  it('reports a name that means two different things', () => {
    expect(
      collidingParam(
        'cedents/:cedentId/notes/:id',
        'cedents/:cedentId/tasks/:id',
      ),
    ).toBe('id');
  });

  it('ignores patterns that share no parameter name', () => {
    expect(collidingParam('doc/:docId', 'ask/:askId')).toBeUndefined();
  });
});
