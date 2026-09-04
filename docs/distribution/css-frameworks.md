# Bringing your own CSS framework

<!-- derived-from-specs -->

> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/`. For this page: `theming` · `platform-composition` · `scaffolding`. Where this page and a specification disagree, the
> specification is right, and that is a defect in this page: change the behaviour there, then
> explain it here.

This page runs the shell next to a CSS framework of your own, Bootstrap above all, without installing
Tailwind. You need it when your product is already themed with a framework, or with hand-written CSS,
and the chrome should wear that palette rather than fight it. Tailwind is how the shell is _built_,
not something it imposes on you.

## Import the pre-compiled stylesheet

Import the stylesheet the platform compiled instead of the source theme, and skip the whole Tailwind
step of [manual setup](../manual-setup.md#4--styles): no Tailwind packages, no `.postcssrc.json`, no
`@source` hops to miscount.

```css
/* src/styles.css */
@import '@loomweaver/shell/styles/shell.css';
```

It carries the design tokens, the `.lw-*` class contracts and every utility the shell's own templates
use: 67 KB minified, 11 KB over the wire. What you give up is writing Tailwind utilities in _your_
templates. The `--lw-*` tokens remain available to any CSS you write.

The [distribution scaffold](../scaffolding.md#the-cli--loomweavercli) writes exactly that file when
you pass `--styles precompiled`, and `theme --preset bootstrap` writes the token mapping described
below. Together they are the whole Bootstrap path.

## Import your framework into a cascade layer

This is not optional housekeeping. It is the one thing that decides whether the shell survives:

```css
/* src/styles.css */
@layer vendor;
@import 'bootstrap/dist/css/bootstrap.css' layer(vendor);
@import '@loomweaver/shell/styles/shell.css';
@import './themes/acme.css';
```

Every rule the shell ships sits in a cascade layer. In CSS, **unlayered CSS outranks layered CSS
whatever its specificity**, no matter how precisely a selector targets an element. Bootstrap ships
unlayered. Its Reboot stylesheet contains plain element rules like `button { border-radius: 0 }`.
Those rules therefore beat `.lw-icon-btn`, a class selector, without a fight. Measured on a real
app: every button and segmented control in the shell lost its corner radius and its border, and the
top bar lost padding. Adding `layer(vendor)` restored all of it while keeping Bootstrap's colours.
With the layer in place, both sides are ordered by layer instead of by that rule.

Two of the shell's rules are deliberately _unlayered_: `html, body { margin: 0 }` and the `body`
font, background and text colour, because they set the ground the shell stands on. They read
`--lw-surface` and `--lw-content`, so pointing those tokens at your own variables re-themes the page
rather than fighting it.

## Where the two vocabularies overlap

55 class names exist in both Tailwind and Bootstrap, and the shell's own templates use a dozen of
them: `border`, `rounded`, `shadow`, and spacing like `p-3`, `px-3`, `gap-3`. The values differ.
`p-3` is 0.75rem in Tailwind and 1rem in Bootstrap; `gap-2` and `py-2` happen to agree. Whichever
layer comes last wins those names everywhere. With the import order above, the shell's values win, which is
what keeps the chrome looking like itself. In _your_ markup that means `class="p-3"` gives you the
shell's 0.75rem, not Bootstrap's 1rem. Put the vendor layer last instead if you would rather have it
the other way; the shell will then drift with it. Bootstrap's component classes (`.btn`, `.card`,
`.alert`) never collide, because everything of the shell's is `.lw-`-prefixed.

## Map the tokens onto your palette

To make the shell wear your palette, override the tokens in the tenant layer, which outranks both
the product default and any plugin theme:

```css
@layer lw-tenant-theme {
  :root {
    --lw-brand:   var(--your-primary);
    --lw-surface: var(--your-body-bg);
    --lw-content: var(--your-body-color);
  }
}
```

**On Bootstrap 5.3 you do not have to write that mapping.** Generate it:

```bash
npx @loomweaver/cli theme --name acme --preset bootstrap --out src/themes
```

It maps all 29 tokens onto `--bs-*` and writes down where the mapping is deliberately not one to
one. The short version: LoomWeaver splits a brand colour into three roles, the identity colour, the
colour that is safe to _read_, and the colour that is safe to _fill_ behind white text. Each role
clears a different WCAG threshold. Bootstrap draws the same distinction with `-text-emphasis`, so
that is what the text tokens point at. The `on-*` tokens stay literal, because they must contrast
with the fill rather than follow it.

It writes **no dark block**, and that is not an omission. Bootstrap redefines its own `--bs-*` under
`[data-bs-theme="dark"]`, so every `var()` already resolves to the dark value, as long as you mirror
the attribute as shown below. Note what that buys you: the shell's light/dark switch drives your
framework's, and one stylesheet covers both.

The contrast guarantee travels with the values. The shell's own palette is verified against WCAG 2.1
AA; these are your Bootstrap theme's colours, so if your `--bs-primary` does not clear 4.5:1 behind
white text, neither will the shell's buttons.

Because these are CSS variables, the mapping is **live**: re-theme your framework at runtime and the
shell follows without a rebuild.

## Mirror dark mode

The shell switches by toggling the class `dark` on `<html>`; your framework almost certainly uses
something else (Bootstrap 5.3 reads the attribute `data-bs-theme`). Two switches, one page, so mirror
the shell's onto yours:

```ts
// src/app/app.ts — the root component, with the mirror added
import { Component, DOCUMENT, effect, inject } from '@angular/core';
import { Shell, ThemeService } from '@loomweaver/shell';

@Component({
  selector: 'app-root',
  imports: [Shell],
  templateUrl: './app.html',
})
export class App {
  private readonly theme = inject(ThemeService);
  private readonly html = inject(DOCUMENT).documentElement;

  constructor() {
    effect(() => this.html.setAttribute('data-bs-theme', this.theme.resolvedTheme()));
  }
}
```

It has to sit somewhere with an injection context: a component, or `provideEnvironmentInitializer`
in `app.config.ts`. At module top level `inject()` throws `NG0203`.

Mirror **`resolvedTheme`**, not `mode`. `mode` can be `system`, which no other framework
understands. `resolvedTheme` has already resolved that value against the OS preference, so it is
only ever `light` or `dark`. Drive the mirror in this direction, from the shell to your framework,
and not the reverse. The shell's mode is persisted, synced across tabs and pushed into sandboxed
plugin surfaces. That makes it the one that should lead.

## Where next

- [Branding](branding.md): the `--lw-*` tenant theme in its own right, with or without a framework.
- [Design tokens](../reference/design-tokens.md): every `--lw-*` name a theme file may set, and why sizes have none.
- [Appearance](../distribution-api/appearance.md): `ThemeService`, light and dark and the text size from your own code.
