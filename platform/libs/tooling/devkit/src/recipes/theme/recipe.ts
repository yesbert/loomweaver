import { FileMap, Recipe } from '../../lib/generate/types';
import { isKebabId, toTitleCase } from '../../lib/generate/casing';

export type ThemePreset = 'literal' | 'bootstrap';

export interface ThemeInput {
  readonly name: string;
  readonly preset?: ThemePreset;
}

export interface ResolvedTheme {
  readonly name: string;
  readonly title: string;
  readonly preset: ThemePreset;
}

const PRESETS: readonly ThemePreset[] = ['literal', 'bootstrap'];

export function resolveThemeInput(input: ThemeInput): ResolvedTheme {
  if (!isKebabId(input.name)) {
    throw new Error(`Theme name must be kebab-case (e.g. "midnight"); got "${input.name}".`);
  }
  const preset = input.preset ?? 'literal';
  if (!PRESETS.includes(preset)) {
    throw new Error(`Unknown theme preset "${preset}"; expected one of ${PRESETS.join(', ')}.`);
  }
  return { name: input.name, title: toTitleCase(input.name), preset };
}

function cssFile(t: ResolvedTheme): string {
  return `/* ${t.title} theme — overrides LoomWeaver's --lw-* design tokens.
   Import it AFTER the shell theme in your distribution styles.css:
     @import '@loomweaver/shell/styles/theme.css';
     @import './themes/${t.name}.css';
   Declared in @layer lw-tenant-theme so it beats any plugin's ctx.contributeTheme
   (Product default < Plugin < Tenant). The --lw-* ladder flips in :root.dark, so override both. */

@layer lw-tenant-theme {
  :root {
    --lw-brand: #2e96c9;
    --lw-brand-strong: #237aa6;
    --lw-brand-fill: #2e96c9;
    --lw-brand-text: #1f6f97;
    --lw-accent: #c59a2f;
    --lw-surface: #ffffff;
    --lw-surface-raised: #f7f8fa;
    --lw-content: #1f2937;
    --lw-content-muted: #4b5563;
    --lw-content-faint: #6b7280;
    --lw-border: #e5e7eb;
  }

  :root.dark {
    --lw-brand: #3aa9dd;
    --lw-brand-strong: #2e96c9;
    --lw-brand-fill: #2e96c9;
    --lw-brand-text: #7cc4e6;
    --lw-accent: #d8b45a;
    --lw-surface: #0f141a;
    --lw-surface-raised: #171d25;
    --lw-content: #e5e7eb;
    --lw-content-muted: #9ca3af;
    --lw-content-faint: #6b7280;
    --lw-border: #2a323c;
  }
}
`;
}

function bootstrapFile(t: ResolvedTheme): string {
  return `/* ${t.title} theme — maps LoomWeaver's --lw-* design tokens onto Bootstrap 5.3's --bs-*.
   Import it AFTER the shell theme in your distribution styles.css, and import Bootstrap itself
   INTO A LAYER — unlayered CSS outranks layered CSS whatever its specificity, so Bootstrap's
   Reboot (button { border-radius: 0 }) would otherwise beat our .lw-* component classes:
     @layer vendor;
     @import 'bootstrap/dist/css/bootstrap.css' layer(vendor);
     @import '@loomweaver/shell/styles/shell.css';   (or styles/theme.css if you run Tailwind)
     @import './themes/${t.name}.css';
   Declared in @layer lw-tenant-theme so it beats any plugin's ctx.contributeTheme
   (Product default < Plugin < Tenant).

   THERE IS NO :root.dark BLOCK, on purpose. Bootstrap redefines its own --bs-* variables under
   [data-bs-theme="dark"], so every var() below already resolves to the dark value — provided that
   attribute is in step with the shell's mode. Mirror it once at startup, from somewhere with an
   injection context — your root component, or provideEnvironmentInitializer in app.config.ts:

     private readonly theme = inject(ThemeService);        // from '@loomweaver/shell'
     private readonly html = inject(DOCUMENT).documentElement;
     constructor() {
       effect(() => this.html.setAttribute('data-bs-theme', this.theme.resolvedTheme()));
     }

   Use resolvedTheme, never mode: mode can be 'system', which Bootstrap does not understand.

   WHERE THIS MAPPING IS DELIBERATELY NOT ONE TO ONE: LoomWeaver splits a brand colour into the
   identity colour, the colour it is safe to *read* as text, and the colour it is safe to *fill*
   behind white text, because each clears a different WCAG threshold. Bootstrap 5.3 draws the same
   distinction with -text-emphasis, so that is what the text tokens point at. The on-* tokens are
   literal because they must contrast with the fill, not follow it, and they match what Bootstrap
   itself puts on .btn-primary, .btn-warning and .btn-info.

   CONTRAST IS YOURS NOW. LoomWeaver's own palette is verified against WCAG 2.1 AA. These values are
   your Bootstrap theme's, so the guarantee travels with them: if your --bs-primary does not clear
   4.5:1 behind white text, neither will our buttons. */

@layer lw-tenant-theme {
  :root {
    --lw-brand: var(--bs-primary);
    --lw-brand-strong: var(--bs-primary-text-emphasis);
    --lw-brand-text: var(--bs-primary-text-emphasis);
    --lw-brand-fill: var(--bs-primary);
    --lw-on-brand: #fff;
    --lw-accent: var(--bs-secondary);
    --lw-accent-strong: var(--bs-secondary-text-emphasis);

    --lw-surface: var(--bs-body-bg);
    --lw-surface-raised: var(--bs-body-bg);
    --lw-surface-overlay: var(--bs-tertiary-bg);
    --lw-field: var(--bs-body-bg);
    --lw-border: var(--bs-border-color);

    --lw-content: var(--bs-body-color);
    --lw-content-muted: var(--bs-secondary-color);
    --lw-content-faint: var(--bs-secondary-color);

    --lw-tooltip: var(--bs-emphasis-color);
    --lw-tooltip-content: var(--bs-body-bg);

    --lw-positive: var(--bs-success);
    --lw-on-positive: #fff;
    --lw-negative: var(--bs-danger);
    --lw-negative-fill: var(--bs-danger);
    --lw-on-negative: #fff;
    --lw-caution: var(--bs-warning);
    --lw-on-caution: #000;
    --lw-info: var(--bs-info);
    --lw-on-info: #000;

    --lw-scrim: rgb(0 0 0 / 0.5);
    --lw-scroll-thumb: rgb(0 0 0 / 0.3);
    --lw-scroll-track: transparent;

    --lw-font-sans: var(--bs-body-font-family);
    --lw-font-mono: var(--bs-font-monospace);
  }
}
`;
}

export const theme: Recipe<ThemeInput> = {
  id: 'theme',
  build(input: ThemeInput): FileMap {
    const t = resolveThemeInput(input);
    const content = t.preset === 'bootstrap' ? bootstrapFile(t) : cssFile(t);
    return { [`${t.name}.css`]: content };
  },
};
