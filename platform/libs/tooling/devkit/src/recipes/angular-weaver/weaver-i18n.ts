import { ResolvedWeaver } from './recipe';

export function i18nBundle(w: ResolvedWeaver): Record<string, unknown> {
  const bundle: Record<string, unknown> = { title: w.name };
  if (w.features.container) {
    bundle['canvas'] = 'Canvas';
    bundle['details'] = 'Details';
  }
  if (w.features.command) {
    bundle['action'] = `${w.name} action`;
    bundle['actionDescription'] = `Shows a short ${w.name} message.`;
  }
  if (w.features.about) bundle['about'] = `About ${w.name}`;
  if (w.features.settings)
    bundle['settings'] = { title: w.name, enabled: 'Enabled', note: 'Note' };
  return bundle;
}

export function i18nFile(w: ResolvedWeaver): string {
  return JSON.stringify(i18nBundle(w), null, 2) + '\n';
}
