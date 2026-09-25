import type { PluginSession } from '@loomweaver/plugin-sdk';

export const insightsSession = {
  session: undefined as PluginSession | undefined,

  bind(session: PluginSession | undefined): void {
    this.session = session;
  },
};
