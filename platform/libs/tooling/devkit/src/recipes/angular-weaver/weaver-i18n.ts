import type { ResolvedWeaver } from './recipe';

export function i18nBundle(w: ResolvedWeaver): Record<string, unknown> {
  const bundle: Record<string, unknown> = { title: w.name };
  if (w.features.container) {
    bundle['canvas'] = 'Canvas';
    bundle['details'] = 'Details';
  }
  if (w.features.command) {
    bundle['action'] = `${w.name} action`;
    bundle['actionDescription'] = `Shows a short ${w.name} message in the tone the caller chooses.`;
    bundle['actionTone'] = 'How the message is shown: info, success or warning. Use info unless the caller asked for emphasis.';
    bundle['actionAnswers'] = 'The tone the message was shown in.';
  }
  if (w.features.about) bundle['about'] = `About ${w.name}`;
  if (w.features.agent) {
    bundle['agent'] = {
      title: `${w.name} assistant`,
      confirm: {
        title: 'Run this command?',
        message:
          'An agent asked to run a command that was marked consequential.',
        yes: 'Run it',
        no: 'Not now',
      },
    };
  }
  if (w.features.settings)
    bundle['settings'] = { title: w.name, enabled: 'Enabled', note: 'Note' };
  return bundle;
}

export function i18nFile(w: ResolvedWeaver): string {
  return JSON.stringify(i18nBundle(w), null, 2) + '\n';
}
