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

  it('adds nothing a second time', () => {
    const once = composePlugin(GENERATED, NOTES, '../notes/src');
    const twice = composePlugin(once.source, NOTES, '../notes/src');
    expect(twice.source).toBe(once.source);
    expect(twice.composed).toBe(true);
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
