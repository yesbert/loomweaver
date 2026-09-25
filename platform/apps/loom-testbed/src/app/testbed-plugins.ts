import { EnvironmentProviders, Provider } from '@angular/core';
import {
  FramePlugin,
  provideCapabilityGrants,
  provideFramePlugins,
  providePluginCatalog,
  providePlugins,
  provideRequiredPlugins,
} from '@loomweaver/shell';
import { testbedPlugin } from '@loomweaver/testbed-weaver';
import { testbedCapturePlugin } from './capture/testbed-capture-plugin';

const SANDBOX_RPC: FramePlugin = {
  id: 'sandbox-rpc',
  name: 'Sandbox (RPC)',
  entryUrl: '/sandbox-rpc/plugin.html',
  capabilities: ['contributions', 'ui', 'session'],
};

const SANDBOX_STATIC: FramePlugin = {
  id: 'sandbox-static',
  entryUrl: '/sandbox-static/plugin.html',
  capabilities: ['contributions', 'navigation'],
};

const TRUSTED_PLUGINS = [testbedPlugin, testbedCapturePlugin];
const SANDBOXED_PLUGINS = [SANDBOX_RPC, SANDBOX_STATIC];

export function provideTestbedPlugins(): (Provider | EnvironmentProviders)[] {
  return [
    provideCapabilityGrants(
      Object.fromEntries([
        ...TRUSTED_PLUGINS.map((plugin) => [
          plugin.manifest.id,
          plugin.manifest.capabilities ?? [],
        ]),
        ...SANDBOXED_PLUGINS.map((plugin) => [plugin.id, plugin.capabilities ?? []]),
      ]),
    ),
    ...providePlugins(...TRUSTED_PLUGINS),
    provideRequiredPlugins(SANDBOX_RPC.id),
    ...provideFramePlugins(...SANDBOXED_PLUGINS),
    ...providePluginCatalog('/plugins/catalog.json'),
  ];
}
