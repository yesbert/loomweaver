import { NotificationInput } from '@loomweaver/plugin-sdk';
import { STAYS } from '../notifications/notification-lifetime';

export type UpdateNotice =
  | 'waiting'
  | 'current'
  | 'unreachable'
  | 'failed'
  | 'broken'
  | 'notActivated';

const NOTICES: Record<
  UpdateNotice,
  (activate: () => void) => NotificationInput
> = {
  waiting: (activate) => ({
    id: 'shell.update',
    kind: 'info',
    message: 'update.available',
    timeoutMs: STAYS,
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
    timeoutMs: STAYS,
    action: { label: 'update.reload', run: activate },
  }),
  notActivated: () => ({
    id: 'shell.update.notActivated',
    kind: 'warning',
    message: 'update.activationFailed',
    timeoutMs: 8000,
  }),
  broken: (activate) => ({
    id: 'shell.update.broken',
    kind: 'warning',
    message: 'update.broken',
    timeoutMs: STAYS,
    action: { label: 'update.repair', run: activate },
  }),
};

export function updateNotice(
  notice: UpdateNotice,
  activate: () => void,
): NotificationInput {
  return NOTICES[notice](activate);
}
