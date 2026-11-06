import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ts from 'typescript';
import { declarationAsScript } from '../declaration-as-script.mjs';

describe('frame-kit build', () => {
  const out = mkdtempSync(join(tmpdir(), 'lw-frame-kit-'));

  beforeAll(() => {
    execFileSync(process.execPath, [join(__dirname, '..', 'build.mjs')], {
      env: { ...process.env, LW_FRAME_KIT_OUT: out },
      stdio: 'pipe',
    });
  }, 120_000);

  it('bundles the whole element family with the LwFrame api', () => {
    const js = readFileSync(join(out, 'lw-elements.global.js'), 'utf8');
    for (const tag of [
      'lw-tooltip',
      'lw-select',
      'lw-option',
      'lw-nav-tree',
      'lw-nav-group',
      'lw-nav-item',
      'lw-menu',
      'lw-menu-item',
      'lw-button',
      'lw-markdown',
      'lw-icon',
      'lw-progress-ring',
      'lw-spinner',
      'lw-toolbar',
    ]) {
      expect(js).toContain(tag);
    }
    expect(js).toContain('LwFrame');
    expect(js).toContain('connectToolbars');
  });

  it('seeds the built-in icon set into the bundle', () => {
    const js = readFileSync(join(out, 'lw-elements.global.js'), 'utf8');
    expect(js).toContain('<svg');
  });

  it('compiles the .lw-* class contracts to plain CSS on tokens', () => {
    const css = readFileSync(join(out, 'lw-frame.css'), 'utf8');
    expect(css).toContain('.lw-btn');
    expect(css).toContain('.lw-tooltip-bubble');
    expect(css).toContain('lw-menu-item');
    expect(css).toContain('var(--lw-');
    expect(css).toContain('.prose');
    expect(css).not.toContain('@apply');
  });

  it('carries the token fallback ladder for the pre-push blink', () => {
    const css = readFileSync(join(out, 'lw-frame.css'), 'utf8');
    expect(css).toContain('--lw-brand');
    expect(css).toContain(':root.dark');
  });

  it('vendors Penpal as a global bundle', () => {
    const js = readFileSync(join(out, 'penpal.global.js'), 'utf8');
    expect(js).toContain('Penpal');
    expect(js).toContain('WindowMessenger');
  });

  it('vendors the surface renderer beside the bundle, not inside it', () => {
    const renderer = readFileSync(join(out, 'snapdom.global.js'), 'utf8');
    expect(renderer).toContain('LwSnapdom');

    const js = readFileSync(join(out, 'lw-elements.global.js'), 'utf8');
    expect(js).toContain('snapdom.global.js');
    expect(js.length).toBeLessThan(renderer.length * 2);
  });

  it('publishes what a surface answers with when asked to draw itself', () => {
    const declaration = readFileSync(join(out, 'lw-frame.d.ts'), 'utf8');
    expect(declaration).toContain('LwSurfaceCapture');
    expect(declaration).toContain('capture(request?: LwSurfaceCaptureRequest)');
  });

  it("offers the platform's own surface methods beside the plugin's", () => {
    const declaration = readFileSync(join(out, 'lw-frame.d.ts'), 'utf8');
    expect(declaration).toContain('surfaceMethods<T extends LwSurfaceMethods>');
    expect(declaration).toContain('LwPlatformSurfaceMethods');

    const js = readFileSync(join(out, 'lw-elements.global.js'), 'utf8');
    expect(js).toContain('surfaceMethods');
  });

  it('answers a state push among the platform’s own surface methods', () => {
    const declaration = readFileSync(join(out, 'lw-frame.d.ts'), 'utf8');
    expect(declaration).toContain(
      'stateChanged(key: string, value: unknown, loaded: boolean): void',
    );

    const js = readFileSync(join(out, 'lw-elements.global.js'), 'utf8');
    expect(js).toContain('stateChanged');
  });

  const TYPE_CHECK_TIME = 60_000;

  function problemsOf(surface: string): string[] {
    const file = join(out, 'surface.ts');
    writeFileSync(file, surface);
    const program = ts.createProgram([file, join(out, 'lw-frame.d.ts')], {
      noEmit: true,
      strict: true,
      target: ts.ScriptTarget.ES2022,
      lib: ['lib.es2022.d.ts', 'lib.dom.d.ts'],
      types: [],
    });
    return ts
      .getPreEmitDiagnostics(program)
      .map((problem) => ts.flattenDiagnosticMessageText(problem.messageText, ' '));
  }

  it('describes every element it bundles by its tag', () => {
    const declaration = readFileSync(join(out, 'lw-frame.d.ts'), 'utf8');
    const js = readFileSync(join(out, 'lw-elements.global.js'), 'utf8');
    const described = [...declaration.matchAll(/^\s+'(lw-[a-z-]+)': /gm)].map(
      ([, tag]) => tag,
    );

    expect(described).toHaveLength(14);
    for (const tag of described) {
      expect(js, tag).toContain(`"${tag}"`);
    }
    expect(declaration).toContain(
      'interface HTMLElementTagNameMap extends LwElementTagNameMap',
    );
  });

  it('lets a typed surface set what its elements take, a toolbar’s description among it', () => {
    expect(
      problemsOf(
        [
          `const placed = document.createElement('lw-toolbar');`,
          `placed.menu = 'acme.view/toolbar';`,
          `placed.context = { record: 'r1', pinned: true };`,
          `const found = document.querySelector('lw-select');`,
          `const chosen: string | null = found?.value ?? null;`,
          `document.querySelector('lw-button')?.toggleAttribute('disabled', chosen === null);`,
          `document.createElement('lw-progress-ring').setAttribute('value', '40');`,
          `LwFrame.surfaceMethods({}).stateChanged('draft', chosen, true);`,
        ].join('\n'),
      ),
    ).toEqual([]);
  }, TYPE_CHECK_TIME);

  it('tells a typed surface about a description the workbench would refuse, and a property no element has', () => {
    const problems = problemsOf(
      [
        `const placed = document.createElement('lw-toolbar');`,
        `placed.context = { record: null };`,
        `placed.contxt = {};`,
      ].join('\n'),
    );

    expect(problems).toHaveLength(2);
    expect(problems[0]).toContain("'null' is not assignable");
    expect(problems[1]).toContain("'contxt' does not exist");
  }, TYPE_CHECK_TIME);

  it('sets every global value its declaration names', () => {
    const declaration = readFileSync(join(out, 'lw-frame.d.ts'), 'utf8');
    const js = readFileSync(join(out, 'lw-elements.global.js'), 'utf8');
    const declared = [...declaration.matchAll(/^declare const (\w+)/gm)].map(
      ([, name]) => name,
    );

    expect(declared).toContain('LwFrame');
    for (const name of declared) {
      expect(js, name).toMatch(
        new RegExp(String.raw`(\.${name}|\[["']${name}["']\])\s*=[^=]`),
      );
    }
  });

  it('is rebuilt when a package it reads from node_modules changes', () => {
    const script = readFileSync(join(__dirname, '..', 'build.mjs'), 'utf8');
    const project = JSON.parse(
      readFileSync(join(__dirname, '..', 'project.json'), 'utf8'),
    ) as {
      targets: {
        bundle: { inputs: (string | { externalDependencies: string[] })[] };
      };
    };
    const watched = project.targets.bundle.inputs.flatMap((input) =>
      typeof input === 'string' ? [] : input.externalDependencies,
    );
    const imported = [...script.matchAll(/^import .* from '([^.'][^']*)';$/gm)]
      .map(([, name]) => name)
      .filter((name) => !name.startsWith('node:'));
    const vendored = [...script.matchAll(/vendorGlobal\('([^']+)'/g)].map(
      ([, name]) => name,
    );

    expect(imported).toContain('typescript');
    expect(vendored).toContain('@zumer/snapdom');
    expect(watched).toEqual(expect.arrayContaining([...imported, ...vendored]));
  });

  it('turns a declaration that only re-exports types into a script with no stray statement', () => {
    const script = declarationAsScript(
      'export interface LwFrameApi {\n  ready(): void;\n}\nexport {};\n',
    );

    expect(script).toBe('interface LwFrameApi {\n  ready(): void;\n}');
  });
});
