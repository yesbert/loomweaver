import { distributionScaffold } from './scaffold';

describe('distribution scaffold values', () => {
  function stylesheetFor(directory: string): string {
    return distributionScaffold.build({ name: 'acme-studio', directory })[
      'src/styles.css'
    ];
  }

  it('counts the hops to node_modules from a project at the workspace root', () => {
    expect(stylesheetFor('')).toContain(
      "@source '../node_modules/@loomweaver/shell'",
    );
  });

  it('counts them again from a nested project', () => {
    expect(stylesheetFor('apps/acme-studio')).toContain(
      "@source '../../../node_modules/@loomweaver/shell'",
    );
  });
});
