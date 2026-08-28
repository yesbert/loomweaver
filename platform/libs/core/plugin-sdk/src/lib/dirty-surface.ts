/**
 * Implemented by a surface **component instance** to take part in the retention/close protocol
 *. It lives on the instance, not on the {@link Surface} declaration, because one
 * declaration can back many open tabs (`doc/:id`) and "this tab has unsaved changes" is a question
 * about one instance. The host discovers it structurally — implement the interface and you are in.
 *
 * While {@link surfaceDirty} returns `true` the instance is **never destroyed on hide** (a tab
 * switch, a minimised pane, a collapsed sidebar — no gesture that merely hides is ever blocked or
 * prompted), and **closing asks**: the host shows its own localised "unsaved changes" dialog with
 * *Save* (only when {@link surfaceSave} is implemented) · *Discard* · *Cancel*. Once the instance
 * reports clean again it is released back to the normal retention rule. Two boundaries: a
 * **sandboxed** (`iframe`) surface — which reports dirty by pushing `setDirty(true|false)` over its
 * surface channel — survives gestures that hide it *in place* (tab switch, collapse) but is rebuilt
 * by any gesture that *moves* its element (a split, a drag into another pane, a minimise), because
 * moving an `<iframe>` in the DOM reloads it; and a **pop-out window** closes without the ask — the
 * unsaved-changes protocol guards the main window, a pop-out is a viewer onto the same state.
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
   * The host enforces a timeout with a guaranteed "close anyway" escape, and a hook that throws or
   * rejects counts as approval — a broken or hung veto can never make a tab unclosable
   *. Programmatic destruction (disabling or uninstalling the plugin, resetting or
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
