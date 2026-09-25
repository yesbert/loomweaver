import { Capability } from '@loomweaver/plugin-sdk';
import {
  DEFAULT_ISOLATION_LEVEL,
  PluginIsolationLevel,
  exceedsLevel,
} from '../../foundation/plugin-isolation-level';
import { InstalledPlugin } from '../../plugin-store/lifecycle/installed-plugin';
import { FramePlugin } from './frame-plugin';

export interface RunnableFramePlugin extends FramePlugin {
  readonly granted?: readonly Capability[];
  readonly version?: string;
}

export function levelOf(plugin: RunnableFramePlugin): PluginIsolationLevel {
  return plugin.level ?? DEFAULT_ISOLATION_LEVEL;
}

export function signatureOf(plugin: RunnableFramePlugin): string {
  const sorted = (values: readonly string[] | undefined): string =>
    [...(values ?? [])].toSorted((a, b) => a.localeCompare(b)).join(',');
  return `${plugin.entryUrl}|${sorted(plugin.capabilities)}|${sorted(plugin.granted)}|${plugin.version ?? ''}|${levelOf(plugin)}`;
}

export interface RefusedFramePlugin {
  readonly id: string;
  readonly asked: PluginIsolationLevel;
}

export interface FramePluginSelection {
  readonly runnable: readonly RunnableFramePlugin[];
  readonly refused: readonly RefusedFramePlugin[];
}

export function runnablePlugins(
  composed: readonly FramePlugin[],
  installed: readonly InstalledPlugin[],
  deployed: readonly InstalledPlugin[],
  catalogMaxLevel: PluginIsolationLevel,
): FramePluginSelection {
  const claimed = new Set(composed.map((plugin) => plugin.id));
  const fromCatalog: RunnableFramePlugin[] = [];
  const refused: RefusedFramePlugin[] = [];
  for (const plugin of [...deployed, ...installed]) {
    if (claimed.has(plugin.id)) {
      continue;
    }
    const asked = plugin.level ?? DEFAULT_ISOLATION_LEVEL;
    if (exceedsLevel(asked, catalogMaxLevel)) {
      refused.push({ id: plugin.id, asked });
      continue;
    }
    claimed.add(plugin.id);
    fromCatalog.push({
      id: plugin.id,
      entryUrl: plugin.entryUrl,
      capabilities: plugin.capabilities,
      name: plugin.name,
      granted: plugin.capabilities ?? [],
      version: plugin.version,
      level: asked,
    });
  }
  return { runnable: [...composed, ...fromCatalog], refused };
}
