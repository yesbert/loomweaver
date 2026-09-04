import { Disposable, PluginContext } from '@loomweaver/plugin-sdk';
import { writeLocalStorageBestEffort } from './testbed-storage';

const SUNRISE_THEME: Readonly<Record<string, string>> = {
  '--lw-brand': '#ea580c',
  '--lw-brand-strong': '#c2410c',
  '--lw-brand-fill': '#ea580c',
  '--lw-brand-text': '#b8460d',
  '--lw-accent': '#16a34a',
  '--lw-accent-strong': '#15803d',
  '--lw-surface': '#fff8ec',
  '--lw-surface-raised': '#ffffff',
  '--lw-surface-overlay': '#fdeccd',
  '--lw-border': '#f3ddba',
  '--lw-content': '#42260f',
  '--lw-content-muted': '#7c5230',
  '--lw-content-faint': '#98703f',
  '--lw-font-sans': "Georgia, 'Times New Roman', serif",
};

const SUNRISE_THEME_DARK: Readonly<Record<string, string>> = {
  '--lw-brand-text': '#fb923c',
  '--lw-surface': '#1a1206',
  '--lw-surface-raised': '#241a0c',
  '--lw-surface-overlay': '#2e2110',
  '--lw-border': '#3d2c15',
  '--lw-content': '#fde9cf',
  '--lw-content-muted': '#d3a978',
  '--lw-content-faint': '#a07c4f',
};

const STORAGE_KEY = 'testbed.theme.plugin';

const state: { ctx: PluginContext | null; handle: Disposable | null } = {
  ctx: null,
  handle: null,
};

let announce: ((key: string) => void) | undefined;

function isOn(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function apply(): void {
  const on = isOn();
  if (on && !state.handle && state.ctx) {
    state.handle = state.ctx.contributeTheme(SUNRISE_THEME, SUNRISE_THEME_DARK);
    return;
  }
  if (!on && state.handle) {
    state.handle.dispose();
    state.handle = null;
  }
}

export function registerTheme(ctx: PluginContext): void {
  state.ctx = ctx;
  apply();

  ctx.registerCommand({
    id: 'testbed.theme.toggle',
    title: 'testbed.theme.toggle',
    icon: 'testbedPalette',
    popout: true,
    run: () => {
      writeLocalStorageBestEffort(STORAGE_KEY, isOn() ? '0' : '1');
      apply();
      announce?.(STORAGE_KEY);
    },
  });
  ctx.registerRailItem({
    id: 'testbed.rail.theme',
    rail: 'primary',
    icon: 'testbedPalette',
    title: 'testbed.theme.toggle',
    anchor: 'bottom',
    order: -5,
    command: 'testbed.theme.toggle',
  });
}

export function releaseTheme(): void {
  state.handle = null;
  state.ctx = null;
}

export const testbedTheme = {
  connectSync(hooks: { announce(key: string): void }): {
    key: string;
    refresh(): void;
  } {
    announce = hooks.announce;
    return { key: STORAGE_KEY, refresh: () => apply() };
  },
};
