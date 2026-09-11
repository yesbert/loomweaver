import { drawAbsent } from '../capture/picture-assembly';
import { captureScale } from '../capture/picture-size';
import { defineLwButton } from './button/lw-button.element';
import {
  hasIcon,
  removeIcon,
  sanitizeIconSvg,
  setIcon,
} from './icon/icon-registry-global';
import {
  defineLwIcon,
  LW_ICON_TAG,
  LwIconElement,
} from './icon/lw-icon.element';
import { defineLwMarkdown } from './markdown/lw-markdown.element';
import { defineLwMenu } from './menu/lw-menu.element';
import { defineLwNavTree } from './nav-tree/lw-nav-tree.element';
import { defineLwProgressRing } from './progress/lw-progress-ring.element';
import { defineLwSelect } from './select/lw-select.element';
import { defineLwTooltip } from './tooltip/lw-tooltip.element';

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

function applySurfaceState(state: LwSurfaceRenderState): void {
  const root = document.documentElement;
  for (const [name, value] of Object.entries(state.tokens ?? {})) {
    root.style.setProperty(name, value);
  }
  if (state.rootFontSize) {
    root.style.fontSize = state.rootFontSize;
  }
  if (state.theme) {
    const dark = state.theme === 'dark';
    root.classList.toggle('dark', dark);
    document.body?.classList.toggle('dark', dark);
  }
  applyIcons(state.icons);
}

function applyIcons(icons: Readonly<Record<string, string>> | undefined): void {
  const entries = Object.entries(icons ?? {});
  if (entries.length === 0) {
    return;
  }
  for (const [name, svg] of entries) {
    setIcon(name, sanitizeIconSvg(svg));
  }
  for (const element of document.querySelectorAll(LW_ICON_TAG)) {
    (element as LwIconElement).refresh();
  }
}

interface Watched {
  value: unknown;
  loaded: boolean;
  readonly listeners: ((value: unknown, loaded: boolean) => void)[];
}

function createState(): LwStateApi & { connect(host: LwStateHost): void } {
  const watched = new Map<string, Watched>();
  let host: LwStateHost | undefined;

  const entryFor = (key: string): Watched => {
    const existing = watched.get(key);
    if (existing) {
      return existing;
    }
    const entry: Watched = { value: undefined, loaded: false, listeners: [] };
    watched.set(key, entry);
    host?.stateWatch(key);
    return entry;
  };

  return {
    connect(next: LwStateHost): void {
      host = next;
      for (const key of watched.keys()) {
        next.stateWatch(key);
      }
    },
    apply(key: string, value: unknown, loaded: boolean): void {
      const entry = entryFor(key);
      entry.value = value;
      entry.loaded = loaded;
      for (const listener of entry.listeners) {
        listener(value, loaded);
      }
    },
    watch<T>(key: string) {
      const entry = entryFor(key);
      return {
        value: () => entry.value as T | undefined,
        loaded: () => entry.loaded,
        set: (next: T) => {
          entry.value = next;
          host?.stateSet(key, next);
        },
        clear: () => {
          entry.value = undefined;
          host?.stateClear(key);
        },
        dispose: () => {
          watched.delete(key);
          host?.stateUnwatch(key);
        },
        onChange: (listener: (value: T | undefined, loaded: boolean) => void) => {
          entry.listeners.push(
            listener as (value: unknown, loaded: boolean) => void,
          );
        },
      };
    },
  };
}

interface SnapdomGlobal {
  readonly snapdom: {
    toCanvas(
      target: Element,
      options: { readonly scale: number },
    ): Promise<HTMLCanvasElement>;
  };
}

const rendererSource = new URL(
  'snapdom.global.js',
  (document.currentScript as HTMLScriptElement | null)?.src ?? location.href,
).href;

let rendererLoad: Promise<void> | undefined;

function loadRenderer(): Promise<void> {
  rendererLoad ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = rendererSource;
    script.addEventListener('load', () => resolve());
    script.addEventListener('error', () => {
      rendererLoad = undefined;
      reject(new Error(`the surface renderer could not be loaded from ${rendererSource}`));
    });
    document.head.append(script);
  });
  return rendererLoad;
}

const WITHHOLD_SELECTOR = `[${CSS.escape(LW_WITHHOLD_ATTRIBUTE)}]`;

function withheldAreas(root: Element): Element[] {
  return [...root.querySelectorAll(WITHHOLD_SELECTOR)].filter(
    (element) =>
      element !== document.body && element !== document.documentElement,
  );
}

function hideWithheld(
  canvas: HTMLCanvasElement,
  root: Element,
  scale: number,
  label: string,
): void {
  const areas = withheldAreas(root);
  if (areas.length === 0) {
    return;
  }
  const context = canvas.getContext('2d');
  if (!context) {
    return;
  }
  const origin = root.getBoundingClientRect();
  for (const area of areas) {
    const rect = area.getBoundingClientRect();
    drawAbsent(
      context,
      (rect.left - origin.left) * scale,
      (rect.top - origin.top) * scale,
      rect.width * scale,
      rect.height * scale,
      label,
    );
  }
}

async function capture(
  request?: LwSurfaceCaptureRequest,
): Promise<LwSurfaceCapture> {
  await loadRenderer();
  const renderer = (globalThis as Record<string, unknown>)['LwSnapdom'] as
    | SnapdomGlobal
    | undefined;
  if (!renderer) {
    throw new Error('the surface renderer did not install itself');
  }
  const target = document.body ?? document.documentElement;
  const scale = captureScale(request?.scale ?? devicePixelRatio);
  const canvas = await renderer.snapdom.toCanvas(target, { scale });
  hideWithheld(canvas, target, scale, request?.withheldLabel ?? '');
  return {
    image: canvas.toDataURL('image/png'),
    width: canvas.width,
    height: canvas.height,
  };
}

/** @internal The bundle's own bootstrap. Running the script calls it; a consumer never does. */
export function installLwFrame(): LwFrameApi {
  defineLwTooltip();
  defineLwSelect();
  defineLwMenu();
  defineLwButton();
  defineLwMarkdown();
  defineLwIcon();
  defineLwProgressRing();
  defineLwNavTree();

  const state = createState();
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
