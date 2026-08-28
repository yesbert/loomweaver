import type { FramePlugin } from '@loomweaver/shell';

export const paymentsIcon =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" ' +
  'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<rect x="2.5" y="6" width="19" height="12" rx="2"/>' +
  '<circle cx="12" cy="12" r="2.5"/>' +
  '<path d="M6 9.5v5M18 9.5v5"/></svg>';

export const paymentsPlugin: FramePlugin = {
  id: 'payments',
  name: 'Payment matching',
  entryUrl: '/payments/plugin.html',
  capabilities: ['contributions', 'session'],
};
