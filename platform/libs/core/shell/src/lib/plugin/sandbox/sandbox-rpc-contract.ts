import { Methods } from 'penpal';
import {
  CommandArguments,
  CommandOutcome,
  FrameSettingsSection,
  InvocableCommand,
  MenuItem,
  NotificationInput,
  OpenTabInput,
  Surface,
} from '@loomweaver/plugin-sdk';
import { FrameSettingValues } from './sandbox-settings';
import { asCommandArguments } from '../../foundation/command-arguments';

const UNCARRIABLE_ARGUMENTS: CommandOutcome = {
  outcome: 'refused',
  reason: 'invalid-arguments',
  message:
    'Arguments must be an object of single values or lists of them; anything else cannot cross the ' +
    'sandbox boundary as the value it was.',
};

export type FrameRpc = Methods & {
  registerSurface(surface: Surface): void;
  retitleSurface(id: string, title: string): void;
  registerMenuItem(item: MenuItem): void;
  registerSettingsSection(section: FrameSettingsSection): void;
  navigateContent(path: string): void;
  openContentTab(input: OpenTabInput): void;
  keepContentTab(path: string): void;
  pinContentTab(path: string): void;
  unpinContentTab(path: string): void;
  closeContentTab(path: string): void;
  revealSurface(id: string): void;
  invokeCommand(id: string, args?: unknown): Promise<CommandOutcome>;
  invocableCommands(): readonly InvocableCommand[];
  toast(input: NotificationInput): string;
  stateWatch(key: string): void;
  stateSet(key: string, value: unknown): void;
  stateClear(key: string): void;
  stateUnwatch(key: string): void;
};

export type FrameRemote = Methods & {
  settingsChanged(sectionId: string, values: FrameSettingValues): void;
  contentTabClosed(path: string): void;
  stateChanged(key: string, value: unknown, loaded: boolean): void;
};

export function invokeRpcCommand(
  ctx: {
    invokeCommand(id: string, args?: CommandArguments): Promise<CommandOutcome>;
  },
  id: unknown,
  args: unknown,
): Promise<CommandOutcome> {
  const carried = args === undefined ? undefined : asCommandArguments(args);
  return carried === null
    ? Promise.resolve(UNCARRIABLE_ARGUMENTS)
    : ctx.invokeCommand(String(id), carried);
}
