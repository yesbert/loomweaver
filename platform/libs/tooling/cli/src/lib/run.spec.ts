import {
  existsSync,
  lstatSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { run } from './run';
import { planWrite, WriteError } from './write';

function capture() {
  const out: string[] = [];
  const error: string[] = [];
  return {
    io: {
      out: (l: string) => void out.push(l),
      err: (l: string) => void error.push(l),
    },
    out,
    err: error,
    text: () => out.join('\n'),
    errText: () => error.join('\n'),
  };
}

describe('run', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'loom-cli-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('writes a weaver into the target directory', () => {
    const c = capture();
    expect(run(['weaver', '--id', 'notes', '--out', dir], c.io)).toBe(0);
    expect(existsSync(join(dir, 'src/index.ts'))).toBe(true);
    expect(
      JSON.parse(readFileSync(join(dir, 'src/lib/i18n/en.json'), 'utf8')),
    ).toEqual({ title: 'Notes' });
    expect(
      JSON.parse(readFileSync(join(dir, 'src/lib/i18n/de.json'), 'utf8')),
    ).toEqual({ title: 'Notes' });
  });

  it('derives the capability from a requested feature', () => {
    const c = capture();
    run(['weaver', '--id', 'notes', '--command', '--out', dir], c.io);
    const plugin = readFileSync(
      join(dir, 'src/lib/plugin/notes.plugin.ts'),
      'utf8',
    );
    expect(plugin).toContain('registerCommand');
    expect(plugin).toContain("'ui'");
  });

  it('writes nothing on --dry-run but reports what it would write', () => {
    const c = capture();
    expect(
      run(['weaver', '--id', 'notes', '--out', dir, '--dry-run'], c.io),
    ).toBe(0);
    expect(c.text()).toContain('Would write');
    expect(c.text()).toContain('src/index.ts');
    expect(existsSync(join(dir, 'src/index.ts'))).toBe(false);
  });

  it('refuses to clobber an existing file and names it', () => {
    writeFileSync(join(dir, 'README.md'), 'mine', 'utf8');
    const c = capture();
    expect(run(['weaver', '--id', 'notes', '--out', dir], c.io)).toBe(1);
    expect(c.errText()).toContain('README.md');
    expect(readFileSync(join(dir, 'README.md'), 'utf8')).toBe('mine');
  });

  it('overwrites once --force is given', () => {
    writeFileSync(join(dir, 'README.md'), 'mine', 'utf8');
    const c = capture();
    expect(run(['weaver', '--id', 'notes', '--out', dir, '--force'], c.io)).toBe(
      0,
    );
    expect(readFileSync(join(dir, 'README.md'), 'utf8')).not.toBe('mine');
  });

  it('replaces a symlink under --force instead of writing through it', () => {
    const outside = mkdtempSync(join(tmpdir(), 'loom-victim-'));
    try {
      writeFileSync(join(outside, 'victim.txt'), 'untouched', 'utf8');
      symlinkSync(join(outside, 'victim.txt'), join(dir, 'README.md'));
      const c = capture();
      expect(
        run(['weaver', '--id', 'notes', '--out', dir, '--force'], c.io),
      ).toBe(0);
      expect(readFileSync(join(outside, 'victim.txt'), 'utf8')).toBe(
        'untouched',
      );
      expect(lstatSync(join(dir, 'README.md')).isSymbolicLink()).toBe(false);
      expect(readFileSync(join(dir, 'README.md'), 'utf8')).toContain('weaver');
    } finally {
      rmSync(outside, { recursive: true, force: true });
    }
  });

  it('counts a dangling symlink as an existing entry', () => {
    symlinkSync(join(dir, 'never-created.txt'), join(dir, 'README.md'));
    const c = capture();
    expect(run(['weaver', '--id', 'notes', '--out', dir], c.io)).toBe(1);
    expect(c.errText()).toContain('README.md');
  });

  it('refuses a symlinked directory that leaves the target root', () => {
    const outside = mkdtempSync(join(tmpdir(), 'loom-victim-'));
    try {
      symlinkSync(outside, join(dir, 'src'));
      const c = capture();
      expect(
        run(['weaver', '--id', 'notes', '--out', dir, '--force'], c.io),
      ).toBe(1);
      expect(c.errText()).toContain('leaves the target directory');
      expect(readdirSync(outside)).toEqual([]);
    } finally {
      rmSync(outside, { recursive: true, force: true });
    }
  });

  it('reports a missing required option instead of throwing', () => {
    const c = capture();
    expect(run(['weaver', '--out', dir], c.io)).toBe(1);
    expect(c.errText()).toContain('--id');
  });

  it('fails fast on a mistyped flag instead of silently ignoring it', () => {
    const c = capture();
    expect(
      run(['weaver', '--id', 'notes', '--acess', 'role:admin', '--out', dir], c.io),
    ).toBe(1);
    expect(c.errText()).toContain('--acess');
    expect(existsSync(join(dir, 'src/index.ts'))).toBe(false);
  });

  it('accepts both spellings of a declared flag', () => {
    const c = capture();
    expect(
      run(['weaver', '--id', 'notes', '--barItem', '--out', dir, '--dry-run'], c.io),
    ).toBe(0);
    const kebab = capture();
    expect(
      run(
        ['weaver', '--id', 'notes', '--bar-item', '--out', dir, '--dry-run'],
        kebab.io,
      ),
    ).toBe(0);
  });

  it('shows on --dry-run which files the real run would refuse', () => {
    writeFileSync(join(dir, 'README.md'), 'mine', 'utf8');
    const c = capture();
    expect(
      run(['weaver', '--id', 'notes', '--out', dir, '--dry-run'], c.io),
    ).toBe(0);
    expect(c.text()).toContain('--force');
    expect(c.text()).toContain('README.md');
    expect(readFileSync(join(dir, 'README.md'), 'utf8')).toBe('mine');
  });

  it('names an unknown command and points at list', () => {
    const c = capture();
    expect(run(['nonsense'], c.io)).toBe(1);
    expect(c.errText()).toContain('loomweaver list');
  });

  it('prints help and fails when called with no command', () => {
    const c = capture();
    expect(run([], c.io)).toBe(1);
    expect(c.text()).toContain('Usage: loomweaver');
  });

  it('prints help successfully on --help', () => {
    const c = capture();
    expect(run(['--help'], c.io)).toBe(0);
  });

  it('lists every scaffold with its usage', () => {
    const c = capture();
    expect(run(['list'], c.io)).toBe(0);
    for (const name of [
      'weaver',
      'frame-plugin',
      'distribution',
      'auth-source',
      'settings-store',
      'theme',
      'layout',
    ]) {
      expect(c.text()).toContain(name);
    }
  });

  it('reaches node_modules from the directory --out actually points at', () => {
    const c = capture();
    const cwd = process.cwd();
    try {
      process.chdir(dir);
      expect(run(['distribution', '--name', 'acme-studio', '--out', '.'], c.io)).toBe(0);
      expect(readFileSync(join(dir, 'src/styles.css'), 'utf8')).toContain(
        "@source '../node_modules/@loomweaver/shell'",
      );

      expect(
        run(['distribution', '--name', 'acme-studio', '--out', 'apps/acme'], c.io),
      ).toBe(0);
      expect(readFileSync(join(dir, 'apps/acme/src/styles.css'), 'utf8')).toContain(
        "@source '../../../node_modules/@loomweaver/shell'",
      );
    } finally {
      process.chdir(cwd);
    }
  });

  it('validates a manifest and fails on an error finding', () => {
    const c = capture();
    expect(run(['validate-manifest', '--id', 'Not Kebab'], c.io)).toBe(1);
    expect(c.errText()).toContain('error');
  });

  it('reports a missing key as a warning, which alone does not fail the run', () => {
    writeFileSync(join(dir, 'en.json'), JSON.stringify({ a: '1', b: '2' }));
    writeFileSync(join(dir, 'de.json'), JSON.stringify({ a: '1' }));
    const c = capture();
    expect(run(['validate-i18n', '--dir', dir], c.io)).toBe(0);
    expect(c.errText()).toContain('warning');
    expect(c.errText()).toContain('"b"');
  });

  it('fails on that same warning under --strict, so CI can gate on parity', () => {
    writeFileSync(join(dir, 'en.json'), JSON.stringify({ a: '1', b: '2' }));
    writeFileSync(join(dir, 'de.json'), JSON.stringify({ a: '1' }));
    const c = capture();
    expect(run(['validate-i18n', '--dir', dir, '--strict'], c.io)).toBe(1);
  });

  it('passes when the bundles agree', () => {
    writeFileSync(join(dir, 'en.json'), JSON.stringify({ a: '1' }));
    writeFileSync(join(dir, 'de.json'), JSON.stringify({ a: '2' }));
    const c = capture();
    expect(run(['validate-i18n', '--dir', dir, '--strict'], c.io)).toBe(0);
    expect(c.text()).toContain('No findings.');
  });

  it('reports malformed JSON by file name rather than crashing', () => {
    writeFileSync(join(dir, 'en.json'), '{ nope');
    const c = capture();
    expect(run(['validate-i18n', '--dir', dir], c.io)).toBe(1);
    expect(c.errText()).toContain('en.json');
  });

  describe('validate-commands', () => {
    const plugin = `
export const plugin = {
  activate(ctx) {
    ctx.registerCommand({
      id: 'notes.open',
      description: 'notes.open.description',
      callable: true,
      run: () => undefined,
    });
    ctx.registerCommand({ id: 'notes.hello', callable: true, run: () => undefined });
    ctx.registerCommand({ id: 'notes.reset', run: () => undefined });
  },
};
`;

    it('reports every command and passes without --strict', () => {
      writeFileSync(join(dir, 'notes.plugin.ts'), plugin);
      const c = capture();
      expect(run(['validate-commands', '--dir', dir], c.io)).toBe(0);
      expect(c.text()).toContain('notes.open: offered to an agent');
      expect(c.text()).toContain('notes.reset: not offered to an agent');
      expect(c.errText()).toContain('notes.hello: offered to an agent without a description');
      expect(c.text()).toContain('judged the registrations alone');
    });

    it('fails under --strict only because of the callable command without a description', () => {
      writeFileSync(join(dir, 'notes.plugin.ts'), plugin);
      const c = capture();
      expect(run(['validate-commands', '--dir', dir, '--strict'], c.io)).toBe(1);
      writeFileSync(join(dir, 'notes.plugin.ts'), plugin.replace("id: 'notes.hello', callable: true,", "id: 'notes.hello', description: 'd', callable: true,"));
      const strict = capture();
      expect(run(['validate-commands', '--dir', dir, '--strict'], strict.io)).toBe(0);
    });

    it('names a directory without sources rather than reporting nothing', () => {
      const c = capture();
      expect(run(['validate-commands', '--dir', dir], c.io)).toBe(1);
      expect(c.errText()).toContain('No TypeScript sources');
    });
  });

  describe('validate-catalog', () => {
    const entry = {
      id: 'report-tool',
      name: 'Report tool',
      entryUrl: '/report-tool/plugin.html',
      capabilities: ['contributions', 'ui'],
      version: '1.0.0',
    };

    function writeCatalog(catalog: unknown): string {
      const file = join(dir, 'catalog.json');
      writeFileSync(file, JSON.stringify(catalog));
      return file;
    }

    it('passes a well-formed catalog', () => {
      const c = capture();
      expect(run(['validate-catalog', '--file', writeCatalog([entry])], c.io)).toBe(0);
      expect(c.text()).toContain('No findings.');
    });

    it('fails on an unknown capability, which the host would drop silently', () => {
      const file = writeCatalog([{ ...entry, capabilities: ['uii'] }]);
      const c = capture();
      expect(run(['validate-catalog', '--file', file], c.io)).toBe(1);
      expect(c.errText()).toContain('CapabilityError');
    });

    it('reports a misspelled field as a warning that alone does not fail', () => {
      const file = writeCatalog([{ ...entry, discription: 'oops' }]);
      const c = capture();
      expect(run(['validate-catalog', '--file', file], c.io)).toBe(0);
      expect(c.errText()).toContain('discription');
    });

    it('fails on that same warning under --strict, so CI can gate on it', () => {
      const file = writeCatalog([{ ...entry, discription: 'oops' }]);
      const c = capture();
      expect(run(['validate-catalog', '--file', file, '--strict'], c.io)).toBe(1);
    });

    it('names the file rather than crashing on malformed JSON', () => {
      const file = join(dir, 'catalog.json');
      writeFileSync(file, '[ nope');
      const c = capture();
      expect(run(['validate-catalog', '--file', file], c.io)).toBe(1);
      expect(c.errText()).toContain('catalog.json');
    });

    it('reports an unreadable file rather than crashing', () => {
      const c = capture();
      expect(
        run(['validate-catalog', '--file', join(dir, 'missing.json')], c.io),
      ).toBe(1);
      expect(c.errText()).toContain('missing.json');
    });
  });
});

describe('planWrite', () => {
  it('refuses a path that would escape the target directory', () => {
    expect(() => planWrite({ '../escape.ts': 'x' }, '/tmp/loom-root')).toThrow(
      WriteError,
    );
  });
});
