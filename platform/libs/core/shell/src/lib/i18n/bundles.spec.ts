import de from './de.json';
import en from './en.json';

type Bundle = Record<string, unknown>;

const BUNDLES: readonly (readonly [string, Bundle])[] = [
  ['en', en as Bundle],
  ['de', de as Bundle],
];

function keysOf(bundle: unknown, prefix = ''): readonly string[] {
  if (bundle === null || typeof bundle !== 'object') {
    return [prefix];
  }
  return Object.entries(bundle as Bundle).flatMap(([key, value]) =>
    keysOf(value, prefix ? `${prefix}.${key}` : key),
  );
}

function read(bundle: Bundle, path: string): string {
  let at: unknown = bundle;
  for (const part of path.split('.')) {
    at = (at as Bundle | undefined)?.[part];
  }
  return at as string;
}

describe('the shipped translation bundles', () => {
  describe.each(BUNDLES)('%s', (language, bundle) => {
    it('names the two resets for the thing each of them resets', () => {
      const app = read(bundle, 'appReset.title');
      const workspace = read(bundle, 'workspace.reset');

      expect(app).not.toBe(workspace);
      expect(app.length).toBeGreaterThan(0);
      expect(workspace.length).toBeGreaterThan(0);
    });

    it('gives the app reset one name, on its control and in the search alike', () => {
      expect(read(bundle, 'appReset.action')).toBe(read(bundle, 'appReset.title'));
    });

    it(`says "Workspace" wherever it says it at all, in ${language}`, () => {
      const translated = keysOf(bundle)
        .map((key) => read(bundle, key))
        .filter((value) => typeof value === 'string' && /Arbeitsbereich/.test(value));

      expect(translated).toEqual([]);
    });
  });

  it('carries the same keys in every language', () => {
    const [[, first], [, second]] = BUNDLES;

    const order = (a: string, b: string) => a.localeCompare(b);

    expect(keysOf(second).toSorted(order)).toEqual(keysOf(first).toSorted(order));
  });
});
