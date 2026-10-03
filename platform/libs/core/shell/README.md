# @loomweaver/shell

The workbench of [LoomWeaver](https://loomweaver.dev), as an Angular library: the chrome and its
regions, the plugin loader, and the host services plugins reach through `ctx`. It holds no domain
of its own. A distribution composes it with weavers, the plugins that carry the product.

The quickest start is the scaffold, which installs this package and wires a first weaver:

```sh
npx @loomweaver/cli init
```

## Installing it by hand

The shell needs Angular 22 and has its other runtime libraries as peer dependencies:

```bash
npm install @loomweaver/shell @loomweaver/plugin-sdk @angular/cdk @jsverse/transloco @ng-icons/heroicons \
  @angular/service-worker@$(node -p "require('@angular/core/package.json').version")
```

The pin keeps `@angular/service-worker` on the Angular version your workspace already has.

## Using it

Every provider goes into the application's `providers` array, and the root component renders
`<lw-shell />`:

```ts
// src/app/app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideLayout, provideShell, provideShellRouter } from '@loomweaver/shell';
import { provideProductIdentity } from '@loomweaver/plugin-sdk';

export const appConfig: ApplicationConfig = {
  providers: [
    provideShellRouter(),
    provideShell({ serviceWorker: false }),
    provideLayout({
      regions: [
        { id: 'top-bar', type: 'bar', dock: 'top' },
        { id: 'primary', type: 'rail', dock: 'left' },
        { id: 'main', type: 'content', dock: 'center' },
      ],
    }),
    provideProductIdentity({ name: 'My Studio', tagline: 'Weave something great', logoUrl: 'logo.png' }),
  ],
};
```

```ts
// src/app/app.ts
import { Component } from '@angular/core';
import { Shell } from '@loomweaver/shell';

@Component({ selector: 'app-root', imports: [Shell], template: '<lw-shell />' })
export class App {}
```

The shell also needs its styles and its strings served; the setup guide below covers both. Import
only from the package root, never from a path inside it.

## Where to read on

- [Getting started](https://loomweaver.dev/getting-started/): the scaffold, and what it gives you
- [Manual setup](https://loomweaver.dev/manual-setup/): every provider, the style pipeline and the
  asset globs, wired by hand
- [Building a distribution](https://loomweaver.dev/building-a-distribution/): composing weavers,
  branding, auth and persistence
- [Authoring a weaver](https://loomweaver.dev/authoring-a-weaver/): the plugins the shell runs
