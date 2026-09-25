import { InjectionToken } from '@angular/core';
import type { Plugin } from '@loomweaver/plugin-sdk';

export type {
  Plugin,
  PluginManifest,
  PluginContext,
  PluginUi,
  UiMenuItem,
  PluginHost,
  PluginSession,
} from '@loomweaver/plugin-sdk';

/** Multi-provider token: each entry is one trusted plugin to activate. */
export const PLUGIN = new InjectionToken<readonly Plugin[]>('PLUGIN');
