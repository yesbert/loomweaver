import { Methods } from 'penpal';
import {
  CommandOutcome,
  FrameSettingsSection,
  InvocableCommand,
  MenuItem,
  NotificationInput,
  ContentTabLabel,
  OpenTabInput,
  Surface,
  TabBadge,
} from '@loomweaver/plugin-sdk';
import { FrameSettingValues } from '../frame-settings-section';

export type FrameRpc = Methods & {
  registerSurface(surface: Surface): void;
  retitleSurface(id: string, title: string): void;
  updateSurfaceBadge(id: string, badge: TabBadge | null): void;
  setChildShown(childSurfaceId: string, shown: boolean): void;
  registerMenuItem(item: MenuItem): void;
  registerSettingsSection(section: FrameSettingsSection): void;
  navigateContent(path: string): void;
  openContentTab(input: OpenTabInput): void;
  keepContentTab(path: string): void;
  pinContentTab(path: string): void;
  unpinContentTab(path: string): void;
  closeContentTab(path: string): void;
  updateContentTab(path: string, label: ContentTabLabel): void;
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
