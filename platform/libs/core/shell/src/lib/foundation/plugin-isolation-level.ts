/**
 * How much the browser holds a sandboxed plugin back. **Isolated** strips the frame of an origin, which
 * is what denies it the hosting document, any storage and any session the browser would carry for
 * it. **Embedded** lets it keep an origin, and with it whatever the browser grants that origin — a
 * separation of deployments rather than of privileges.
 *
 * Isolated is the default: a plugin whose level was never stated runs isolated.
 */
export type PluginIsolationLevel = 'isolated' | 'embedded';

export const DEFAULT_ISOLATION_LEVEL: PluginIsolationLevel = 'isolated';

export type PluginRung = 'trusted' | PluginIsolationLevel;

export function exceedsLevel(
  asked: PluginIsolationLevel,
  maxLevel: PluginIsolationLevel,
): boolean {
  return asked === 'embedded' && maxLevel === 'isolated';
}
