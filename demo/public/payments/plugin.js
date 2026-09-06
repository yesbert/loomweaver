(function () {
  const SECTION = 'payments.settings';
  const STATE_KEY = 'settings';

  const DEFAULTS = {
    tolerance: 0,
    autoConfirm: false,
    sort: 'newest',
    period: '30',
  };

  const SECTIONS = {
    en: {
      title: 'Payment matching',
      tolerance: {
        label: 'Tolerance',
        description:
          'How far an amount may sit from the receivable and still count as agreeing, in percent.',
      },
      autoConfirm: {
        label: 'Confirm exact matches automatically',
        description: 'A payment that settles a receivable to the cent is booked without asking.',
      },
      sort: {
        label: 'Sort order',
        options: [
          { value: 'newest', label: 'Newest first' },
          { value: 'largest', label: 'Largest amount first' },
        ],
      },
      period: {
        label: 'Period shown',
        options: [
          { value: '30', label: 'Last 30 days' },
          { value: '60', label: 'Last 60 days' },
          { value: '90', label: 'Last 90 days' },
        ],
      },
    },
    de: {
      title: 'Zahlungsabgleich',
      tolerance: {
        label: 'Toleranz',
        description:
          'Wie weit ein Betrag von der Forderung abweichen darf und trotzdem als übereinstimmend gilt, in Prozent.',
      },
      autoConfirm: {
        label: 'Exakte Treffer automatisch bestätigen',
        description: 'Eine Zahlung, die eine Forderung auf den Cent ausgleicht, wird ohne Nachfrage gebucht.',
      },
      sort: {
        label: 'Sortierung',
        options: [
          { value: 'newest', label: 'Neueste zuerst' },
          { value: 'largest', label: 'Größter Betrag zuerst' },
        ],
      },
      period: {
        label: 'Zeitraum',
        options: [
          { value: '30', label: 'Letzte 30 Tage' },
          { value: '60', label: 'Letzte 60 Tage' },
          { value: '90', label: 'Letzte 90 Tage' },
        ],
      },
    },
  };

  function textsFor(locale) {
    return SECTIONS[(locale || 'en').slice(0, 2)] || SECTIONS.en;
  }

  function sectionFor(locale, values) {
    const t = textsFor(locale);
    return {
      id: SECTION,
      title: t.title,
      rows: [
        {
          id: 'tolerance',
          label: t.tolerance.label,
          description: t.tolerance.description,
          control: { kind: 'slider', value: values.tolerance, min: 0, max: 5, step: 1 },
        },
        {
          id: 'autoConfirm',
          label: t.autoConfirm.label,
          description: t.autoConfirm.description,
          control: { kind: 'toggle', value: values.autoConfirm },
        },
        {
          id: 'sort',
          label: t.sort.label,
          control: { kind: 'select', value: values.sort, options: t.sort.options },
        },
        {
          id: 'period',
          label: t.period.label,
          control: { kind: 'select', value: values.period, options: t.period.options },
        },
      ],
    };
  }

  let host;
  let values = { ...DEFAULTS };

  const messenger = new globalThis.Penpal.WindowMessenger({
    remoteWindow: globalThis.parent,
    allowedOrigins: ['*'],
  });

  globalThis.Penpal.connect({
    messenger,
    methods: {
      settingsChanged: function (sectionId, next) {
        if (sectionId !== SECTION) {
          return;
        }
        values = { ...DEFAULTS, ...next };
        if (host) {
          host.stateSet(STATE_KEY, values);
        }
      },
    },
  })
    .promise.then(function (ctx) {
      host = ctx;
      return ctx
        .stateWatch(STATE_KEY)
        .then(function () {
          return ctx.registerSurface({
            id: 'payments.matching',
            title: 'product.payments.title',
            icon: 'payments',
            iframe: '/payments/view.html',
            retain: 'always',
            closable: false,
            routable: { path: 'finance/matching' },
          });
        })
        .then(function () {
          return ctx.registerSettingsSection(sectionFor(globalThis.navigator.language, values));
        })
        .then(function () {
          return ctx.stateSet(STATE_KEY, values);
        });
    })
    .catch(function (error) {
      console.error('[payments] activation failed', error);
    });
})();
