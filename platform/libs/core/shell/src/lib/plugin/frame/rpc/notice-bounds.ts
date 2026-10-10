import { NotificationInput, NotificationKind } from '@loomweaver/plugin-sdk';
import { NoticeBoard } from '../../../notifications/notice-board';

export const ISOLATED_NOTICE_LIFETIME_MS = 15_000;
export const ISOLATED_NOTICES_AT_ONCE = 3;

export function isolatedLifetime(
  kind: NotificationKind | undefined,
  stated: number | undefined,
): number | undefined {
  if (stated === undefined) {
    return kind === 'error' ? ISOLATED_NOTICE_LIFETIME_MS : undefined;
  }
  return stated > 0
    ? Math.min(stated, ISOLATED_NOTICE_LIFETIME_MS)
    : ISOLATED_NOTICE_LIFETIME_MS;
}

export function refuseBeyondNoticeBound(
  notices: NoticeBoard,
  pluginId: string,
  input: NotificationInput,
): void {
  if (notices.heldAfter(input, pluginId) > ISOLATED_NOTICES_AT_ONCE) {
    throw new Error(
      `Sandbox plugin: '${pluginId}' already holds ${ISOLATED_NOTICES_AT_ONCE} toasts, shown and ` +
        'waiting together. A further one is refused until one of them has left.',
    );
  }
}
