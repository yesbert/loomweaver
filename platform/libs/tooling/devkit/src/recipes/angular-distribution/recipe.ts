import { Amendment } from '../../lib/amend/types';
import { distributionAmendments } from './amendments';
import { FileMap, Recipe } from '../../lib/generate/types';
import { isKebabId, toTitleCase } from '../../lib/generate/casing';
import { renderRegions } from '../shell-regions';
import { PLACEHOLDER_LOGO_SVG } from './logo';

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
  provideLayout,
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

function stylesNotes(d: ResolvedDistribution): readonly string[] {
  if (d.styles === 'precompiled') {
    return [
      '`src/styles.css` imports the stylesheet **we** compiled — tokens, the `.lw-*` class contracts',
      "and every utility the shell's own templates use, 67 KB minified and 11 KB over the wire. There",
      'is nothing to install and nothing to configure: no `tailwindcss`, no `.postcssrc.json`, no',
      '`@source` paths to miscount.',
      '',
      'What you give up is writing Tailwind utilities in *your own* templates. The `--lw-*` tokens stay',
      'available to any CSS you write, so re-theming stays a token remap rather than a fight.',
      '',
      'If you bring a CSS framework of your own, **import it into a cascade layer** — the file says how,',
      'and it is the one decision that determines whether the chrome survives the introduction. Prefer',
      'Tailwind after all? Re-run the scaffold with `--styles tailwind`.',
    ];
  }
  return [
    "`src/styles.css` compiles the shell's source theme with Tailwind 4, which is also what lets you",
    'write Tailwind utilities in your own templates. The scaffold wrote `.postcssrc.json` beside your',
    '`package.json` for you, because without it the stylesheet is read as plain CSS: no utility class',
    'is emitted, the workbench renders unstyled, and the build still reports success. The packages are',
    'the one thing left, because a scaffold does not install:',
    '',
    '```sh',
    'npm install -D tailwindcss @tailwindcss/postcss @tailwindcss/typography',
    '```',
    '',
    'Use **semantic tokens only** in your own templates (`bg-surface`, `text-content`, `text-brand`,',
    '`border-border`), never raw palette colours.',
    '',
    '**Count the `../` hops in the `@source` line.** It is resolved from the stylesheet, not from the',
    'workspace root, and the scaffold derived it from where this project sits. Move the project and',
    "nothing errors — Tailwind simply emits none of the shell's classes and the app renders unstyled.",
    '',
    'Want none of this? Re-run the scaffold with `--styles precompiled` and you get a one-line',
    'stylesheet that needs no Tailwind at all — the right choice if your product is themed with',
    'Bootstrap, Bulma or hand-written CSS.',
  ];
}

function readme(d: ResolvedDistribution): string {
  return [
    `# ${d.title} — a LoomWeaver distribution`,
    '',
    `The composition root that assembles the platform into a shippable product. It renders the bare`,
    `shell out of the box; add your weavers and branding below. Your own README is untouched — the`,
    `scaffold writes its notes here so it can never overwrite prose you wrote.`,
    '',
    '## Run it',
    '',
    'In an Nx workspace (the generator wired the project):',
    '',
    '```sh',
    `nx serve ${d.name}`,
    '```',
    '',
    'Scaffolded over the CLI or MCP, these files are sources without build wiring — drop them into',
    "an application you already serve (`ng new`, or an Nx application). They keep Angular's own",
    'shape: `main.ts` bootstraps `App`, `App` renders `<lw-shell />`, and everything this product is',
    'made of lives in `app.config.ts`. Nothing of the generated app is deleted. Over an existing',
    'application `--force` replaces exactly the files above — all of them bootstrap wiring, none of',
    'them content you authored. Under Nx it additionally merges the build targets into that',
    "project's `project.json`, keeping the targets, `implicitDependencies` and tags it already had.",
    '',
    'Two leftovers from `ng new` are no longer referenced and can go: `src/app/app.routes.ts` (the',
    'shell owns content routing via `provideShellRouter()`) and `src/app/app.css`. The generated',
    '`src/app/app.spec.ts` now fails — `App` pulls the whole shell into a bare `TestBed` — so delete',
    'it and test your own components instead of the composition root.',
    '',
    'The project is generated **untagged**: Nx tags belong to your `depConstraints`, and inventing',
    'one would fail a lint policy you never opted this project into. If your workspace enforces',
    'module boundaries, give it tags your constraints allow — `--tags` at generation time, or',
    '`tags` in `project.json` afterwards.',
    '',
    '## Compose weavers + branding (in `src/app/app.config.ts`)',
    '',
    'The layout is already there. Adding a weaver is three providers plus its import — note the',
    '**spread**, since `providePlugins` is variadic and returns an array:',
    '',
    '```ts',
    "import { providePlugins, provideCapabilityGrants, provideTranslationNamespaces } from '@loomweaver/shell';",
    "import { notesPlugin } from '@acme/notes-weaver';   // Nx: the workspace alias; otherwise a relative path",
    '',
    "    provideTranslationNamespaces('notes'),",
    "    provideCapabilityGrants({ notes: ['contributions', 'ui', 'navigation'] }),",
    '    ...providePlugins(notesPlugin),',
    '```',
    '',
    "Grant exactly what the weaver's manifest declares — the broker is default-deny, so an ungranted",
    'plugin throws `CapabilityError` instead of quietly doing less. A weaver also needs its',
    'translations served: add an assets glob for its `src/lib/i18n` under `i18n/<id>` (the Nx',
    'generator does this for you).',
    '',
    '`public/logo.svg` is the LoomWeaver mark, dropped in as a placeholder so the top bar renders',
    'something from the first run instead of a broken image. Replace it with your own — any square',
    'image will do; `logoUrl` resolves against your served root. `tagline` is a',
    'translation key that falls back to rendering itself, so the literal above works but makes',
    'Transloco log a missing-translation warning in dev; point it at a key of your own to silence it.',
    '',
    'That same file is also the **app icon**: the browser tab reads it, and the manifest names it so',
    'the app has an icon at all. One gap is left on purpose, because a scaffold writes text and',
    'cannot invent your artwork: **Chromium only offers installation once the manifest names a 192',
    'and a 512 raster icon**, and iOS ignores manifest icons entirely in favour of',
    '`apple-touch-icon`. Drop `icon-192.png` and `icon-512.png` next to the logo, add them to the',
    "manifest's `icons` and add an `apple-touch-icon` link to `index.html`, and the app becomes",
    'installable. Until then it runs and caches offline, it simply is not offered for installation.',
    '',
    '## Styles',
    '',
    ...stylesNotes(d),
    '',
    '## Build wiring',
    '',
    'The scaffold did this. Your build target now names the stylesheet, three asset globs, the',
    'service worker and one production setting, and the run that wrote these files listed each one it',
    'added. Anything you had already set was left exactly as you set it.',
    '',
    'What each is for, so that nobody removes one as clutter. The **`@loomweaver/shell/i18n` glob**',
    'serves the strings the shell fetches at runtime; without it every label in the chrome renders as',
    'its raw translation key and nothing errors. The **frame-kit** glob only matters if you host',
    'sandboxed (iframe) plugins — until you install that package the glob simply matches nothing.',
    '**`serviceWorker`** emits the worker that `provideShell()` already registers for you (inert in',
    'dev) — never add `provideServiceWorker` yourself, and if you would rather ship no worker at all,',
    'drop `ngsw-config.json` and pass `provideShell({ serviceWorker: false })`, because otherwise the',
    'registration 404s in production. **`optimization.styles.inlineCritical: false`** is not optional:',
    "the `index.html` above ships a strict `script-src 'self'`, and Angular's critical-CSS pass loads",
    'the stylesheet with an **inline** `onload` handler that the policy blocks — the app then renders',
    'completely unstyled, and only in production builds.',
    '',
    'One thing is still yours, because the scaffold cannot know your budget: a production build warns',
    "that the initial bundle exceeds Angular's 500 kB default. The shell is a whole application",
    'chrome, so raise the budgets in your build target.',
    '',
    '## Ship less than the whole workbench',
    '',
    'The shell arrives with every capability on: splitting, dragging tabs between panes, pinning,',
    'stacking views, pop-out windows, keyboard shortcuts, the curation checklists. A product whose',
    'users would be overwhelmed by that switches parts off in the same providers array:',
    '',
    '```ts',
    "import { provideShellFeatures } from '@loomweaver/shell';",
    '',
    '    provideShellFeatures({',
    '      content: { splitRight: false, splitDown: false, moveTabs: false },',
    '      sidebar: { stackViews: false },',
    '      windows: { popout: false },',
    '    }),',
    '```',
    '',
    'A switch takes the **affordance and the gesture**: turning `splitRight` off removes the toolbar',
    'button, the drop edges *and* `mod+\\`, so the capability cannot come back through a second door.',
    'Fields merge group by group, so name only what you turn off. The groups are `content`,',
    '`sidebar`, `rail`, `workspaces`, `windows` and `commands`; everything is on by default except',
    '`content.escalate`, the unlabelled double-click cycle on a tab.',
    '',
    'That provider is for **gestures**. A command, a bar or rail item, a settings row or a menu entry',
    'is a *contribution* and goes instead — by id — into `provideShell({ omit: [...] })`. Where a',
    'capability is both, the feature switch wins and takes the menu entry with it.',
    '',
    'A product backend is optional: implement the settings-store / auth-source ports',
    '(`provideSettingsStore` / `provideAuthSource`, both against the `KeyValueStore` shape)',
    'with your own backend, or keep the local/anonymous defaults for a standalone UI.',
    'Working state stays on `WORKING_STATE_STORE` and never reaches your',
    'settings backend; back it separately with `provideWorkingStateStore` only if',
    'working state should travel across devices.',
    '',
  ].join('\n');
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
