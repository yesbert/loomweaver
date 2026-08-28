export const SETTING_OMIT_PREFIX = 'setting:';

export function settingOmitIds(omit: readonly string[]): string[] {
  return omit
    .filter((id) => id.startsWith(SETTING_OMIT_PREFIX))
    .map((id) => id.slice(SETTING_OMIT_PREFIX.length));
}
