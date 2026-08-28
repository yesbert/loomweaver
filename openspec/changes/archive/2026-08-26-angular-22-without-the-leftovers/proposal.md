> **Status:** approved.

## Why

This codebase is unusually current: zero `NgModule`, zero `*ngIf`/`*ngFor`, zero `@Input`/`@Output`
decorators, zero `@HostBinding`/`@HostListener`, zero `ngClass`/`ngStyle`, zero `standalone: true`.
The migration to Angular 22 idiom is essentially complete.

Three leftovers remain, and each is now the opposite of idiomatic rather than merely dated.
`ChangeDetectionStrategy.OnPush` is set explicitly in 83 places; the framework documentation states
plainly that **OnPush is the default strategy since v22**, and the official guidance is not to set it.
Every one of those lines now says something the framework already guarantees, which is exactly the
kind of line that later reads as a deliberate exception. Alongside that, 70 services still use
`@Injectable({ providedIn: 'root' })` where v22 offers `@Service`, and three constructor injections
survive where the house rule is `inject()`.

`.claude/CLAUDE.md` already lists `@Service` and `inject()` as binding. Adoption is zero and three
respectively, so this is a stated rule the code does not follow.

## What Changes

- Remove the explicit `changeDetection` on every component that sets it to `OnPush`, and the now
  unused `ChangeDetectionStrategy` imports with it.
- Convert `@Injectable({ providedIn: 'root' })` to `@Service`, leaving the injectables that are
  deliberately not root-provided alone.
- Replace the three remaining constructor injections with `inject()`.

Nothing a consumer can observe changes. The change detection strategy is the same one, stated by the
framework instead of by us.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. Change detection behaviour is identical, because the value being removed is the value the
framework already applies. `.openspec.yaml` therefore sets `skip_specs: true`.

## Impact

Counted on `main` today:

| Leftover | Platform | Demo |
|---|---|---|
| explicit `ChangeDetectionStrategy.OnPush` | 75 | 8 |
| `@Injectable({ providedIn: 'root' })` | 70 | 0 |
| `@Injectable(...)` not root-provided | 2 | 0 |
| `constructor(private ...)` | 3 | 0 |
| `@Service` | 0 | 0 |

The three constructor injections are
`platform/libs/tooling/devkit/src/recipes/settings-store/recipe.ts`,
`platform/libs/core/shell/src/lib/persistence/boot-latched-scope.ts` and one inside
`regions/pane/surface-close-guard.spec.ts`.

**The two non-root injectables stay `@Injectable()`.** `@Service` provides application-wide by
default; a class that is deliberately provided by hand — `ShellErrorHandler` is one, wired as
`{ provide: ErrorHandler, useClass: ShellErrorHandler }` — is not a root singleton and must not be
converted. Getting this wrong would change where instances come from, which is the one way this
otherwise mechanical change could alter behaviour.

**Verified against the framework, not from memory.** The Angular 22 documentation for
`ChangeDetectionStrategy` states: *"ChangeDetectionStrategy.OnPush is the default strategy (since
v22)."* The Angular CLI best-practices guide for this workspace states: *"Do NOT set
`changeDetection: ChangeDetectionStrategy.OnPush` explicitly"* and *"Prefer the `@Service` decorator
over `@Injectable({providedIn: 'root'})` for new singleton services (Angular v22+)."*

**Scaffold output is in scope.** `@loom/devkit`'s recipes emit components into consumer projects.
Whatever they emit teaches the idiom, so a recipe that writes an explicit `OnPush` teaches a
leftover.

This change dissolves no decision record.
