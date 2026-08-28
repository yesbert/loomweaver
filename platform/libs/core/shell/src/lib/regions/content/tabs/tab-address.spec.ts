import { collidingParam, computedTabAddress } from './tab-address';

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

  it('leaves a pattern without parameters alone', () => {
    expect(computedTabAddress('dashboard/overview', params)).toBe(
      'dashboard/overview',
    );
  });

  it('yields the empty address when the very first value is unknown', () => {
    expect(computedTabAddress(':tenantId/home', {})).toBe('');
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
