# Appearance

<!-- derived-from-specs -->

> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/`. For this page: `theming` · `host-services`. Where this page and a specification disagree, the
> specification is right, and that is a defect in this page: change the behaviour there, then
> explain it here.

Light and dark, and the text size, from your own code; colours and icons are declared, not driven.

## Do it

```ts
const theme = inject(ThemeService);
theme.setMode('dark');   // persists, and mirrors to the app's other browser windows

const textSize = inject(FontScaleService);
textSize.setScale('lg'); // persists through the settings store, mirrors to the app's other browser windows
```

## Read it

```ts
theme.mode();            // ThemeMode — what the user picked: 'light' | 'dark' | 'system'
theme.resolvedTheme();   // ResolvedTheme — what is actually rendered: 'light' | 'dark'
textSize.scale();        // FontScale: 'sm' | 'md' | 'lg' | 'xl'
```

`mode()` is what the user picked and `resolvedTheme()` what is rendered; the two differ when the pick is `system`. `scale()` is the text size in force.

## What asks about unsaved work

Nothing on this page asks; a mode or a text size changes the rendering and closes nothing.

## Switched off

No switch governs appearance. The built-in mode switch and text size toggle live in the settings, and `provideShell({ omit })` is what removes a settings row.

## In depth

**Light and dark.** The shell already ships a mode switch, persists the choice through the settings
store and toggles the `dark` class on `<html>`. That class is what flips the `--lw-*` token ladder.
Inject the service when **your own UI has to agree with it**, most often to mirror the mode onto
another framework's switch, so the page cannot end up half dark:

```ts
// Bootstrap 5.3 reads data-bs-theme; keep it in step with the shell's mode.
effect(() => {
  document.documentElement.setAttribute('data-bs-theme', theme.resolvedTheme());
});
```

Use `resolvedTheme` for that, never `mode`: `mode` can be `system`, which is not a value any other
framework understands. See [bringing your own CSS
framework](../distribution/css-frameworks.md).

**Text size.** `md` is the default and imposes nothing, so the browser's own setting decides. Bind
your own control to `scale()` and it follows the built-in toggle in the settings, and the other way
round.

**Colours and icons.** Colours are the `--lw-*` design tokens, set in CSS by the distribution or
contributed by a plugin: see [Design tokens](../reference/design-tokens.md). Icons are replaced with
`provideIcons`: see [Icons](../reference/icons.md).

## Where the story is told

- [Branding](../distribution/branding.md#branding): name, logo, tagline and colours.
- [Bringing your own CSS framework](../distribution/css-frameworks.md): keeping a foreign framework in step with the mode.
