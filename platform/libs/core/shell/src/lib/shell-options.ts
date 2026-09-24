import { RetentionDefault } from './regions/pane/retention/retention-policy';
import { PaddingDefault } from './foundation/surface-padding';

/** Options a distribution can pass to {@link provideShell}. */
export interface ShellOptions {
  /**
   * Contribution ids to hide — a distribution drops a default it does not want (e.g.
   * `['shell.language']`). A **lasting** filter, not a one-time delete: an id a plugin
   * registers later stays hidden too. To *replace* a default instead of hiding it, register
   * your own contribution with the same id (last-in wins) and do **not** omit it.
   *
   * Covers **every** contribution kind. Chrome — commands, views, bar items, rail items — is
   * addressed by bare id. The other kinds carry a **prefix**, because ids from different kinds may
   * coincide and there is exactly one shared omit set: an unprefixed omit stays chrome-only and never
   * silently takes a same-named contribution of another kind with it (`shell.language`, for one, is
   * both a top-bar item and a settings row).
   *
   * - `menu:<commandId>` — one menu entry, leaving the command itself (palette/shortcut) alive.
   * - `setting:<id>` — a whole section (`'setting:shell.permissions'`) or a single row
   *   (`'setting:shell.textSize'`); a section left without rows disappears.
   * - `route:<surfaceId>` — a routable surface's content route. It leaves the tab strip,
   *   the auto-open on deep-link and the pane target picker; its URL renders a neutral "not available
   *   here" placeholder rather than falling back to home, so a shared deep-link explains itself.
   *   Addressed by the surface **id**, while a route is *overridden* by its `path` (registering your
   *   own surface on the same path wins) — two handles, deliberately, for two different operations.
   */
  readonly omit?: readonly string[];

  /**
   * Whether to register the application's service worker — `true` by default, and inert in dev
   * either way. The shell owns the registration so that the update badge, the update
   * toast and `ctx.host.checkForUpdate()` work in a distribution that only ships the build
   * artefacts; you do **not** add `provideServiceWorker` yourself.
   *
   * Pass `false` when your build emits no `ngsw-worker.js` (no `serviceWorker` option in the build
   * target). Registration would otherwise 404 in production and log a failure. Nothing else
   * changes: `UpdateService` injects `SwUpdate` optionally, so it simply reports
   * {@link UpdateService.enabled} as `false` and never offers an update.
   *
   * `@angular/service-worker` stays a peer dependency regardless — the opt-out removes the
   * registration, not the import.
   */
  readonly serviceWorker?: boolean;

  /**
   * The app-wide retention default for **hidden** surfaces: `'destroy'` (the default) destroys a
   * hidden, clean surface, so state that must survive belongs in `VIEW_STATE`; `'retain'` keeps
   * every hidden instance alive at the price of memory growing with every surface ever shown. A
   * surface's own `retain: 'always' | 'never'` declaration wins over this default. `iframe` and
   * `container` surfaces are always rebuilt regardless.
   *
   * This is a storage policy for the developer, not a capability the user can see, which is why it
   * lives here rather than in `provideShellFeatures`.
   */
  readonly retention?: RetentionDefault;

  /**
   * The app-wide inset default for surfaces: `'none'` (the default) hands every surface the full
   * area of the pane it is mounted in, so what stands between its content and the pane edge is
   * whatever the surface itself draws; `'inset'` insets every surface the product composes, which
   * is comfortable for the prose, forms and lists most surfaces are.
   *
   * A surface's own `padded` declaration wins over this default, in both directions: a surface may
   * ask to be inset where the product asks for nothing, and to be flush where the product asks for
   * an inset. The declaration travels with the surface, so it holds at every mount point.
   *
   * Only whether there is an inset is settled here. How wide it is stays a styling question, so a
   * product that wants a different amount writes plain unlayered CSS rather than asking for a
   * token.
   */
  readonly padding?: PaddingDefault;

  /**
   * Whether the workbench announces updates itself — `true` by default. With `false` it shows no
   * notice about a waiting version, a current one, a check it could not answer, a failed
   * installation or broken offline storage, for a manual check and its own background checks alike,
   * and the distribution draws the answer instead.
   *
   * Nothing else is withheld: `UpdateService.checkForUpdate()` reports what it found,
   * `UpdateService.lastCheck` carries the last check the workbench made including its own,
   * `updateAvailable` still drives whatever marker you keep, and `activateUpdate()` still applies.
   */
  readonly announceUpdates?: boolean;

  /**
   * The languages the workbench serves, by language code, as the whole set: add a language the
   * workbench does not ship, leave one out, or name neither English nor German. Omit it to serve the
   * shipped `['en', 'de']`. Codes are canonicalised (`pt-br` is `pt-BR`) and a code declared twice is
   * served once; an empty list or something that is not a language code throws here.
   *
   * The set decides what is loaded, what the switcher offers, what a stored or browser preference may
   * select and what `<html lang>` declares. For a language the workbench does not ship, serve the
   * workbench's strings at `/i18n/<code>.json`; a string missing there is shown in English and named
   * in development.
   */
  readonly languages?: readonly string[];
}
