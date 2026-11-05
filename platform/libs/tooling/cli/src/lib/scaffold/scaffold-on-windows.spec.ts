import { parseArgs } from '../args';
import { findScaffold, scaffoldValues } from './scaffold';

vi.mock('node:path', async (importOriginal) => {
  const { win32 } = await importOriginal<typeof import('node:path')>();
  return { ...win32, default: win32 };
});

describe('scaffoldValues where paths are written with backslashes', () => {
  it('hands the recipe a directory taken from --out with forward slashes', () => {
    const args = parseArgs(['weaver', '--id', 'notes', '--out', 'libs/notes/weaver']);

    const values = scaffoldValues(findScaffold('weaver'), args);

    expect(values['directory']).toBe('libs/notes/weaver');
  });
});
