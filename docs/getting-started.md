# Getting started

<!-- derived-from-specs -->
> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/` — for this page: `scaffolding` · `platform-composition`. Where this page and a
> specification disagree, the specification is right, and that is a defect in this page: change
> the behaviour there, then explain it here.

Scaffold a running product in about five minutes: the LoomWeaver chrome, branded, with one plugin of
your own already contributing to it. Every command below was run against a fresh Angular app to
produce exactly what the last step shows. The [live demo](https://demo.loomweaver.dev) runs the same
shell, though it is being rebuilt and is thin at the moment.

If you would rather understand each file instead of generating it, [set it up by
hand](manual-setup.md) — same result, roughly fifteen minutes, and it explains what the generators
write.

> **Prerequisites:** Node 24 and an **Angular 22** workspace. Both flavours work and nothing below is
> specific to either: the **Angular CLI** (`ng new`) and **Nx** (`nx g @nx/angular:application`)
> generate the same application shape. Where they differ — one file name, one path — it is called
> out. See also [LoomWeaver and Nx](manual-setup.md#loomweaver-and-nx).

## 1 · An application to put it in

```bash
ng new my-studio --style=css --ssr=false
cd my-studio
```

Already have an application (Angular CLI or Nx)? Skip this step and run the rest inside it.

`--ssr=false` because the shell is a **client-rendered** application chrome. If your workspace has
SSR switched on — the Nx Angular template does — see [SSR](manual-setup.md#ssr-server-side-rendering);
it is one line, not a blocker.

## 2 · Install the platform

```bash
npm install @loomweaver/shell @loomweaver/plugin-sdk @angular/cdk @jsverse/transloco @ng-icons/heroicons \
  @angular/service-worker@$(node -p "require('@angular/core/package.json').version")
npm install -D tailwindcss @tailwindcss/postcss @tailwindcss/typography
```

These are runtime dependencies of your application, not dev tooling: `@angular/cdk` powers drag-drop
reorder and accessibility, Transloco the translations, `@ng-icons/heroicons` the first-party icon
set. Tailwind is build-time only.

The last argument pins `@angular/service-worker` — a peer dependency of the shell — to the Angular
version you already have. Leave it off and the install fails with `ERESOLVE`: Angular packages
peer-depend on each other by *exact* version, so the one Angular package your app does not already
have is the one npm gets to choose, and it picks the newest, which demands a newer `@angular/core`
than your workspace pins.

Note that it reads the version from **`node_modules`**, not from `package.json`. What stands in
`package.json` is a range — `^22.1.0` — and its lower bound is not what npm installed: a fresh
`ng new` resolves that range to the newest matching patch. Pinning to the bound therefore asks for
an older service worker than the core you have, which is the same `ERESOLVE`, arrived at from the
other side.

## 3 · Scaffold the distribution

A **distribution** is your product: the composition root that assembles the platform into something
shippable.

```bash
npx @loomweaver/cli distribution --name my-studio --title "My Studio" --out . --force
```

It writes eleven files and **deletes nothing**:

```
src/main.ts              bootstraps App with appConfig  (Angular's own shape)
src/app/app.config.ts    ← everything your product is made of lives here
src/app/app.config.spec.ts
src/app/app.ts           renders <lw-shell /> inside <app-root>
src/app/app.html
src/index.html           title, CSP, manifest link
src/styles.css           Tailwind + the LoomWeaver theme
ngsw-config.json
public/logo.svg          placeholder mark, so the top bar has something to show
public/manifest.webmanifest
LOOMWEAVER.md            what was written, and the little that is still yours
```

It also **wires your workspace**, which is step 4 below; the run names every file it touched.

`--force` is what lets it replace the six of those that a generated app already has — all of them
bootstrap wiring `ng new` just produced. Nothing you wrote is at risk: the scaffold keeps its own
notes in `LOOMWEAVER.md` precisely so it never touches your `README.md`. Run it without `--force`
first if you want the list; the CLI names each file it would replace and writes nothing.

Three files from `ng new` are now unreferenced: `src/app/app.routes.ts` (the shell owns content
routing, and [Routing](reference/routing.md) shows that the router itself is unchanged),
`src/app/app.css`, and `src/app/app.spec.ts` — that last one now **fails**, because `App`
pulls the whole shell into a bare `TestBed`. Delete it; the generated `app.config.spec.ts` is the
replacement starting point, and it tests something worth testing (that the layout still declares the
region ids your contributions target) without mounting anything.

The logo the scaffold drops at `public/logo.svg` is the LoomWeaver mark, there so the top bar renders
something from the first run. Replace it with your own square image whenever you like; `logoUrl`
resolves against your served root. That same file is the app icon too — the browser tab reads it and
the manifest names it. One gap is left on purpose, because a scaffold writes text and cannot invent
your artwork: Chromium offers installation only once the manifest names a **192 and a 512 raster**
icon. Until you add those the app runs and caches offline, it just is not offered for installation;
`LOOMWEAVER.md` says exactly what to drop in.

## 4 · What the scaffold wired

Nothing to do here. This step exists because the wiring is worth knowing about, not because it is
waiting for you. The run you just did named each file it touched and each line it added.

**`.postcssrc.json`**, beside your `package.json`, so Tailwind actually runs. Without it your
stylesheet is read as ordinary CSS: the tokens arrive, **no utility class does**, and the chrome
renders unstyled while the build reports success. That is the trap this step used to be.

**Your build target**, in `angular.json` (or `project.json` under Nx), gains four things:

```jsonc
"styles": ["src/styles.css"],
"assets": [
  { "glob": "**/*", "input": "public" },
  { "glob": "**/*", "input": "node_modules/@loomweaver/shell/i18n", "output": "i18n" },
  { "glob": "**/*", "input": "node_modules/@loomweaver/frame-kit/dist", "output": "frame-kit" }
],
```

and, in the **production** configuration:

```jsonc
"serviceWorker": "ngsw-config.json",
"optimization": { "styles": { "inlineCritical": false } }
```

Each earns its place. The **`@loomweaver/shell/i18n` glob** serves the strings the shell fetches at
runtime; without it every label in the chrome renders as its raw translation key and nothing errors.
The **frame-kit** glob only matters if you host sandboxed (iframe) plugins, and until you install
that package it simply matches nothing. **`serviceWorker`** emits the worker `provideShell()` already
registers for you — never add `provideServiceWorker` yourself; to ship no worker at all, drop
`ngsw-config.json` and pass `provideShell({ serviceWorker: false })`. **`inlineCritical: false`** is
not optional: the generated `index.html` ships a strict `script-src 'self'`, and Angular's
critical-CSS pass loads the stylesheet with an **inline `onload` handler** that the policy blocks —
the app then renders completely unstyled, and only in production builds.

The scaffold only **adds**. A setting you had already made is left exactly as you made it, so
re-running a scaffold over a workspace you have configured changes nothing.

> **Don't want Tailwind?** Re-run step 3 with `--styles precompiled` and skip the Tailwind packages
> from step 2 — `src/styles.css` becomes one line, and no style pipeline is written because none is
> needed:
>
> ```css
> /* src/styles.css */
> @import '@loomweaver/shell/styles/shell.css';
> ```
>
> That is the same stylesheet pre-compiled by us — tokens, the `.lw-*` class contracts and every
> utility the shell's own templates use, 67 KB minified. You give up writing Tailwind utilities in
> your own templates; the `--lw-*` tokens stay available to any CSS you write. Themed with
> Bootstrap? `npx @loomweaver/cli theme --name acme --preset bootstrap` writes the token mapping too.
> See [bringing your own CSS framework](manual-setup.md#bringing-your-own-css-framework) — the
> cascade layer it describes is not optional.

What a scaffold cannot do is written where it happens: a style configuration written as JavaScript
cannot be merged into, a workspace it cannot find has nothing to wire, and where several projects
could be the target it names them rather than choosing. In each case the run says so, and says what
it costs to leave undone. If you would rather see every seam by hand, [manual
setup](manual-setup.md) writes all of it yourself.

## 5 · Scaffold a weaver

A **weaver** is a plugin — where all your own UI and logic live.

```bash
npx @loomweaver/cli weaver --id notes --command --shortcut 'mod+shift+n' --out src/notes
```

Write the chord with the **`mod`** token rather than `cmd` or `ctrl`; the host binds and displays it
per platform. You get a manifest, a routable surface, a rail item, a command, both translation
bundles and a starter test — with the capabilities it needs already declared.

## 6 · What the weaver scaffold wired

Also nothing to do. The weaver scaffold registered the plugin for you, in **`src/app/app.config.ts`**:

```ts
import { notesPlugin } from '../notes/src';

    provideTranslationNamespaces('notes'),
    provideCapabilityGrants({ notes: ['contributions', 'ui', 'navigation'] }),
    ...providePlugins(notesPlugin),
```

The grants are exactly what the weaver's own manifest declares, because the broker is default-deny:
an ungranted plugin throws `CapabilityError` rather than quietly doing less. It also added the assets
glob that serves the weaver's translations and the `@source` entry that emits the utilities its
templates use.

It does this only while the composition root still presents the shape the distribution scaffold
generated, since that is the file whose shape we know. Once you have reshaped it, the scaffold does
not guess: it leaves the file untouched, prints the lines above, and says the plugin was **not**
registered.

## 7 · Run

```bash
ng serve
```

You get the branded chrome: a top bar with your name, logo and the theme and language controls, an
activity rail on the left with **your weaver's icon in it**, and a collapsible sidebar on each side.
Click that icon and the app navigates to `/notes`, where your surface fills the content area.

The status bar along the bottom shows the running version, which the shell contributes itself.

Navigating there opens a tab for it, so the pane draws a tab strip above your surface — that is the
rule for every routable surface; only one that declares `chromeless: true` fills the area without a
strip. See [content area](authoring-a-weaver.md#content-area--routes--tabs).

One thing is deliberately empty, and it names the next thing to build: **the home route renders
nothing**, because no surface claims `/` yet.

To put something of your own in the status bar, scaffold with `--bar-item` or copy [one behaviour,
many triggers](samples.md#one-behaviour-many-triggers).

`mod+shift+n` fires the command the scaffold registered, which raises a toast — a placeholder action
on a real shortcut, there to be replaced.

Two shortcuts are the shell's own and work from this first run: **`mod+k`** opens the command
search, **`mod+p`** the search over everything you have open (`mod` is ⌘ on macOS, Ctrl elsewhere).
You do not have to remember them, because the scaffold put both on screen: the badge at the right of
the top bar is the command search, the one at the left of the status bar is quick-open, and each
prints its own chord. Both badges are two lines in your `app.config.ts` and yours to move or delete;
`LOOMWEAVER.md` says how, and how to drop either search altogether.

That icon in the rail is the whole point: the platform drew every piece of chrome around it, and your
plugin only declared what it wanted to contribute.

Your first production build warns `bundle initial exceeded maximum budget` against Angular's 500 kB
default. The shell is a whole application chrome, so raise the budgets in your build target —
`maximumError` sits at 1 MB and a product of any size will reach it.

---

**Next:** [Samples](samples.md) — complete, copyable recipes for the things you will build next ·
[Authoring a weaver](authoring-a-weaver.md) — the full contract behind what you just scaffolded ·
[Manual setup](manual-setup.md) — the same app wired by hand, if you want to see every seam.
