import {
  claimFor,
  claimMatches,
  conflictingClaims,
  withoutConflicts,
  type WorkspaceClaim,
} from './workspace-claims';

function claims(...pairs: [string, string][]): WorkspaceClaim[] {
  return pairs.map(([workspaceId, pattern]) => ({ workspaceId, pattern }));
}

describe('workspace claims', () => {
  it('matches a family of addresses and everything below one of them', () => {
    expect(claimMatches('quotes/:id', 'quotes/q-0007')).toBe(true);
    expect(claimMatches('quotes/:id', 'quotes/q-0007/positions')).toBe(true);
    expect(claimMatches('quotes/:id', 'quotes')).toBe(false);
    expect(claimMatches('quotes/:id', 'orders/o-1')).toBe(false);
  });

  it('claims the address that names nothing only with a claim on it', () => {
    expect(claimMatches('', '')).toBe(true);
    expect(claimMatches('', 'quotes/q-0007')).toBe(false);
  });

  it('gives the address to the narrowest claim, counting segments before literals', () => {
    const list = claims(
      ['quotes', 'quotes/:id'],
      ['drafts', 'quotes/new'],
      ['deep', 'quotes/:id/positions'],
    );

    expect(claimFor(list, 'quotes/q-0007')?.workspaceId).toBe('quotes');
    expect(claimFor(list, 'quotes/new')?.workspaceId).toBe('drafts');
    expect(claimFor(list, 'quotes/q-0007/positions')?.workspaceId).toBe('deep');
  });

  it('answers nothing where no claim matches', () => {
    expect(claimFor(claims(['quotes', 'quotes/:id']), 'orders/o-1')).toBeNull();
  });

  it('names both workspaces where two claims are equally narrow, and honours neither', () => {
    const list = claims(['quotes', 'quotes/:id'], ['review', 'quotes/:number']);

    expect(conflictingClaims(list)).toHaveLength(1);
    expect(conflictingClaims(list)[0]).toContain('"quotes"');
    expect(conflictingClaims(list)[0]).toContain('"review"');
    expect(claimFor(list, 'quotes/q-0007')).toBeNull();
    expect(withoutConflicts(list)).toEqual([]);
  });

  it('leaves an uncontested claim alone while dropping the contested one', () => {
    const list = claims(
      ['quotes', 'quotes/:id'],
      ['review', 'quotes/:number'],
      ['orders', 'orders/:id'],
    );

    expect(withoutConflicts(list).map((claim) => claim.workspaceId)).toEqual([
      'orders',
    ]);
  });

  it('reports nothing where one workspace claims the same shape twice', () => {
    expect(conflictingClaims(claims(['quotes', 'quotes/:id'], ['quotes', 'quotes/:other']))).toEqual([]);
  });
});
