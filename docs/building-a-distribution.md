# Building a distribution

<!-- derived-from-specs -->

> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/` — for this page: `platform-composition` · `shell-layout`. Where this page and a specification disagree, the
> specification is right, and that is a defect in this page: change the behaviour there, then
> explain it here.

A **distribution** is your product: a thin app that composes `@loomweaver/shell` + your weaver(s), declares
a layout, grants capabilities and sets branding. It's mostly one file — the composition root.

## The composition root

Everything a distribution is lives in **one providers array**, in `src/app/app.config.ts` — the file
`ng new` and Nx both generate. Every "add this provider" instruction in these guides means that array.
`src/main.ts`, `src/app/app.ts` and `src/app/app.html` stay as generated, except that `App` renders
`<lw-shell />`; see [manual setup](manual-setup.md) for those three files.

```ts
// src/app/app.config.ts
import { ApplicationConfig } from '@angular/core';
import {
  provideShell, provideShellRouter, provideLayout, providePlugins,
  provideTranslationNamespaces, provideCapabilityGrants, type ShellLayout,
} from '@loomweaver/shell';
import { provideProductIdentity } from '@loomweaver/plugin-sdk';
import { notesWeaver } from '@my/notes-weaver';

const layout: ShellLayout = {
  regions: [
    { id: 'top-bar', type: 'bar', dock: 'top' },
    { id: 'primary', type: 'rail', dock: 'left' },
    { id: 'left-panel', type: 'panel', dock: 'left' },
    { id: 'main', type: 'content', dock: 'center' },
    { id: 'right-panel', type: 'panel', dock: 'right' },
    { id: 'status-bar', type: 'bar', dock: 'bottom' },
  ],
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideShellRouter(),   // content-area routing — replaces provideRouter([])
    provideShell(),
    provideLayout(layout),
    provideProductIdentity({ name: 'Notes Studio', tagline: 'product.tagline', logoUrl: 'logo.png' }),
    provideTranslationNamespaces('notes', 'product'),
    // Default-deny: grant the weaver exactly what its manifest declares.
    provideCapabilityGrants({ notes: ['contributions', 'ui', 'host'] }),
    ...providePlugins(notesWeaver),   // variadic, returns an array — note the spread
  ],
};
```

That's the whole product wiring. The shell renders the chrome; the weaver fills it.

## Which door does my decision go through?

There is no single god-provider, on purpose: each decision has its own provider, so the same decision
never has two doors. The whole surface, indexed by what you want, is one page in the reference:
[Composition: the provider surface](distribution-api/composition.md). Everything your own code
can do at runtime is the rest of that area: [Distribution API](distribution-api/index.md).

## Seeing what you composed

In dev mode the shell puts one function on the window. Call it from the browser console once your
app has finished loading:

```
loomweaver.report()
```

It prints the regions your layout declares, the capabilities you switched off and the ids you
omitted, and then warns about the things that quietly land nowhere:

- an `omit` that **matched nothing**, with the prefix you probably meant: omitting `shell.permissions`
  hides a _command or item_ by that id, while the settings section of that name needs
  `setting:shell.permissions`, and the bare form fails in silence
- a settings button or menu entry pointing at a **command no one registers** (or one your own `omit`
  removed): the shell drops the control rather than drawing a dead one, and this says why it vanished

One check does not wait for the console, because it is already decidable at startup. A bar, rail or
view contribution aimed at a region your layout does not declare, or declares with another anatomy,
is warned about immediately, and the warning names the regions of the right type that do exist. That is the
`status` versus `status-bar` mistake, which otherwise ships a product whose status bar is simply
empty.

The report exists in dev only; nothing of it reaches a production build.

## The pages

Each page below holds one area a distribution configures, with the provider that does it. Where a
decision needs the reasoning first, the page names the concept page under `concepts/` that carries it.

- [Layout: regions and docks](distribution/layout.md): `provideLayout`, the regions and their docks, panes and sidebar curation. Why: [Surfaces and panes](concepts/surfaces-and-panes.md).
- [Content-area routing](distribution/content-routing.md): `provideShellRouter`, the pane that carries the address, following tabs. Why: [The address](concepts/the-address.md).
- [Workspaces a product ships](distribution/workspaces.md): `provideWorkspaces`, claims, rail items, unusable workspaces, saved workspaces. Why: [Workspaces](concepts/workspaces.md).
- [Resetting the arrangement](distribution/resetting.md): the workspace reset and the app layout reset, and what each puts back.
- [Switching capabilities off](distribution/switching-capabilities-off.md): `provideShellFeatures`, one switch per gesture and its affordance.
- [Surface retention](distribution/surface-retention.md): the product-wide `retention` default and the unsaved-work question. Why: [Retention and unsaved work](concepts/retention-and-unsaved-work.md).
- [Branding](distribution/branding.md): `provideProductIdentity` and the `--lw-*` tenant theme.
- [Bringing your own CSS framework](distribution/css-frameworks.md): the pre-compiled stylesheet, your framework in a cascade layer, the Bootstrap token mapping and the dark-mode mirror.
- [Capabilities](distribution/capabilities.md): `provideCapabilityGrants`, the Permissions section, `provideRequiredPlugins`. Why: [Capabilities and trust](concepts/capabilities-and-trust.md).
- [Auth integration](distribution/auth.md): `provideAuthSource`, your own login UI, `provideUnauthorizedRedirect`.
- [Persistence stores](distribution/persistence.md): the two `KeyValueStore` ports, the storage-key inventory, identity-scoped stores.
- [Windows and sync](distribution/windows-and-sync.md): cross-tab live sync and pop-out windows, and where a product hooks in.
- [Frame plugins](distribution/frame-plugins.md): `provideFramePlugins`, the frame kit you serve, your CSP. Why: [Capabilities and trust](concepts/capabilities-and-trust.md).
- [Plugin store](distribution/plugin-store.md): `providePluginCatalog`, the catalogue, consent and updates.
- [Icons, translations and rewording](distribution/icons-and-i18n.md): `provideIcons`, translation namespaces, `provideTranslationOverrides`.
- [Recomposing host chrome](distribution/recomposing-chrome.md): replacing, hiding and moving default chrome, the palette entry, curating settings, dropping a route.
- [PWA and delivery](distribution/pwa.md): the service worker, the manifest, and validating the update flow against a build.

[Distribution API](distribution-api/index.md) is what your own code can do once the product runs.
