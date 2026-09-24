import { NotificationInput } from '@loomweaver/plugin-sdk';

export type UpdateNotice =
  'waiting' | 'current' | 'unreachable' | 'failed' | 'broken';

const NOTICES: Record<
  UpdateNotice,
  (activate: () => void) => NotificationInput
> = {
  waiting: (activate) => ({
    id: 'shell.update',
    kind: 'info',
    message: 'update.available',
    action: { label: 'update.reload', run: activate },
  }),
  current: () => ({
    id: 'shell.update.none',
    kind: 'success',
    message: 'update.upToDate',
    timeoutMs: 4000,
  }),
  unreachable: () => ({
    id: 'shell.update.unavailable',
    kind: 'info',
    message: 'update.checkUnavailable',
    timeoutMs: 6000,
  }),
  failed: (activate) => ({
    id: 'shell.update.failed',
    kind: 'warning',
    message: 'update.failed',
    action: { label: 'update.reload', run: activate },
  }),
  broken: (activate) => ({
    id: 'shell.update.broken',
    kind: 'warning',
    message: 'update.broken',
    action: { label: 'update.repair', run: activate },
  }),
};

export function updateNotice(
  notice: UpdateNotice,
  activate: () => void,
): NotificationInput {
  return NOTICES[notice](activate);
}
