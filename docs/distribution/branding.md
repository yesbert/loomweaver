# Branding

<!-- derived-from-specs -->

> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/`. For this page: `product-identity` · `theming`. Where this page and a specification disagree, the
> specification is right, and that is a defect in this page: change the behaviour there, then
> explain it here.

`provideProductIdentity({ name, tagline, logoUrl })` is your product's identity: the
neutral shell reads it (header, About, PWA manifest). `name` is a literal; `tagline` is a translation
key (put it in your `product` namespace). Without it, the bare LoomWeaver identity shows.

**Colours (tenant/product theme).** Override the `--lw-*` design tokens by importing a theme CSS _after_
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

The `theme` generator scaffolds exactly this file with the full token ladder, see
[Scaffolding](../scaffolding.md); the token names live in
[design tokens](../reference/design-tokens.md). A plugin can re-skin the app, but your branding stays
unassailable.

The tokens cover **colour and type only**. Sizes, radii and spacing deliberately have none, because
tokenising every number would freeze every rule of the workbench's chrome into a promise; if your product has to
change one, plain unlayered CSS wins over everything the shell paints, and
[design tokens → dimensions](../reference/design-tokens.md#dimensions-there-are-no-tokens-and-how-to-change-them-anyway)
gives the recipe and its two honest limits.

**Tailwind is optional.** The snippet above assumes it because it is the default the quickstart sets
up, but the shell also ships pre-compiled, and a product themed with Bootstrap or another framework
imports that instead: [Bringing your own CSS framework](css-frameworks.md) has the import order, the
generated Bootstrap token mapping and the dark-mode mirror.

## Where next

- [Bringing your own CSS framework](css-frameworks.md): the pre-compiled stylesheet, Bootstrap in a cascade layer, the token mapping.
- [Icons, translations and rewording](icons-and-i18n.md): the glyphs and the strings beside the identity and the tokens.
- [Appearance](../distribution-api/appearance.md): `ThemeService`, light and dark and the text size from your own code.
- [Design tokens](../reference/design-tokens.md): every `--lw-*` name a theme file may set.
