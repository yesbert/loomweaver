import { type QuoteStatus } from '../../../../accounting';

export const STATUS_BADGE: Readonly<Record<QuoteStatus, string>> = {
  draft: 'lw-badge',
  sent: 'lw-badge lw-badge--brand',
  accepted: 'lw-badge lw-badge--success',
  declined: 'lw-badge lw-badge--danger',
  expired: 'lw-badge',
};
