import { parseTemplate } from '@angular/compiler';
import { runInNewContext, Script } from 'node:vm';
import ts from 'typescript';
import { angularDistribution } from '../../recipes/angular-distribution/recipe';
import { angularWeaver } from '../../recipes/angular-weaver/recipe';
import { framePlugin } from '../../recipes/frame-plugin/recipe';
import { markupText, stringLiteral } from './escape';
import { generate } from './generate';

const AWKWARD = 'Bob\'s {Notes} @if <b>"x"</b> & \\ back\nslash';

describe('escaping a consumer-supplied name', () => {
  it('yields a string literal that evaluates back to the name', () => {
    expect(runInNewContext(stringLiteral(AWKWARD))).toBe(AWKWARD);
  });

  it('yields markup an Angular template parses, showing the name as written', () => {
    const parsed = parseTemplate(`<h2>${markupText(AWKWARD)}</h2>`, 'name.html', {});

    expect(parsed.errors ?? []).toEqual([]);
    const heading = parsed.nodes[0] as unknown as { children: { value: string }[] };
    expect(heading.children.map((child) => child.value).join('')).toBe(AWKWARD);
  });
});

describe('a consumer-supplied name in generated output', () => {
  const syntaxErrors = (source: string): string[] =>
    (ts.transpileModule(source, { reportDiagnostics: true }).diagnostics ?? []).map((diagnostic) =>
      ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
    );

  it('leaves a weaver whose sources parse and whose templates compile', () => {
    const files = generate(angularWeaver, { id: 'notes', name: AWKWARD, about: true, agent: true });

    for (const [path, source] of Object.entries(files)) {
      if (path.endsWith('.ts')) {
        expect({ path, errors: syntaxErrors(source) }).toEqual({ path, errors: [] });
      }
      if (path.endsWith('.html')) {
        expect({ path, errors: parseTemplate(source, path, {}).errors ?? [] }).toEqual({ path, errors: [] });
      }
    }
    expect(files['src/lib/plugin/notes.plugin.ts']).toContain(`name: ${stringLiteral(AWKWARD)}`);
  });

  it('leaves a distribution and a frame plugin that parse, showing the name as written', () => {
    const distribution = generate(angularDistribution, { name: 'acme-studio', title: AWKWARD });
    const frame = generate(framePlugin, { id: 'notes', name: AWKWARD });

    expect(syntaxErrors(distribution['src/app/app.config.ts'])).toEqual([]);
    expect(distribution['src/index.html']).toContain(`<title>${markupText(AWKWARD)}</title>`);
    expect(() => new Script(frame['plugin.js'])).not.toThrow();
    expect(frame['view.html']).toContain(`<h1>${markupText(AWKWARD)}</h1>`);
  });
});
