# Getting started

<!-- derived-from-specs -->
> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/` — for this page: `scaffolding` · `platform-composition`. Where this page and a
> specification disagree, the specification is right, and that is a defect in this page: change
> the behaviour there, then explain it here.

Scaffold a running product in about five minutes: the LoomWeaver chrome, branded, with one plugin of
your own already contributing to it. Every command below was run against a fresh Angular app to
produce exactly what the last step shows. The [live demo](https://demo.loomweaver.dev) runs the same
shell, built the same way.

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

The last argument pins `@angular/service-worker`, a peer dependency of the shell, to the Angular version
you already have; leave it off and the install fails with `ERESOLVE`.
[Manual setup → Install](manual-setup.md#1--install) explains why, and why the version is read from
`node_modules` rather than `package.json`.

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
`src/app/app.css`, and `src/app/app.spec.ts`. That last one now **fails**, because `App` pulls the
whole shell into a bare `TestBed`. Delete it; the generated `app.config.spec.ts` is the replacement
starting point. It tests something worth testing, that the layout still declares the region ids your
contributions target, without mounting anything.

The logo at `public/logo.svg` is the LoomWeaver mark, there so the top bar renders something from the
first run; replace it with your own square image whenever you like. It is the app icon too, and until
you add a 192 and a 512 raster icon the browser does not offer installation: see
[PWA and delivery](distribution/pwa.md).

## 4 · What the scaffold wired

Nothing to do here. This step exists because the wiring is worth knowing about, not because it is
waiting for you. The run you just did named each file it touched and each line it added.

**`.postcssrc.json`**, beside your `package.json`, so Tailwind runs at all. Without it the chrome renders
unstyled while the build reports success ([Styles](manual-setup.md#4--styles)).

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

Each has a reason, told where the manual setup makes the same edit. The i18n glob serves the shell's
own strings ([Serve the host translations](manual-setup.md#5--serve-the-host-translations)). The
frame-kit glob matters only once you host sandboxed plugins ([Frame plugins](distribution/frame-plugins.md)).
`serviceWorker` and `inlineCritical: false` are the PWA side ([PWA and delivery](distribution/pwa.md)).
One trap belongs here: `inlineCritical: false` is not optional, because the generated `index.html`
ships a strict `script-src 'self'` that blocks Angular's inline critical-CSS handler, and the app then
renders unstyled, only in production builds.

The scaffold only **adds**. A setting you had already made is left exactly as you made it, so
re-running a scaffold over a workspace you have configured changes nothing.

> **Don't want Tailwind?** Re-run step 3 with `--styles precompiled` and skip the Tailwind packages
> from step 2; `src/styles.css` becomes one import of the stylesheet we pre-compiled.
> [Bringing your own CSS framework](manual-setup.md#bringing-your-own-css-framework) says what you
> give up and how a Bootstrap theme fits.

When a scaffold cannot do something, the run says so and says what it costs to leave undone.
[Scaffolding](scaffolding.md) lists those cases.

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

Navigating there opens a tab, so the pane draws a tab strip above your surface, as it does for every
routable surface ([The content area](weaver/content-area.md)).

One thing is deliberately empty, and it names the next thing to build: **the home route renders
nothing**, because no surface claims `/` yet.

To put something of your own in the status bar, scaffold with `--bar-item` or copy [one behaviour,
many triggers](samples.md#one-behaviour-many-triggers).

`mod+shift+n` fires the command the scaffold registered, which raises a toast — a placeholder action
on a real shortcut, there to be replaced.

Two shortcuts are the shell's own and work from this first run: **`mod+k`** opens the command
search, **`mod+p`** the search over everything you have open. The scaffold put both on screen as
badges that print their own chord, two lines in your `app.config.ts` and yours to move or delete;
`LOOMWEAVER.md` says how.

That icon in the rail is the whole point: the platform drew every piece of chrome around it, and your
plugin only declared what it wanted to contribute.

Your first production build warns `bundle initial exceeded maximum budget`; raise the budgets in your
build target as [Manual setup → Run](manual-setup.md#7--run) describes.

---

**Next:**

- [Samples](samples.md): complete, copyable recipes for the things you will build next.
- [Authoring a weaver](authoring-a-weaver.md): the full contract behind what you just scaffolded.
- [Manual setup](manual-setup.md): the same app wired by hand, if you want to see every seam.
