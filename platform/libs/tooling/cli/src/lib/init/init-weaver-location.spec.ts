import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { run } from '../run';
import { capture, writeFiles } from '../test-fixtures';

vi.mock('@loomweaver/devkit', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@loomweaver/devkit')>()),
  nxWeaverRoot: (id: string) => `packages/plugins/${id}`,
}));

const NX_APPLICATION = JSON.parse(
  readFileSync(
    join(import.meta.dirname, 'nx-application-24.fixture.json'),
    'utf8',
  ),
) as Record<string, string>;

describe('init in an Nx workspace', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'loom-init-'));
    writeFiles(dir, {
      'package.json': JSON.stringify({ name: '@acme/source' }),
      'nx.json': '{}',
      'apps/studio/project.json': JSON.stringify({
        name: 'studio',
        projectType: 'application',
      }),
      ...Object.fromEntries(
        Object.entries(NX_APPLICATION).map(([path, content]) => [
          `apps/studio/${path}`,
          content,
        ]),
      ),
    });
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('looks for the first weaver where the devkit says its project lands', () => {
    writeFiles(dir, { 'packages/plugins/notes/project.json': '{}' });
    const calls: string[][] = [];
    const c = capture();

    const code = run(['init'], c.io, {
      cwd: dir,
      version: '0.9.2',
      exec: (argv: readonly string[]) => void calls.push([...argv]),
    });

    expect(code).toBe(0);
    expect(c.text()).toContain('First weaver: already there.');
    expect(calls.flat()).not.toContain('@loomweaver/devkit:weaver');
  });
});
