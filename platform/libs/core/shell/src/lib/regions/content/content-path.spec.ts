import { DefaultUrlSerializer } from '@angular/router';
import {
  normalizePath,
  paramsOfPattern,
  restBelow,
  suffixOf,
  tabRootOf,
} from './content-path';

describe('the rest below a prefix', () => {
  it('hands over everything under the tab root', () => {
    expect(restBelow('programs', '/programs/US003950/pricing')).toBe(
      'US003950/pricing',
    );
  });

  it('keeps the query string verbatim', () => {
    expect(restBelow('programs', '/programs/205470?treaty=886320')).toBe(
      '205470?treaty=886320',
    );
    expect(restBelow('programs', '/programs?treaty=886320')).toBe(
      '?treaty=886320',
    );
  });

  it('keeps a fragment too', () => {
    expect(restBelow('programs', '/programs/205470#top')).toBe('205470#top');
  });

  it('is empty on the bare prefix', () => {
    expect(restBelow('programs', '/programs')).toBe('');
  });

  it('does not mistake a longer sibling for a deeper address', () => {
    expect(restBelow('programs', '/programs-archive/205470')).toBe('');
  });

  it('hands the whole path to a surface rooted at the empty path', () => {
    expect(restBelow('', '/anything/deep?x=1')).toBe('anything/deep?x=1');
  });

  it('reads the suffix off a url, or nothing', () => {
    expect(suffixOf('programs/205470?a=1#b')).toBe('?a=1#b');
    expect(suffixOf('programs/205470#b')).toBe('#b');
    expect(suffixOf('programs/205470')).toBe('');
  });
});

describe('the one form of a content path', () => {
  it('writes a path the way the address holds it', () => {
    expect(normalizePath('/people/Müller?x=1')).toBe('people/M%C3%BCller');
    expect(normalizePath('people/M%C3%BCller')).toBe('people/M%C3%BCller');
    expect(normalizePath('files/a b')).toBe('files/a%20b');
  });

  it('leaves a path of plain characters as it was given', () => {
    expect(normalizePath('/doc/a')).toBe('doc/a');
    expect(normalizePath('view:files')).toBe('view:files');
    expect(normalizePath('people/:id')).toBe('people/:id');
  });

  it('is what the router writes back for the same path', () => {
    const serializer = new DefaultUrlSerializer();
    const paths = [
      'people/Müller',
      'files/a b+c=d',
      "notes/it's new, a@b:c$d&e",
      'notes/a%28b%29',
      'files/a%2Fb',
      'files/a%3Bb',
      'sale/50%',
      'people/%E0%A4%A',
    ];

    for (const path of paths) {
      const written = normalizePath(path);

      expect(serializer.serialize(serializer.parse(`/${written}`))).toBe(
        `/${written}`,
      );
      expect(normalizePath(written)).toBe(written);
    }
  });

  it('leaves a path that uses the matrix or outlet syntax of the router as it was written', () => {
    expect(normalizePath('/berichte/für;jahr=2026')).toBe(
      'berichte/für;jahr=2026',
    );
    expect(normalizePath('/übersicht(popup:hilfe)')).toBe(
      'übersicht(popup:hilfe)',
    );
  });

  it('takes a sequence that is no encoding literally instead of failing', () => {
    expect(normalizePath('people/%E0%A4%A')).toBe('people/%25E0%25A4%25A');
    expect(normalizePath('sale/50%')).toBe('sale/50%25');
  });
});

describe('the values of an address', () => {
  it('are decoded, as the router hands them to a routed component', () => {
    expect(paramsOfPattern('people/:name', 'people/M%C3%BCller')).toEqual({
      name: 'Müller',
    });
    expect(paramsOfPattern('files/:name', 'files/a%20b%2Fc')).toEqual({
      name: 'a b/c',
    });
  });

  it('are the same whether the path was stored as typed or as the address holds it', () => {
    expect(paramsOfPattern('people/:name', 'people/Müller')).toEqual(
      paramsOfPattern('people/:name', 'people/M%C3%BCller'),
    );
  });

  it('survive a sequence that is no encoding', () => {
    expect(paramsOfPattern('people/:name', 'people/%E0%A4%A')).toEqual({
      name: '%E0%A4%A',
    });
    expect(paramsOfPattern('sale/:rate', 'sale/50%')).toEqual({ rate: '50%' });
  });
});

describe('the tab root of an address', () => {
  const routes = [{ path: '' }, { path: 'doc/:id' }];

  it('is the declared part of an address a route declares', () => {
    expect(tabRootOf(routes, 'doc/7/preview')).toBe('doc/7');
  });

  it('is empty at the home address', () => {
    expect(tabRootOf(routes, '')).toBe('');
  });

  it('is the address itself where only the home route would answer', () => {
    expect(tabRootOf(routes, 'gone/1')).toBe('gone/1');
    expect(tabRootOf(routes, 'view:files')).toBe('view:files');
  });

  it('is the same for a path stored as typed and as the address holds it', () => {
    const people = [{ path: 'people/:name' }];

    expect(tabRootOf(people, 'people/Müller')).toBe(
      tabRootOf(people, 'people/M%C3%BCller'),
    );
  });
});
