/**
 * Implemented by a surface **component instance** that can hold unsaved changes. It lives on the
 * instance, not on the {@link Surface} declaration, because one declaration can back many open tabs
 * (`doc/:id`); the host finds it structurally, so implementing the interface is enough.
 *
 * While {@link surfaceDirty} returns `true` the instance is **never destroyed on hide**, and
 * **closing asks**: the host shows its own *Save* (only when {@link surfaceSave} is implemented) ·
 * *Discard* · *Cancel* dialog. Moving its tab to another pane asks the same, because the tab is
 * built anew there. A dialog body opened through `open` takes part the same way; a footer
 * button with a `value` and `DialogRef.close` close without asking. A sandboxed surface reports over
 * its channel with `setDirty`, and a pop-out window closes without asking.
 */
export interface DirtySurface {
  /**
   * Veto hook for a **user-initiated close** of this instance (tab ×, `Delete`, close pane, close
   * others/all/to the right, `ctx.closeContentTab`). Return `false` to cancel the close, `true` to
   * let it continue — a surface may draw its own dialog first and resolve the returned promise with
   * the user's answer. It runs **before** the host's unsaved-changes dialog, and a `true` result
   * does not bypass it: an instance that is still dirty afterwards still gets the standard
   * *Save · Discard · Cancel* ask, so approving the close never discards silently.
   *
   * The host consults it the same way when the user moves the instance's tab to another pane, or
   * when the tab is handed to a neighbouring pane because its own pane closes or a split is undone:
   * the tab is built anew there, so this instance ends. A `false` result leaves the tab where it was.
   *
   * The host enforces a timeout with a guaranteed escape that lets the user go ahead anyway, and a
   * hook that throws or rejects counts as approval, so a broken or hung veto can never make a tab
   * unclosable or unmovable.
   * Programmatic destruction (disabling or uninstalling the plugin, resetting or
   * switching the workspace) does **not** consult this hook; only the unsaved-changes dialog guards
   * those, because a plugin must not be able to veto its own removal.
   */
  surfaceBeforeClose?(): boolean | Promise<boolean>;
  /**
   * Unsaved changes? The host reads this **reactively** — read your own signals inside so the host
   * notices the moment the instance becomes clean (a surface that stays "dirty" forever is a leak).
   * A save in flight keeps this `true` until the save has actually succeeded — that is what makes
   * fire-and-forget saving safe.
   */
  surfaceDirty(): boolean;
  /**
   * Persists the unsaved changes. Optional: without it the host's close dialog offers only
   * *Discard* / *Cancel*. Also the target of the declaration-level `saveOn: 'hide'`
   * ({@link SurfaceBase.saveOn}). A rejection keeps the instance dirty and therefore alive — the
   * host reports the failure, it never discards silently.
   */
  surfaceSave?(): Promise<void>;
}
