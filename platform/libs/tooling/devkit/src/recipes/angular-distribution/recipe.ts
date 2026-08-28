import { Amendment } from '../../lib/amend/types';
import { distributionAmendments } from './amendments';
import { FileMap, Recipe } from '../../lib/generate/types';
import { isKebabId, toTitleCase } from '../../lib/generate/casing';
import { renderRegions } from '../shell-regions';
import { PLACEHOLDER_LOGO_SVG } from './logo';
import { readme } from './readme';

/**
 * Which stylesheet to emit. 'tailwind' compiles the shell's source theme, which is also what lets
 * you write Tailwind utilities of your own; 'precompiled' imports the stylesheet we compiled, so
 * the application needs no Tailwind at all and can be themed with something else entirely.
 */
export type DistributionStyles = 'tailwind' | 'precompiled';

export interface DistributionInput {
  readonly name: string;
  readonly title?: string;
  /** Project root relative to the workspace root. Defaults to 'apps/<name>'. */
  readonly directory?: string;
  /** Emit the starter spec. Defaults to true; false when the workspace runs no unit tests. */
  readonly withTests?: boolean;
  readonly styles?: DistributionStyles;
}

export interface ResolvedDistribution {
  readonly name: string;
  readonly title: string;
  readonly nodeModulesFromSrc: string;
  readonly withTests: boolean;
  readonly styles: DistributionStyles;
}

const STYLES: readonly DistributionStyles[] = ['tailwind', 'precompiled'];

export function resolveDistributionInput(
  input: DistributionInput,
): ResolvedDistribution {
  if (!isKebabId(input.name)) {
    throw new Error(
      `Distribution name must be kebab-case (e.g. "acme-studio"); got "${input.name}".`,
    );
  }
  const styles = input.styles ?? 'tailwind';
  if (!STYLES.includes(styles)) {
    throw new Error(
      `Unknown styles option "${styles}"; expected one of ${STYLES.join(', ')}.`,
    );
  }
  const directory =
    input.directory === undefined
      ? `apps/${input.name}`
      : input.directory.trim();
  const depth = directory.split('/').filter(Boolean).length;
  return {
    name: input.name,
    title: input.title?.trim() || toTitleCase(input.name),
    nodeModulesFromSrc: `${'../'.repeat(depth + 1)}node_modules`,
    withTests: input.withTests !== false,
    styles,
  };
}

function mainTs(): string {
  return `import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
`;
}

function appConfigTs(d: ResolvedDistribution): string {
  return `import { ApplicationConfig } from '@angular/core';
import {
  provideCommandPaletteEntry,
  provideLayout,
  provideQuickOpenEntry,
  provideShell,
  provideShellRouter,
  type ShellLayout,
} from '@loomweaver/shell';
import { provideProductIdentity } from '@loomweaver/plugin-sdk';

/* Which regions exist and where they dock. Contributions target these ids, so a region a
   weaver names but this layout omits renders nothing — silently. 'primary' (rail) and
   'status-bar' (bar) are what the scaffolded weaver targets. */
export const layout: ShellLayout = {
  regions: [
${renderRegions('    ')}
  ],
};

/* Everything this product is made of goes in this array: your weavers, their capability
   grants and your branding. The shell arrives with every capability on; switch gestures
   off with provideShellFeatures and drop contributions with provideShell({ omit }).
   See LOOMWEAVER.md. */
export const appConfig: ApplicationConfig = {
  providers: [
    provideShellRouter(),
    provideShell(),
    provideLayout(layout),
    /* The two searches the shell seeds: mod+k over commands, mod+p over open work. Both work
       without these two lines; these put the shortcut on screen for a user who does not know
       it. Delete either one, or pass { bar, slot, order } to place it elsewhere. */
    provideCommandPaletteEntry(),
    provideQuickOpenEntry(),
    provideProductIdentity({
      name: '${d.title}',
      tagline: 'Built on LoomWeaver',
      logoUrl: 'logo.svg',
    }),
  ],
};
`;
}

function appTs(): string {
  return `import { Component } from '@angular/core';
import { Shell } from '@loomweaver/shell';

@Component({
  selector: 'app-root',
  imports: [Shell],
  templateUrl: './app.html',
})
export class App {}
`;
}

function appHtml(): string {
  return `<lw-shell />\n`;
}

function appConfigSpec(): string {
  return `import { layout } from './app.config';

/* A green starting point that pins the one trap the compiler cannot catch: a contribution aimed at
   a region id this layout omits renders nothing, and says nothing. List the ids your weavers target
   here, and this fails the day someone edits the layout instead of failing in the browser. */
describe('layout', () => {
  it('declares the regions contributions target', () => {
    const ids = layout.regions.map((region) => region.id);
    for (const id of ['primary', 'status-bar', 'main']) {
      expect(ids).toContain(id);
    }
  });
});
`;
}

function indexHtml(d: ResolvedDistribution): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${d.title}</title>
    <base href="/" />
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; frame-src 'self'; object-src 'none'; base-uri 'self'"
    />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#2E96C9" />
    <link rel="icon" type="image/svg+xml" href="logo.svg" />
    <link rel="manifest" href="manifest.webmanifest" />
  </head>
  <body>
    <app-root></app-root>
  </body>
</html>
`;
}

function precompiledCss(): string {
  return `/* The stylesheet we compiled: the design tokens, the .lw-* class contracts and every utility
   the shell's own templates use. This application needs no Tailwind to build.

   BRINGING YOUR OWN CSS FRAMEWORK? Import it INTO A CASCADE LAYER. Every rule we ship is layered,
   and unlayered CSS outranks layered CSS whatever its specificity — so an unlayered Bootstrap
   Reboot (button { border-radius: 0 }) strips the chrome's radii and borders without a fight.
   A @layer statement is one of the few things allowed before @import:

     @layer vendor;
     @import 'bootstrap/dist/css/bootstrap.css' layer(vendor);

   Then re-theme by pointing the --lw-* tokens at your framework's variables. For Bootstrap 5.3 the
   whole 29-token mapping is a scaffold:

     loomweaver theme --name acme --preset bootstrap
     @import './themes/acme.css';   (after the import below) */

@import '@loomweaver/shell/styles/shell.css';
`;
}

function tailwindCss(d: ResolvedDistribution): string {
  return `@import 'tailwindcss';

/* LoomWeaver design tokens + theme (light/dark, brand colors). Every @import has to precede the
   other at-rules below: that is what plain CSS requires, and it is what keeps editors from
   flagging a misplaced @import in a file you did not write. */
@import '@loomweaver/shell/styles/theme.css';

@plugin '@tailwindcss/typography';

/* Generate the utility classes the shell (and your own components) use. The @source path must
   reach your workspace's node_modules FROM THIS FILE — adjust the ../ hops if this project does
   not sit at that depth, or Tailwind silently emits none of the shell's classes. */
@source '${d.nodeModulesFromSrc}/@loomweaver/shell';
@source './';
`;
}

function stylesCss(d: ResolvedDistribution): string {
  return d.styles === 'precompiled' ? precompiledCss() : tailwindCss(d);
}

function ngswConfig(): string {
  return JSON.stringify(
    {
      $schema: './node_modules/@angular/service-worker/config/schema.json',
      index: '/index.html',
      assetGroups: [
        {
          name: 'app',
          installMode: 'prefetch',
          resources: {
            files: ['/index.html', '/manifest.webmanifest', '/*.css', '/*.js'],
          },
        },
        {
          name: 'i18n',
          installMode: 'prefetch',
          updateMode: 'prefetch',
          resources: {
            files: ['/i18n/**/*.json'],
          },
        },
        {
          name: 'assets',
          installMode: 'lazy',
          updateMode: 'prefetch',
          resources: {
            files: [
              '/**/*.(svg|cur|jpg|jpeg|png|apng|webp|avif|gif|otf|ttf|woff|woff2|ico)',
            ],
          },
        },
      ],
    },
    null,
    2,
  );
}

function manifest(d: ResolvedDistribution): string {
  return JSON.stringify(
    {
      name: d.title,
      short_name: d.title,
      description: `${d.title} — a LoomWeaver distribution.`,
      start_url: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#2E96C9',
      icons: [{ src: 'logo.svg', type: 'image/svg+xml', sizes: 'any' }],
    },
    null,
    2,
  );
}

export const angularDistribution: Recipe<DistributionInput> = {
  id: 'angular-distribution',
  amend(input: DistributionInput): readonly Amendment[] {
    return distributionAmendments(resolveDistributionInput(input));
  },
  build(input: DistributionInput): FileMap {
    const d = resolveDistributionInput(input);
    return {
      'src/main.ts': mainTs(),
      'src/app/app.config.ts': appConfigTs(d),
      ...(d.withTests ? { 'src/app/app.config.spec.ts': appConfigSpec() } : {}),
      'src/app/app.ts': appTs(),
      'src/app/app.html': appHtml(),
      'src/index.html': indexHtml(d),
      'src/styles.css': stylesCss(d),
      'public/logo.svg': PLACEHOLDER_LOGO_SVG,
      'public/manifest.webmanifest': manifest(d) + '\n',
      'ngsw-config.json': ngswConfig() + '\n',
      'LOOMWEAVER.md': readme(d),
    };
  },
};
