import { type TabBadge } from '@loomweaver/plugin-sdk';
import { QUOTE_STATUS_TONE, type QuoteStatus, quoteStatusKey } from '../accounting';

export function badgeClassOf(status: QuoteStatus): string {
  const tone = QUOTE_STATUS_TONE[status];
  return tone === 'neutral' ? 'lw-badge' : `lw-badge lw-badge--${tone}`;
}

export function statusBadge(status: QuoteStatus): TabBadge {
  return { text: quoteStatusKey(status), tone: QUOTE_STATUS_TONE[status] };
}
