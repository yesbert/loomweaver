import { type PluginContext } from '@loomweaver/plugin-sdk';

export interface PluginContextHolder {
  readonly current: PluginContext | undefined;
  readonly bind: (next: PluginContext) => void;
  readonly unbind: () => void;
}

export function pluginContextHolder(): PluginContextHolder {
  let ctx: PluginContext | undefined;
  return {
    get current() {
      return ctx;
    },
    bind: (next) => {
      ctx = next;
    },
    unbind: () => {
      ctx = undefined;
    },
  };
}
