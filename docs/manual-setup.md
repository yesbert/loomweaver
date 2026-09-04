# Manual setup

<!-- derived-from-specs -->

> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/` — for this page: `platform-composition` · `shell-layout` · `routing` ·
> `product-identity` · `theming` · `i18n`. Where this page and a specification disagree, the
> specification is right, and that is a defect in this page: change the behaviour there, then
> explain it here.

This page builds the same result as the [scaffolding quickstart](getting-started.md), wired by hand.
It takes about fifteen minutes, and afterwards you know what every file is for. It is also the
reference for adding the shell to an application that already exists, when you would rather not
have a generator rewrite it.

Everything below is something the scaffold would otherwise write for you: the style pipeline, the
asset globs, the service worker and the build settings. It is here because knowing _why_ each exists
is worth fifteen minutes, and because a workspace the generator cannot read leaves you doing exactly
this. The minimal `index.html` below ships no content-security policy; adopt the scaffold's strict
one and you take on the `inlineCritical` build setting with it, which
[Frame plugins](distribution/frame-plugins.md) describes.

> **Prerequisites:** Node 24 and an **Angular 22** workspace, Angular CLI or Nx.

Nothing here is Angular-CLI-specific. Where **Nx** differs it is called out, and there is a section
of its own at the end.

## The shape

The shell **is** an application chrome, but it is an ordinary standalone component, so it does not
replace your application. It renders inside it:

```
src/main.ts              bootstrapApplication(App, appConfig)   ← unchanged from ng new
src/app/app.config.ts    every provider, including all of LoomWeaver's
src/app/app.ts           imports Shell
src/app/app.html         <lw-shell />
```

Keeping `App` buys three things. Nothing generated gets deleted. The shape is identical under the
Angular CLI and Nx. And the third matters most when you read the rest of the documentation:
**every "add this provider" instruction has one address, the `providers` array in
`src/app/app.config.ts`.**

## 1 · Install

```bash
npm install @loomweaver/shell @loomweaver/plugin-sdk @angular/cdk @jsverse/transloco @ng-icons/heroicons \
  @angular/service-worker@$(node -p "require('@angular/core/package.json').version")
npm install -D tailwindcss @tailwindcss/postcss @tailwindcss/typography
```

That last argument pins `@angular/service-worker` to the Angular version your workspace already
has. The package is a peer dependency of the shell. Leave the pin off and npm installs the newest
version instead. That newest version demands the matching, newer `@angular/core` as its _exact_
peer, and the install fails with `ERESOLVE`. The reason: Angular packages peer-depend on each other
by exact version. So the one Angular package your app does not already have is the one npm gets to
choose, and it chooses wrong.

The version comes from **`node_modules`** on purpose. `package.json` holds a range, and its lower
bound is not what is installed: `^22.1.0` resolves to the newest matching patch. Pinning to the
bound asks for an older service worker than your core, which fails the same way.

## 2 · The providers

```ts
// src/app/app.config.ts — replaces the generated contents
import { ApplicationConfig } from '@angular/core';
import {
  provideShell,
  provideShellRouter,
  provideLayout,
  type ShellLayout,
} from '@loomweaver/shell';
import { provideProductIdentity } from '@loomweaver/plugin-sdk';

// Which regions exist and where they dock. Contribution ids target these — a region a plugin
// names but this layout omits renders nothing, silently.
const layout: ShellLayout = {
  regions: [
    { id: 'top-bar', type: 'bar', dock: 'top' },
    { id: 'primary', type: 'rail', dock: 'left' },
    { id: 'left-panel', type: 'panel', dock: 'left' },
    { id: 'main', type: 'content', dock: 'center' },
    { id: 'status-bar', type: 'bar', dock: 'bottom' },
  ],
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideShellRouter(),   // content-area routing — instead of provideRouter([])
    provideShell({ serviceWorker: false }),   // no PWA on this minimal path — see below
    provideLayout(layout),
    provideProductIdentity({
      name: 'My Studio',
      tagline: 'Weave something great',
      logoUrl: 'logo.png',
    }),
  ],
};
```

Four things about the generated file you are replacing:

- **PWA is opt-in on this path, and the switch is that one option.** `provideShell()` registers the
  Angular service worker itself by default. This minimal setup emits no
  `ngsw-worker.js`, so the default registration would 404 in every production build.
  `serviceWorker: false` skips it; `UpdateService.enabled` reports `false` and no update chrome ever
  appears. To _become_ a PWA later, drop the option and add the build side:
  `ngsw-config.json`, the `serviceWorker` build option and a `manifest.webmanifest`. The steps are
  described in [building a distribution → PWA & delivery](distribution/pwa.md).
  The [scaffolded quick start](getting-started.md) ships all of that wired, so there PWA is on.

- **`provideRouter(routes)` goes away.** `provideShellRouter()` calls it for you and takes its place.
  It bundles three things as one unit: `withDisabledInitialNavigation()`, the state-preserving reuse strategy and
  the route sync. One unit means it cannot be half-configured. Pass your own non-content routes as
  `provideShellRouter([...routes])`. `src/app/app.routes.ts` is then unreferenced. Everything else
  about the router is unchanged, which [Routing](reference/routing.md) spells out.
- **`provideBrowserGlobalErrorListeners()` goes away too**: `provideShell()` already includes it,
  and registering it twice means every error is logged twice.
- All three `ProductIdentity` fields are **required**, and `logoUrl` resolves against your served
  root: put a square image at `public/logo.png` or the top bar shows a broken image and the console
  logs a 404.

## 3 · Render the shell

```ts
// src/app/app.ts
import { Component } from '@angular/core';
import { Shell } from '@loomweaver/shell';

@Component({
  selector: 'app-root',
  imports: [Shell],
  templateUrl: './app.html',
})
export class App {}
```

```html
<!-- src/app/app.html — replaces the generated welcome template entirely -->
<lw-shell />
```

The template must be **only** this. The generated one ends in a `<router-outlet />`, and the shell
renders its own outlet. Two primary outlets at the same level is not a configuration the router
supports.

The shell sizes itself to the viewport (`100vh`), so it does not care how deeply it is nested or
whether `App` has styles; `styleUrl: './app.css'` can stay or go.

> **The generated `app.spec.ts` now fails.** Not for the reason you would guess, the missing
> heading, but with `NG0201: No provider found for InjectionToken TRANSLOCO_TRANSPILER`. `App` now
> instantiates the shell. A bare `TestBed` therefore has to satisfy the shell's whole dependency
> graph. Delete the spec. Test your own components, not the composition root.

## 4 · Styles

```css
/* src/styles.css */
@import 'tailwindcss';

/* LoomWeaver design tokens + theme (light/dark, brand colors). */
@import '@loomweaver/shell/styles/theme.css';

@plugin '@tailwindcss/typography';

/* Generate the utility classes the shell (and your own components) use. */
@source '../node_modules/@loomweaver/shell';
@source './app';
```

```jsonc
// .postcssrc.json — new file next to package.json
{ "plugins": { "@tailwindcss/postcss": {} } }
```

**Count the `../` hops carefully.** `@source` is resolved from _this file_, so the path depends on
how deep the stylesheet sits. From `src/styles.css` in a single application it is
`../node_modules/…`. From `apps/studio/src/styles.css` in a monorepo it is
`../../../node_modules/…`. Get it wrong and nothing errors. Tailwind simply emits none of the
shell's classes, and the app renders unstyled.

Only ever use **semantic tokens** (`bg-surface`, `text-content`, `text-brand`, `border-border`) in
your own templates, never raw palette colours. See [design tokens](reference/design-tokens.md).

### Bringing your own CSS framework

Tailwind is how the shell is _built_, not something it imposes on you. If your product is themed
with Bootstrap, Bulma or hand-written CSS, import the pre-compiled `@loomweaver/shell/styles/shell.css`
instead and skip everything above. The framework then has to go into a cascade layer, or its
unlayered rules outrank the shell's: [Bringing your own CSS
framework](distribution/css-frameworks.md) has the import order, the token mapping and the dark-mode
mirror.

## 5 · Serve the host translations

The shell fetches its UI strings from `/i18n/{lang}.json` at runtime, so the build has to copy them
out of the package. Add this to your build target's `assets`, which is `angular.json` →
`projects.<name>.architect.build.options` with the Angular CLI and `apps/<name>/project.json` →
`targets.build.options` in Nx:

```jsonc
{ "glob": "**/*", "input": "node_modules/@loomweaver/shell/i18n", "output": "i18n" }
```

## 6 · (Optional) branding and plugin translations

If your `tagline` is a translation key rather than a literal, register a namespace for it, in the
same `providers` array as everything else:

```ts
// src/app/app.config.ts — in the providers array
provideTranslationNamespaces('product'),
```

…and serve `public/i18n/product/en.json` as `{ "tagline": "Weave something great" }`. Host keys
always come from the shell; your namespaces nest under their own name and can never collide with
them. An unknown key renders as-is, so a plain string in `tagline` works too.

## 7 · Run

```bash
ng serve
```

You should see the neutral chrome branded as _My Studio_, and nothing in it, because no plugin is
loaded yet. [Authoring a weaver](authoring-a-weaver.md) fills it; [samples](samples.md) has complete
recipes to copy.

Your first production build will warn `initial exceeded maximum budget` against Angular's 500 kB
default. The shell is a full application chrome; raise the budget in your build target to a size that
suits your product. It is a warning, not an error.

<a id="loomweaver-and-nx"></a>

## LoomWeaver and Nx

Nx is the common case for Angular monorepos and nothing about LoomWeaver works differently there. Its
Angular application generator produces the same `main.ts` / `app.ts` / `app.config.ts` / `app.html`
shape the Angular CLI does, so every step above applies verbatim. Four differences:

|                                 | Angular CLI                                                | Nx                                                        |
| ------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------- |
| Build configuration             | `angular.json` → `projects.<name>.architect.build.options` | `apps/<name>/project.json` → `targets.build.options`      |
| `@source` depth in `styles.css` | `../node_modules/…`                                        | `../../../node_modules/…` from `apps/<name>/src/`         |
| Assets `input` paths            | relative to the workspace root                             | the same — already workspace-relative                     |
| Generators                      | `@loomweaver/cli`                                          | `@loomweaver/devkit` (`nx g @loomweaver/devkit:weaver …`) |

A generated project carries **no Nx tags**, because tag names only mean something inside your own
`depConstraints`. If your workspace enforces module boundaries, as the Nx Angular template does, the
first `nx lint` after composing a weaver says _"a project without tags matching at least one
constraint cannot depend on any libraries"_. Give the new projects tags your constraints allow, with
`--tags` when generating or in `project.json` afterwards. The scaffold deliberately does not relax
that rule for you.

In an Nx workspace prefer **[`@loomweaver/devkit`](scaffolding.md#the-nx-generators--loomweaverdevkit)** over
the CLI. It is the only adapter that can _change_ files as well as write them. It registers the
project, adds the tsconfig path alias and wires the translation assets glob into the composing
application. The CLI can only describe those steps.

<a id="ssr-server-side-rendering"></a>

### SSR (server-side rendering)

The shell is **client-rendered**: it registers custom elements, reads `localStorage` and queries
`matchMedia` while it boots. Nx's Angular template enables SSR by default, which is fine. Mark the
routes client-rendered rather than trying to render the chrome on a server:

```ts
// apps/<name>/src/app/app.routes.server.ts
import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: '**', renderMode: RenderMode.Client },
];
```

Generating the application with SSR switched off does the same job with fewer files.

### Module Federation

Nx supports [Module Federation](https://nx.dev/docs/technologies/module-federation/concepts/module-federation-and-nx)
for Angular, and Angular has its own
[Native Federation](https://www.npmjs.com/package/@angular-architects/native-federation) line. **Neither
is how LoomWeaver loads plugins**, and neither is tested as a plugin transport:

- A **weaver is composed at build time**: you import it and pass it to `providePlugins`. There is no
  federated remote in that path.
- The runtime extension story is a different mechanism entirely: an **iframe-isolated sandboxed
  plugin** talking RPC, plus the plugin store that installs one at runtime. See
  [the plugin system](plugins.md). That boundary exists for isolation, and a federated module,
  sharing your JavaScript context, does not give you that.

If your own application shell already uses federation, LoomWeaver does not stand in the way: within a
host or a remote, `@loomweaver/shell` is an ordinary Angular library, and the steps above are unchanged.
Just do not expect to serve _weavers_ as federated remotes. That is untested, and the supported
answer for third-party code is the sandbox.

---

**Next:** [Authoring a weaver](authoring-a-weaver.md) · [Samples](samples.md) ·
[Building a distribution](building-a-distribution.md), which covers everything else the composition
root can do.
