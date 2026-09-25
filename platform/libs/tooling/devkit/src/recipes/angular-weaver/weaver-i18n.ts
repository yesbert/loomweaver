import type { ResolvedWeaver } from './weaver-input';

export function i18nBundle(weaver: ResolvedWeaver): Record<string, unknown> {
  const bundle: Record<string, unknown> = { title: weaver.name };
  if (weaver.features.container) {
    bundle['canvas'] = 'Canvas';
    bundle['details'] = 'Details';
  }
  if (weaver.features.command) {
    bundle['action'] = `${weaver.name} action`;
    bundle['actionDescription'] = `Shows a short ${weaver.name} message in the tone the caller chooses.`;
    bundle['actionTone'] = 'How the message is shown: info, success or warning. Use info unless the caller asked for emphasis.';
    bundle['actionAnswers'] = 'The tone the message was shown in.';
  }
  if (weaver.features.about) bundle['about'] = `About ${weaver.name}`;
  if (weaver.features.agent) {
    bundle['agent'] = {
      title: `${weaver.name} assistant`,
      confirm: {
        title: 'Run this command?',
        message:
          'An agent asked to run a command that was marked consequential.',
        yes: 'Run it',
        no: 'Not now',
      },
    };
  }
  if (weaver.features.settings) {
    bundle['settings'] = { title: weaver.name, enabled: 'Enabled', note: 'Note' };
  }
  return bundle;
}

export function i18nFile(weaver: ResolvedWeaver): string {
  return JSON.stringify(i18nBundle(weaver), null, 2) + '\n';
}
