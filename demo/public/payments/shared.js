globalThis.PaymentsShared = Object.freeze({
  OPEN_ITEMS_URL: '/api/open-items.json',
  SETTINGS_KEY: 'settings',
  OPEN_COUNT_KEY: 'openCount',
  DEFAULT_SETTINGS: Object.freeze({
    tolerance: 0,
    autoConfirm: false,
    sort: 'newest',
    period: '30',
  }),
});
