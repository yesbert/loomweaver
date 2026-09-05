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

export interface LwFrameApi {
  setIcon(name: string, svg: string): void;
  removeIcon(name: string): void;
  hasIcon(name: string): boolean;
  applySurfaceState(state: LwSurfaceRenderState): void;
  /** Connect the store to the host once your Penpal connection resolves. */
  connectState(host: LwStateHost): LwStateApi;
  readonly state: LwStateApi;
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
  };
  (globalThis as Record<string, unknown>)['LwFrame'] = api;
  return api;
}

installLwFrame();
