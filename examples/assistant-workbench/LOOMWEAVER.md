# Assistant Workbench — a LoomWeaver distribution

The composition root that assembles the platform into a shippable product. It renders the bare
shell out of the box; add your weavers and branding below. Your own README is untouched — the
scaffold writes its notes here so it can never overwrite prose you wrote.

## Run it

In an Nx workspace (the generator wired the project):

```sh
nx serve assistant-workbench
```

Scaffolded over the CLI or MCP, these files are sources without build wiring — drop them into
an application you already serve (`ng new`, or an Nx application). They keep Angular's own
shape: `main.ts` bootstraps `App`, `App` renders `<lw-shell />`, and everything this product is
made of lives in `app.config.ts`. Nothing of the generated app is deleted. Over an existing
application `--force` replaces exactly the files above — all of them bootstrap wiring, none of
them content you authored. Under Nx it additionally merges the build targets into that
project's `project.json`, keeping the targets, `implicitDependencies` and tags it already had.

Two leftovers from `ng new` are no longer referenced and can go: `src/app/app.routes.ts` (the
shell owns content routing via `provideShellRouter()`) and `src/app/app.css`. The generated
`src/app/app.spec.ts` now fails — `App` pulls the whole shell into a bare `TestBed` — so delete
it and test your own components instead of the composition root.

The project is generated **untagged**: Nx tags belong to your `depConstraints`, and inventing
one would fail a lint policy you never opted this project into. If your workspace enforces
module boundaries, give it tags your constraints allow — `--tags` at generation time, or
`tags` in `project.json` afterwards.

## Compose weavers + branding (in `src/app/app.config.ts`)

The layout is already there. Adding a weaver is three providers plus its import — note the
**spread**, since `providePlugins` is variadic and returns an array:

```ts
import { providePlugins, provideCapabilityGrants, provideTranslationNamespaces } from '@loomweaver/shell';
import { notesPlugin } from '@acme/notes-weaver';   // Nx: the workspace alias; otherwise a relative path

    provideTranslationNamespaces('notes'),
    provideCapabilityGrants({ notes: ['contributions', 'ui', 'navigation'] }),
    ...providePlugins(notesPlugin),
```

Grant exactly what the weaver's manifest declares — the broker is default-deny, so an ungranted
plugin throws `CapabilityError` instead of quietly doing less. A weaver also needs its
translations served: add an assets glob for its `src/lib/i18n` under `i18n/<id>` (the Nx
generator does this for you).

`public/logo.svg` is the LoomWeaver mark, dropped in as a placeholder so the top bar renders
something from the first run instead of a broken image. Replace it with your own — any square
image will do; `logoUrl` resolves against your served root. `tagline` is a
translation key that falls back to rendering itself, so the literal above works but makes
Transloco log a missing-translation warning in dev; point it at a key of your own to silence it.

That same file is also the **app icon**: the browser tab reads it, and the manifest names it so
the app has an icon at all. One gap is left on purpose, because a scaffold writes text and
cannot invent your artwork: **Chromium only offers installation once the manifest names a 192
and a 512 raster icon**, and iOS ignores manifest icons entirely in favour of
`apple-touch-icon`. Drop `icon-192.png` and `icon-512.png` next to the logo, add them to the
manifest's `icons` and add an `apple-touch-icon` link to `index.html`, and the app becomes
installable. Until then it runs and caches offline, it simply is not offered for installation.

## The two searches, and the badges that say so

The shell seeds two searches and binds them itself: `mod+k` opens the command search, `mod+p`
the search over open work (`mod` is ⌘ on macOS, Ctrl elsewhere). Both work whether or not you
do anything. What the generated `app.config.ts` adds is only the way to *see* them: a badge in
the top bar for the command search, one at the leading edge of the status bar for open work,
each printing its own chord in the spelling of the platform it runs on.

They are placed apart on purpose. Two identical-looking search badges side by side in the top
bar read as a duplicate rather than as two different things.

```ts
provideCommandPaletteEntry();                          // top bar, end slot, order 5
provideQuickOpenEntry({ bar: 'top-bar', order: 4 });    // …or put it wherever you want
```

A badge never outlives what it opens. Drop the search and its badge goes with it; the same
happens for a session that may not run it. You will not be left with a control that does
nothing. Switching shortcuts off is the one exception: the badge stays and still opens the
search, it simply prints no chord, because nothing here advertises a key that does nothing.

Four things you may want, and the line for each:

```ts
// 1. Keep the search, drop only the badge — it then opens by shortcut alone.
provideShell({ omit: ['shell.commandPaletteEntry', 'shell.quickOpenEntry'] }),

// 2. Drop the search itself. This takes mod+p with it: the chord is derived from the
//    registered command, so removing the command unbinds the key. The badge goes too.
provideShell({ omit: ['shell.quickOpen'] }),

// 3. Make mod+k run something of yours, keeping the shell's id. Last registration wins,
//    so your command replaces the built-in one and inherits its place everywhere.
//    Register it from your own plugin with the id 'shell.commandPalette'.

// 4. Bind mod+k to a command of your own, under your own id.
provideShell({ omit: ['shell.commandPalette'] }),   // …then declare shortcut: 'mod+k' on yours
```

What not to do is the fifth case: declaring `mod+k` on a command of your own while the
built-in one is still registered. Two commands then hold one chord. The shell warns about it in
the console and the later registration wins, but which registration is later is not something
your composition root decides. Omit the built-in, or take its id. Never race it.

## Styles

`src/styles.css` compiles the shell's source theme with Tailwind 4, which is also what lets you
write Tailwind utilities in your own templates. The scaffold wrote `.postcssrc.json` beside your
`package.json` for you, because without it the stylesheet is read as plain CSS: no utility class
is emitted, the workbench renders unstyled, and the build still reports success. The packages are
the one thing left, because a scaffold does not install:

```sh
npm install -D tailwindcss @tailwindcss/postcss @tailwindcss/typography
```

Use **semantic tokens only** in your own templates (`bg-surface`, `text-content`, `text-brand`,
`border-border`), never raw palette colours.

**Count the `../` hops in the `@source` line.** It is resolved from the stylesheet, not from the
workspace root, and the scaffold derived it from where this project sits. Move the project and
nothing errors — Tailwind simply emits none of the shell's classes and the app renders unstyled.

Want none of this? Re-run the scaffold with `--styles precompiled` and you get a one-line
stylesheet that needs no Tailwind at all — the right choice if your product is themed with
Bootstrap, Bulma or hand-written CSS.

## Build wiring

The scaffold did this. Your build target now names the stylesheet, three asset globs, the
service worker and one production setting, and the run that wrote these files listed each one it
added. Anything you had already set was left exactly as you set it.

What each is for, so that nobody removes one as clutter. The **`@loomweaver/shell/i18n` glob**
serves the strings the shell fetches at runtime; without it every label in the chrome renders as
its raw translation key and nothing errors. The **frame-kit** glob only matters if you host
sandboxed (iframe) plugins — until you install that package the glob simply matches nothing.
**`serviceWorker`** emits the worker that `provideShell()` already registers for you (inert in
dev) — never add `provideServiceWorker` yourself, and if you would rather ship no worker at all,
drop `ngsw-config.json` and pass `provideShell({ serviceWorker: false })`, because otherwise the
registration 404s in production. **`optimization.styles.inlineCritical: false`** is not optional:
the `index.html` above ships a strict `script-src 'self'`, and Angular's critical-CSS pass loads
the stylesheet with an **inline** `onload` handler that the policy blocks — the app then renders
completely unstyled, and only in production builds.

One thing is still yours, because the scaffold cannot know your budget: a production build warns
that the initial bundle exceeds Angular's 500 kB default. The shell is a whole application
chrome, so raise the budgets in your build target.

## Ship less than the whole workbench

The shell arrives with every capability on: splitting, dragging tabs between panes, pinning,
stacking views, pop-out windows, keyboard shortcuts, the curation checklists. A product whose
users would be overwhelmed by that switches parts off in the same providers array:

```ts
import { provideShellFeatures } from '@loomweaver/shell';

    provideShellFeatures({
      content: { splitRight: false, splitDown: false, moveTabs: false },
      sidebar: { stackViews: false },
      windows: { popout: false },
    }),
```

A switch takes the **affordance and the gesture**: turning `splitRight` off removes the toolbar
button, the drop edges *and* `mod+\`, so the capability cannot come back through a second door.
Fields merge group by group, so name only what you turn off. The groups are `content`,
`sidebar`, `rail`, `workspaces`, `windows` and `commands`; everything is on by default except
`content.escalate`, the unlabelled double-click cycle on a tab.

That provider is for **gestures**. A command, a bar or rail item, a settings row or a menu entry
is a *contribution* and goes instead — by id — into `provideShell({ omit: [...] })`. Where a
capability is both, the feature switch wins and takes the menu entry with it.

A product backend is optional: implement the settings-store / auth-source ports
(`provideSettingsStore` / `provideAuthSource`, both against the `KeyValueStore` shape)
with your own backend, or keep the local/anonymous defaults for a standalone UI.
Working state stays on `WORKING_STATE_STORE` and never reaches your
settings backend; back it separately with `provideWorkingStateStore` only if
working state should travel across devices.
