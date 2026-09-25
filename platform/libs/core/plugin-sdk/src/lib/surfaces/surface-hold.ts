import { InjectionToken } from '@angular/core';

/**
 * An instance-scoped switch a docked surface turns on while its product shows it somewhere the
 * workbench does not draw, such as a window of its own, so the one live instance keeps running there.
 *
 * While it is held, the workbench leaves the instance's rendered nodes where they are: collapsing its
 * panel, switching its view or its workspace neither takes them out of the document, hides them nor
 * puts them back, and the instance is not destroyed for being hidden. Closing still closes: closing the
 * view, turning its plugin off or resetting its arrangement ends it wherever its nodes are.
 *
 * The workbench notices nothing on its own and offers no window or gesture; the product does all of
 * that. Hold before moving the nodes, and release on every way back, including the window closing by
 * itself. On release the workbench treats the instance as if it had never been held: its nodes are put
 * back in its place if that place is visible, and otherwise it is hidden or released as usual.
 *
 * The host provides one per mounted **docked** surface instance running in the page. A **routable**
 * surface has none, and neither has a **sandboxed** one, whose document cannot be moved into another
 * window without reloading.
 */
export interface SurfaceHold {
  /** Whether this instance is held, reactive. */
  readonly held: () => boolean;
  /** Leave this instance's nodes where they are until {@link release}. Calling it again changes nothing. */
  hold(): void;
  /** Hand the instance back to the workbench's ordinary placement. Calling it when not held changes nothing. */
  release(): void;
}

/**
 * DI token for the mounted surface's {@link SurfaceHold}: `const hold = inject(SURFACE_HOLD)`. Injecting it
 * from anything but a docked surface running in the page throws, saying so.
 */
export const SURFACE_HOLD = new InjectionToken<SurfaceHold>('lw.surface-hold', {
  providedIn: 'root',
  factory: () => {
    throw new Error(
      'SURFACE_HOLD is provided only to a docked surface running in the page. A routable surface ' +
        'has none, and a sandboxed surface cannot be moved into another window without reloading.',
    );
  },
});
