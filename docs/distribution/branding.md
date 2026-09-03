# Branding

<!-- derived-from-specs -->
> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/` — for this page: `product-identity` · `theming`. Where this page and a specification disagree, the
> specification is right, and that is a defect in this page: change the behaviour there, then
> explain it here.

`provideProductIdentity({ name, tagline, logoUrl })` is your product's identity: the
neutral shell reads it (header, About, PWA manifest). `name` is a literal; `tagline` is a translation
key (put it in your `product` namespace). Without it, the bare LoomWeaver identity shows.

**Colors (tenant/product theme).** Override the `--lw-*` design tokens by importing a theme CSS *after*
the shell theme in your `styles.css`, wrapped in `@layer lw-tenant-theme` so it beats any plugin's
`ctx.contributeTheme` (precedence is Product < Plugin < **Tenant**):

```css
/* src/styles.css */
@import 'tailwindcss';
@import '@loomweaver/shell/styles/theme.css';
@import './themes/acme.css'; /* AFTER the shell theme */
```

```css
/* src/themes/acme.css — the --lw-* ladder flips in :root.dark, so override both */
@layer lw-tenant-theme {
  :root {
    --lw-brand: #2e96c9;
    --lw-accent: #c59a2f;
  }
  :root.dark {
    --lw-brand: #3aa9dd;
    --lw-accent: #d8b45a;
  }
}
```

The `theme` generator scaffolds exactly this file with the full token ladder — see
[Scaffolding](../scaffolding.md); the token names live in
[design tokens](../reference/design-tokens.md). A plugin can re-skin the app, but your branding stays
unassailable.

The tokens cover **colour and type only**. Sizes, radii and spacing deliberately have none, because
tokenising every number would freeze every rule of our chrome into a promise; if your product has to
change one, plain unlayered CSS wins over everything the shell paints, and
[design tokens → dimensions](../reference/design-tokens.md#dimensions-there-are-no-tokens-and-how-to-change-them-anyway)
gives the recipe and its two honest limits.

**Tailwind is optional.** The snippet above assumes it because it is the default the quickstart sets
up, but the shell also ships pre-compiled: `@import '@loomweaver/shell/styles/shell.css';` on its own
replaces both the `tailwindcss` import and the `@source` glob. Take that route when your product is
themed with a different framework, and read
[bringing your own CSS framework](../manual-setup.md#bringing-your-own-css-framework) first — a foreign
framework imported *unlayered* outranks all of ours regardless of specificity, so it has to go into a
layer of its own. On Bootstrap 5.3 you do not have to write the token mapping at all:
`loomweaver theme --name acme --preset bootstrap` points the `--lw-*` ladder at Bootstrap's `--bs-*`
variables. If your own UI has to follow light and dark, inject
[`ThemeService`](../distribution-api/appearance.md) and mirror `resolvedTheme()`.

## Where next

- [Building a distribution](../building-a-distribution.md): the composition root and the map of these pages.
- [Distribution API](../distribution-api/index.md): everything your own code can do once the product runs.
