# Appearance

<!-- derived-from-specs -->
> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/` — for this page: `theming` · `host-services`. Where this page and a specification disagree, the
> specification is right, and that is a defect in this page: change the behaviour there, then
> explain it here.

Light and dark, and the text size, from your own code; colours and icons are declared, not driven.

## Do it

```ts
const theme = inject(ThemeService);

theme.mode();            // ThemeMode — what the user picked: 'light' | 'dark' | 'system'
theme.resolvedTheme();   // ResolvedTheme — what is actually rendered: 'light' | 'dark'
theme.setMode('dark');   // persists, and mirrors to other tabs
```

```ts
const textSize = inject(FontScaleService);

textSize.scale();        // FontScale: 'sm' | 'md' | 'lg' | 'xl'
textSize.setScale('lg'); // persists through the settings store, mirrors to other tabs
```

## Light and dark, in depth

The shell already ships a mode switch, persists the choice through the settings store and toggles
the `dark` class on `<html>`, which is what flips the `--lw-*` token ladder. Inject the service when
**your own UI has to agree with it** — most often to mirror the mode onto another framework's
switch, so the page cannot end up half dark:

```ts
// Bootstrap 5.3 reads data-bs-theme; keep it in step with ours.
effect(() => {
  document.documentElement.setAttribute('data-bs-theme', theme.resolvedTheme());
});
```

Use `resolvedTheme` for that, never `mode`: `mode` can be `system`, which is not a value any other
framework understands. See [bringing your own CSS
framework](../../manual-setup.md#bringing-your-own-css-framework).

## Text size, in depth

`md` is the default and imposes nothing, so the browser's own setting decides. Bind your own control
to `scale()` and it follows the built-in toggle in the settings, and the other way round.

## Colours and icons

Colours are the `--lw-*` design tokens, set in CSS by the distribution or contributed by a plugin: see [Design tokens](../design-tokens.md). Icons are replaced with `provideIcons`: see [Icons](../icons.md).

## Where the story is told

- [Branding](../../building-a-distribution.md#branding) and [Bringing your own CSS framework](../../manual-setup.md#bringing-your-own-css-framework).
