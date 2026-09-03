# Icons and theme

<!-- derived-from-specs -->
> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/` — for this page: `theming`. Where this page and a specification disagree, the
> specification is right, and that is a defect in this page: change the behaviour there, then
> explain it here.

A weaver can add icon names of its own and re-skin the whole application. Both go through `ctx`, and both are first-wins, so an installed plugin cannot repaint what a product or an earlier plugin has set.

## Custom icons — `ctx.contributeIcons`

`icon` is a host-registry name. The shell ships a small first-party set (`add`, `search`, `settings`,
`outline`, `document`, …); your domain needs more (`graph`, `upload`, …). Contribute your own names at
activation, then reference them like any other icon. Names are **first-wins**: a name the shell already
ships (like `document`) cannot be overridden — pick unique, ideally prefixed names. Only the product
itself may replace a shipped glyph, with `provideIcons`; when it does, the replacement reaches your
view too, so `<lw-icon name="trash">` draws the product's glyph rather than ours:

```ts
ctx.contributeIcons({
  // name → raw SVG string (an @ng-icons export, or hand-authored markup)
  notesGraph: '<svg viewBox="0 0 24 24" ...>…</svg>',
});

ctx.registerSurface({ id: 'notes.list', title: 'notes.list.title', docks: ['primary'],
  icon: 'notesGraph', component: NotesListView });   // ← your contributed name
```

Names are flat and **collision-safe**: a name already registered by the shell or another plugin is
ignored (first-wins, dev-warned), so pick unique names. Contributed SVG is **sanitized at registration**
(DOMPurify, SVG profile) — `<script>`, event handlers and `javascript:` hrefs are stripped, and an icon
whose markup does not survive sanitization is dropped (dev-warned); ship plain vector markup. The host
paints the icon wherever your contribution appears (rail/bar/view/command), and you can also render a
contributed (or first-party) name **in your own view body** with `<lw-icon name="…">` — see
[design tokens](../reference/design-tokens.md).

## Custom theme — `ctx.contributeTheme`

Contribute `--lw-*` design tokens to re-skin the whole app — host chrome **and** every plugin, since
all read the same tokens. The vocabulary covers colors **and** the UI font
(`--lw-font-sans` / `--lw-font-mono`). Requires the `theme` capability. Only whitelisted `--lw-*` names
apply; unknown names are ignored (dev-warned). The returned `Disposable` removes exactly these tokens
and the app reverts — so a theme can be toggled on and off. (Font *size* is a user preference, not a
theme token.)

```ts
manifest: { id: 'ocean', name: 'Ocean', capabilities: ['theme'] },
activate(ctx) {
  const handle = ctx.contributeTheme(
    {
      '--lw-brand': '#0e7490',
      '--lw-brand-strong': '#0c5a70',
      '--lw-accent': '#f59e0b',
      '--lw-surface': '#f0fdff',
      '--lw-font-sans': "'Inter', system-ui, sans-serif",
    },
    // Optional: override only what differs in dark mode.
    { '--lw-surface': '#04222b' },
  );
  // handle.dispose() reverts the app to the product/tenant theme.
}
```

The first argument applies in **both** light and dark mode. Pass the optional second `dark` map to
override specific tokens only when dark mode is active — tokens absent from it keep their base value
across both modes, so you only list what actually differs (typically surfaces and content colors).

Precedence is **Product default < Plugin < Tenant**: a plugin themes freely, but a token the tenant
(the distribution's own branding CSS) explicitly set is never overridden. See
[design tokens](../reference/design-tokens.md) for the token vocabulary and cascade layers.

A theme contribution is **live per-window session state**, not a stored setting — it does not cross
either persistence port, so it neither survives a reload nor rides [cross-tab sync](../distribution/windows-and-sync.md#cross-tab-live-sync)
on its own. If you want a theme toggle to persist and mirror across windows, persist your own on/off
flag and re-apply it — the testbed weaver's theme toggle does exactly this (`testbed-theme.ts`, trimmed):

```ts
const STORAGE_KEY = 'my.theme.enabled';
let contribution: Disposable | undefined;
let announce: ((key: string) => void) | undefined;

function apply(ctx: PluginContext): void {
  contribution?.dispose();
  contribution = undefined;
  if (localStorage.getItem(STORAGE_KEY) === '1') {
    contribution = ctx.contributeTheme({ '--lw-brand': '#ea580c' });
  }
}

// in activate(ctx):  apply(ctx)  — the flag survives the reload, the contribution is re-made
// in your toggle:    write the flag, apply(ctx), then announce?.(STORAGE_KEY) for cross-tab sync
// the distribution opts the key into sync: myTheme.connectSync = ({ announce: a }) => {
//   announce = a; return { key: STORAGE_KEY, refresh: () => apply(boundCtx) }; }
```

## Where next

- [Authoring a weaver](../authoring-a-weaver.md): the map of these pages.
- [Samples](../samples.md): complete recipes to copy.
