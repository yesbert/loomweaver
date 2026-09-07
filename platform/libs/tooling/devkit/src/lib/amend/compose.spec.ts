import { composeLines, composePlugin } from './compose';
import { ComposePluginAmendment } from './types';

const NOTES: ComposePluginAmendment = {
  kind: 'compose-plugin',
  id: 'notes',
  symbol: 'notesPlugin',
  capabilities: ['contributions', 'ui', 'navigation'],
  sourceRoot: 'src/notes/src',
};

const GENERATED = `import { ApplicationConfig } from '@angular/core';
import {
  provideLayout,
  provideShell,
  provideShellRouter,
  type ShellLayout,
} from '@loomweaver/shell';
import { provideProductIdentity } from '@loomweaver/plugin-sdk';

export const layout: ShellLayout = { regions: [] };

export const appConfig: ApplicationConfig = {
  providers: [
    provideShellRouter(),
    provideShell(),
    provideLayout(layout),
  ],
};
`;

const SESSION: ComposePluginAmendment = {
  kind: 'compose-plugin',
  id: 'session',
  symbol: 'devSessionPlugin',
  capabilities: ['contributions'],
  sourceRoot: 'src/auth',
  providers: [
    {
      line: 'provideAuthSource(() => devAuthSource()),',
      shell: ['provideAuthSource'],
      own: ['devAuthSource'],
      unless: 'provideAuthSource(',
    },
    {
      line: 'provideIcons({ account: heroUserCircle }),',
      shell: ['provideIcons'],
      from: [{ path: '@ng-icons/heroicons/outline', symbols: ['heroUserCircle'] }],
    },
  ],
};

describe('composePlugin', () => {
  it('registers the plugin in a composition root of the generated shape', () => {
    const { source, composed } = composePlugin(GENERATED, NOTES, '../notes/src');
    expect(composed).toBe(true);
    expect(source).toContain("import { notesPlugin } from '../notes/src';");
    expect(source).toContain("provideTranslationNamespaces('notes'),");
    expect(source).toContain(
      "provideCapabilityGrants({ notes: ['contributions', 'ui', 'navigation'] }),",
    );
    expect(source).toContain('...providePlugins(notesPlugin),');
  });

  it('keeps the shell symbols the file already imported', () => {
    const { source } = composePlugin(GENERATED, NOTES, '../notes/src');
    for (const symbol of ['provideLayout', 'provideShell', 'provideShellRouter']) {
      expect(source).toContain(symbol);
    }
  });

  it('composes into a root the consumer edited but did not reshape', () => {
    const edited = GENERATED.replace(
      'provideLayout(layout),',
      'provideLayout(layout),\n    provideSomethingOfMyOwn(),',
    );
    const { source, composed } = composePlugin(edited, NOTES, '../notes/src');
    expect(composed).toBe(true);
    expect(source).toContain('provideSomethingOfMyOwn(),');
    expect(source).toContain('...providePlugins(notesPlugin),');
  });

  it('declines a root whose shape it cannot recognise', () => {
    const reshaped = "export const config = bootstrap({ providers: [] });\n";
    const { source, composed } = composePlugin(reshaped, NOTES, '../notes/src');
    expect(composed).toBe(false);
    expect(source).toBe(reshaped);
  });

  it('composes into the array of appConfig, not one that stands before it', () => {
    const earlier = `export const other = {\n  providers: [\n    somethingElse(),\n  ],\n};\n\n${GENERATED}`;
    const { source } = composePlugin(earlier, NOTES, '../notes/src');
    expect(source).toContain('somethingElse(),\n  ],');
    expect(source).toContain('provideLayout(layout),\n    provideTranslationNamespaces');
  });

  it('writes the entries against the indentation of the closing line', () => {
    const deeper = GENERATED.replace(/^ {2}providers/m, '    providers')
      .replaceAll(/^ {4}provide/gm, '      provide')
      .replace(/^ {2}\],/m, '    ],');
    const { source, composed } = composePlugin(deeper, NOTES, '../notes/src');
    expect(composed).toBe(true);
    expect(source).toContain('      ...providePlugins(notesPlugin),');
  });

  it('declines an array that carries no closing line of its own', () => {
    const inline = GENERATED.replace(
      /providers: \[[\s\S]*?\],/,
      'providers: [provideShell()],',
    );
    const { source, composed } = composePlugin(inline, NOTES, '../notes/src');
    expect(composed).toBe(false);
    expect(source).toBe(inline);
  });

  it('joins the translation namespaces already declared rather than replacing them', () => {
    const first = composePlugin(GENERATED, NOTES, '../notes/src').source;
    const second = composePlugin(first, SESSION, '../auth').source;
    expect(second).toContain("provideTranslationNamespaces('notes', 'session'),");
    expect(second).not.toContain("provideTranslationNamespaces('session'),");
    expect(second.match(/provideTranslationNamespaces\(/g)).toHaveLength(1);
  });

  it('adds nothing a second time', () => {
    const once = composePlugin(GENERATED, NOTES, '../notes/src');
    const twice = composePlugin(once.source, NOTES, '../notes/src');
    expect(twice.source).toBe(once.source);
    expect(twice.composed).toBe(true);
  });
});


describe('composePlugin with provider lines', () => {
  it('ensures the lines, their shell symbols and their imports beside the plugin', () => {
    const { source, composed, kept } = composePlugin(GENERATED, SESSION, '../auth');
    expect(composed).toBe(true);
    expect(kept).toEqual([]);
    expect(source).toContain("import { devAuthSource, devSessionPlugin } from '../auth';");
    expect(source).toContain("import { heroUserCircle } from '@ng-icons/heroicons/outline';");
    expect(source).toMatch(/import \{[^}]*provideAuthSource[^}]*provideIcons[^}]*\} from '@loomweaver\/shell'/);
    expect(source).toContain('    provideAuthSource(() => devAuthSource()),\n    provideIcons({ account: heroUserCircle }),\n    provideTranslationNamespaces');
  });

  it('keeps a provideAuthSource the consumer already has, and says so', () => {
    const withOwn = GENERATED.replace(
      'provideLayout(layout),',
      'provideLayout(layout),\n    provideAuthSource(() => mySession()),',
    );
    const { source, composed, kept } = composePlugin(withOwn, SESSION, '../auth');
    expect(composed).toBe(true);
    expect(kept).toEqual(['provideAuthSource(() => devAuthSource()),']);
    expect(source).toContain('provideAuthSource(() => mySession()),');
    expect(source).not.toContain('provideAuthSource(() => devAuthSource())');
    expect(source).toContain("import { devSessionPlugin } from '../auth';");
    expect(source).toContain('provideIcons({ account: heroUserCircle }),');
  });

  it('names the provider lines and their imports where it cannot compose', () => {
    const lines = composeLines(SESSION, '../auth').join('\n');
    expect(lines).toContain("import { devSessionPlugin, devAuthSource } from '../auth';");
    expect(lines).toContain('provideAuthSource');
    expect(lines).toContain("import { heroUserCircle } from '@ng-icons/heroicons/outline';");
  });
});

describe('composeLines', () => {
  it('names every line a consumer would have to add', () => {
    const lines = composeLines(NOTES, '../notes/src').join('\n');
    expect(lines).toContain('notesPlugin');
    expect(lines).toContain("provideTranslationNamespaces('notes')");
    expect(lines).toContain('provideCapabilityGrants');
  });
});
