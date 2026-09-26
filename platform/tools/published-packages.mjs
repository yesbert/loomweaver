// The seven packages the release publishes, and where each one sits, relative to platform/.
//
// source       the package's own folder, whose package.json the release stamps
// publishRoot  the folder `npm publish` runs in: ng-packagr output under dist/, or the source
//              folder for the packages that bundle their own dist inside it
// declarations the folder holding the packed .d.ts files a consumer's compiler reads
// types        the declaration file the manifest names
// role         'library' for what a product builds with, 'tooling' for what a developer runs
//
// The checkers, the quick-start check and the release script read this table, so a package added
// here reaches all of them at once.

export const PUBLISHED_PACKAGES = [
  {
    name: '@loomweaver/plugin-sdk',
    role: 'library',
    source: 'libs/core/plugin-sdk',
    publishRoot: 'dist/libs/core/plugin-sdk',
    declarations: 'dist/libs/core/plugin-sdk',
    types: 'dist/libs/core/plugin-sdk/src/index.d.ts',
  },
  {
    name: '@loomweaver/shell',
    role: 'library',
    source: 'libs/core/shell',
    publishRoot: 'dist/libs/core/shell',
    declarations: 'dist/libs/core/shell/types',
    types: 'dist/libs/core/shell/types/loomweaver-shell.d.ts',
  },
  {
    name: '@loomweaver/ag-ui',
    role: 'library',
    source: 'libs/integrations/ag-ui',
    publishRoot: 'dist/libs/integrations/ag-ui',
    declarations: 'dist/libs/integrations/ag-ui',
    types: 'dist/libs/integrations/ag-ui/src/index.d.ts',
  },
  {
    name: '@loomweaver/frame-kit',
    role: 'library',
    source: 'libs/core/frame-kit',
    publishRoot: 'libs/core/frame-kit',
    declarations: 'libs/core/frame-kit/dist',
    types: 'libs/core/frame-kit/dist/lw-frame.d.ts',
  },
  {
    name: '@loomweaver/devkit',
    role: 'tooling',
    source: 'libs/tooling/devkit',
    publishRoot: 'dist/libs/tooling/devkit',
    declarations: 'dist/libs/tooling/devkit',
    types: 'dist/libs/tooling/devkit/src/index.d.ts',
  },
  {
    name: '@loomweaver/cli',
    role: 'tooling',
    source: 'libs/tooling/cli',
    publishRoot: 'libs/tooling/cli',
  },
  {
    name: '@loomweaver/mcp',
    role: 'tooling',
    source: 'libs/tooling/mcp',
    publishRoot: 'libs/tooling/mcp',
  },
];
