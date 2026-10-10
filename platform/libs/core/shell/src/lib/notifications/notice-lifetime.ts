import { NotificationInput, NotificationKind } from '@loomweaver/plugin-sdk';

export const STAYS = 0;
export const HOLD_REMAINDER_MS = 1000;

const LIFETIME_BY_KIND: Record<NotificationKind, number> = {
  info: 5000,
  success: 5000,
  warning: 8000,
  error: STAYS,
};

export function lifetimeOf(input: NotificationInput): number {
  const stated = input.timeoutMs;
  if (stated === undefined) {
    return LIFETIME_BY_KIND[input.kind ?? 'info'];
  }
  return Number.isFinite(stated) && stated > 0 ? stated : STAYS;
}
