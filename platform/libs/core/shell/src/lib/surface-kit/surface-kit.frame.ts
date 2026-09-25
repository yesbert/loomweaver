import {
  hasIcon,
  removeIcon,
  sanitizeIconSvg,
  setIcon,
} from '../elements/icon/icon-registry';
import { defineLwElements } from '../elements/lw-elements';
import { applySurfaceState } from './surface-render-state';
import { captureSelf } from './surface-self-capture';
import { createState } from './surface-state-mirror';

export interface LwSurfaceRenderState {
  readonly theme?: 'light' | 'dark';
  readonly tokens?: Readonly<Record<string, string>>;
  readonly rootFontSize?: string;
  /** The product's replacement glyphs, so `<lw-icon>` here draws what the chrome next to it draws. */
  readonly icons?: Readonly<Record<string, string>>;
}

/** The host methods a surface's Penpal connection exposes for the plugin's own store. */
export interface LwStateHost {
  stateWatch(key: string): unknown;
  stateSet(key: string, value: unknown): unknown;
  stateClear(key: string): unknown;
  stateUnwatch(key: string): unknown;
}

/**
 * The surface-side half of `ctx.state`: the handle itself cannot cross the RPC boundary, so the host
 * keeps it and pushes every change. This mirrors the pushes into the same shape a trusted plugin
 * holds — `value`/`loaded`/`set`/`clear`/`dispose` — so one contract reads the same on both rungs.
 */
export interface LwStateHandle<T = unknown> {
  value(): T | undefined;
  loaded(): boolean;
  set(next: T): void;
  clear(): void;
  dispose(): void;
  /** Called after every push for this key, so the surface can re-render. */
  onChange(listener: (value: T | undefined, loaded: boolean) => void): void;
}

export interface LwStateApi {
  watch<T = unknown>(key: string): LwStateHandle<T>;
  /** Feed the host's `stateChanged(key, value, loaded)` push in from your `methods`. */
  apply(key: string, value: unknown, loaded: boolean): void;
}

export interface LwSurfaceCaptureRequest {
  /** Picture pixels per CSS pixel. Bounded to 0.05..4; the frame's own ratio when absent. */
  readonly scale?: number;
  /**
   * The form to encode the drawing in — `image/png`, `image/jpeg` or `image/webp`. The workbench
   * sends the form the finished picture will be carried in, so a surface is not encoded losslessly
   * only to be compressed again. Lossless when absent.
   */
  readonly mediaType?: string;
  /** How strongly to compress, 0 to 1. Ignored by a lossless form. */
  readonly quality?: number;
  /** What a withheld area says on the picture. The workbench sends it already translated. */
  readonly withheldLabel?: string;
}

/**
 * Mark an element with this attribute and its content stays off any picture of the workbench; the
 * area says so instead. It is read at the moment a picture is made, so setting or clearing it takes
 * effect at once and a surface is never told that it is being pictured.
 *
 * Marking the surface's own root does nothing: a surface cannot withhold itself as a whole, only
 * parts of itself.
 */
export const LW_WITHHOLD_ATTRIBUTE = 'data-lw-withhold';

/** What a surface hands back when the workbench asks it to draw itself. */
export interface LwSurfaceCapture {
  /** The drawing, as a `data:` URL. A function or a live handle could not cross the boundary. */
  readonly image: string;
  readonly width: number;
  readonly height: number;
}

/** The shape Penpal expects of the methods a surface exposes to the workbench. */
export type LwSurfaceMethods = Record<string, (...args: never[]) => unknown>;

/** What the workbench may call on a surface without the surface having written it. */
export interface LwPlatformSurfaceMethods {
  capture(request?: LwSurfaceCaptureRequest): Promise<LwSurfaceCapture>;
}

export interface LwFrameApi {
  setIcon(name: string, svg: string): void;
  removeIcon(name: string): void;
  hasIcon(name: string): boolean;
  applySurfaceState(state: LwSurfaceRenderState): void;
  /** Connect the store to the host once your Penpal connection resolves. */
  connectState(host: LwStateHost): LwStateApi;
  readonly state: LwStateApi;
  /**
   * Draws this surface and answers with the result, so that a picture of the workbench holds what
   * the surface was showing instead of a hole where it sits. Expose it from your Penpal `methods`
   * as `capture` and the workbench will call it; it is never called for you.
   *
   * The renderer is fetched the first time a picture is asked for, so a surface that is never
   * captured never pays for it. A surface that is isolated has no origin of its own, which is why
   * the renderer is loaded as a plain script from beside this bundle rather than imported.
   */
  capture(request?: LwSurfaceCaptureRequest): Promise<LwSurfaceCapture>;
  /**
   * Your own Penpal methods, plus the ones the workbench may call on any surface. Pass it straight
   * to `connect({ methods: LwFrame.surfaceMethods({ render }) })` and a surface answers everything
   * the workbench asks of it, including requests added to the platform after you wrote this.
   *
   * The platform's own names win over yours, so a surface cannot shadow them by accident.
   */
  surfaceMethods<T extends LwSurfaceMethods>(
    own: T,
  ): T & LwPlatformSurfaceMethods;
}

/** @internal The bundle's own bootstrap. Running the script calls it; a consumer never does. */
export function installLwFrame(): LwFrameApi {
  defineLwElements();

  const state = createState();
  const capture = (request?: LwSurfaceCaptureRequest) =>
    captureSelf(request, LW_WITHHOLD_ATTRIBUTE);
  const api: LwFrameApi = {
    setIcon: (name, svg) => setIcon(name, sanitizeIconSvg(svg)),
    removeIcon,
    hasIcon,
    applySurfaceState,
    connectState: (host) => {
      state.connect(host);
      return state;
    },
    state,
    capture,
    surfaceMethods: <T extends LwSurfaceMethods>(own: T) => ({
      ...own,
      capture,
    }),
  };
  (globalThis as Record<string, unknown>)['LwFrame'] = api;
  return api;
}

installLwFrame();
