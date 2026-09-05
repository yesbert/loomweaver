import { sameIds, shortenedLabelIds } from './rail-label-fit';

function railWith(
  ...labels: readonly { id: string; scroll: number; client: number }[]
): HTMLElement {
  const root = document.createElement('nav');
  for (const label of labels) {
    const span = document.createElement('span');
    span.dataset['railLabel'] = label.id;
    Object.defineProperties(span, {
      scrollHeight: { value: label.scroll },
      clientHeight: { value: label.client },
    });
    root.append(span);
  }
  return root;
}

describe('which rail names are shortened', () => {
  it('names an entry whose text is taller than the box that shows it', () => {
    const rail = railWith(
      { id: 'fits', scroll: 20, client: 20 },
      { id: 'clipped', scroll: 40, client: 20 },
    );

    expect([...shortenedLabelIds(rail)]).toEqual(['clipped']);
  });

  it('tolerates the sub-pixel difference of a name that does fit', () => {
    const rail = railWith({ id: 'fits', scroll: 21, client: 20 });

    expect([...shortenedLabelIds(rail)]).toEqual([]);
  });

  it('names nothing in a rail without labels', () => {
    expect([...shortenedLabelIds(document.createElement('nav'))]).toEqual([]);
  });

  it('recognises when the answer has not changed', () => {
    expect(sameIds(new Set(['a', 'b']), new Set(['b', 'a']))).toBe(true);
    expect(sameIds(new Set(['a']), new Set(['a', 'b']))).toBe(false);
    expect(sameIds(new Set(['a']), new Set(['b']))).toBe(false);
  });
});
