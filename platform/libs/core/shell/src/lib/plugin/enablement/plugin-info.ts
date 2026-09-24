/** A plugin as shown in the permissions surface: its id, display name and whether it is enabled. */
export interface PluginInfo {
  readonly id: string;
  readonly name: string;
  readonly enabled: boolean;
}
