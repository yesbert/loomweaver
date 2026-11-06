import { Service } from '@angular/core';
import { Surface } from '@loomweaver/plugin-sdk';
import { normalizePath } from '../../regions/content/content-path';
import { viewPanePath } from '../../regions/pane/tree/pane-address';
import { persistedWorkingState } from '../../persistence/stored-values/persisted-setting';
import { parseRecord } from '../../persistence/stored-values/persisted-record';

export const FRAME_PLUGIN_ADDRESSES_KEY = 'lw.shell.frame-plugin-addresses';

const KEPT_PER_PLUGIN = 100;

type Answered = Readonly<Record<string, readonly string[]>>;

function isAddressList(value: unknown): value is readonly string[] {
  return (
    Array.isArray(value) && value.every((entry) => typeof entry === 'string')
  );
}

@Service()
export class FramePluginAddresses {
  private readonly stored = persistedWorkingState<Answered>(
    FRAME_PLUGIN_ADDRESSES_KEY,
    {
      parse: (raw) => parseRecord(raw, isAddressList),
      serialize: (value) => JSON.stringify(value),
    },
  );

  readonly read = this.stored.answered;

  of(pluginId: string): readonly string[] {
    return this.stored.value()[pluginId] ?? [];
  }

  answered(pluginId: string, surface: Surface): void {
    const address = surface.routable
      ? normalizePath(surface.routable.path)
      : viewPanePath(surface.id);
    if (this.of(pluginId).includes(address)) {
      return;
    }
    this.stored.update((answered) => ({
      ...answered,
      [pluginId]: [...(answered[pluginId] ?? []), address].slice(
        -KEPT_PER_PLUGIN,
      ),
    }));
  }

  keepOnly(pluginIds: readonly string[]): void {
    const kept = new Set(pluginIds);
    const unchanged = Object.keys(this.stored.value()).every((id) =>
      kept.has(id),
    );
    if (unchanged && this.stored.answered()) {
      return;
    }
    this.stored.update((answered) =>
      Object.fromEntries(
        Object.entries(answered).filter(([id]) => kept.has(id)),
      ),
    );
  }

  forget(pluginId: string): void {
    if (this.stored.value()[pluginId] === undefined) {
      return;
    }
    this.stored.update((answered) =>
      Object.fromEntries(
        Object.entries(answered).filter(([id]) => id !== pluginId),
      ),
    );
  }
}
