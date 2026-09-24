import { type TabBadge, type TabBadgeTone } from '@loomweaver/plugin-sdk';
import { type QuoteStatus } from '../../../../accounting';

export const STATUS_TONE: Readonly<Record<QuoteStatus, TabBadgeTone>> = {
  draft: 'neutral',
  sent: 'brand',
  accepted: 'success',
  declined: 'danger',
  expired: 'neutral',
};

function badgeClass(tone: TabBadgeTone): string {
  return tone === 'neutral' ? 'lw-badge' : `lw-badge lw-badge--${tone}`;
}

export const STATUS_BADGE: Readonly<Record<QuoteStatus, string>> = {
  draft: badgeClass(STATUS_TONE.draft),
  sent: badgeClass(STATUS_TONE.sent),
  accepted: badgeClass(STATUS_TONE.accepted),
  declined: badgeClass(STATUS_TONE.declined),
  expired: badgeClass(STATUS_TONE.expired),
};

export function statusBadge(status: QuoteStatus): TabBadge {
  return { text: `quotes.list.status.${status}`, tone: STATUS_TONE[status] };
}
