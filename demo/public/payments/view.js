(function () {
  const OPEN_ITEMS_URL = '/api/open-items.json';
  const ACCOUNTING_ROLE = 'accounting';

  const STRINGS = {
    en: {
      badge: 'isolated plugin',
      badgeTip:
        'This area is not part of the application: it runs in its own sandboxed frame and fetched the open items from /api/open-items.json like any other client.',
      title: 'Payment matching',
      statement: 'Bank statement',
      openItems: 'Open items',
      column: {
        date: 'Date',
        payer: 'Payer',
        reference: 'Reference',
        amount: 'Amount',
        number: 'Quote',
        customer: 'Customer',
        gross: 'Gross',
      },
      outcome: {
        confirmed: 'Amounts agree',
        flagged: 'Amounts differ',
        unassigned: 'No match',
      },
      decided: { accepted: 'Confirmed', dismissed: 'Dismissed' },
      action: { confirm: 'Confirm', dismiss: 'Dismiss', undo: 'Undo' },
      settled: 'settled',
      stillOpen: 'Still open',
      loading: 'Loading the open items…',
      failed: 'The open items could not be fetched.',
      signIn: 'Sign in to match payments.',
      wrongRole:
        'Payment matching belongs to accounting. This account holds: {{roles}}.',
      noRole: 'Payment matching belongs to accounting. This account holds no role.',
    },
    de: {
      badge: 'isoliertes Plugin',
      badgeTip:
        'Dieser Bereich gehört nicht zur Anwendung: Er läuft in einem eigenen Sandbox-Frame und hat die offenen Posten wie jeder andere Client von /api/open-items.json geholt.',
      title: 'Zahlungsabgleich',
      statement: 'Kontoauszug',
      openItems: 'Offene Posten',
      column: {
        date: 'Datum',
        payer: 'Zahler',
        reference: 'Verwendungszweck',
        amount: 'Betrag',
        number: 'Angebot',
        customer: 'Kunde',
        gross: 'Brutto',
      },
      outcome: {
        confirmed: 'Beträge stimmen',
        flagged: 'Beträge weichen ab',
        unassigned: 'Keine Zuordnung',
      },
      decided: { accepted: 'Bestätigt', dismissed: 'Verworfen' },
      action: { confirm: 'Bestätigen', dismiss: 'Verwerfen', undo: 'Zurück' },
      settled: 'ausgeglichen',
      stillOpen: 'Noch offen',
      loading: 'Offene Posten werden geladen…',
      failed: 'Die offenen Posten konnten nicht geladen werden.',
      signIn: 'Zum Abgleich bitte anmelden.',
      wrongRole:
        'Der Zahlungsabgleich gehört zur Buchhaltung. Dieses Konto hat: {{roles}}.',
      noRole: 'Der Zahlungsabgleich gehört zur Buchhaltung. Dieses Konto hat keine Rolle.',
    },
  };

  function daysAgo(days) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().slice(0, 10);
  }

  const STATEMENT = [
    {
      id: 'b-1',
      date: daysAgo(1),
      payer: 'Nordwind Logistik GmbH',
      reference: 'RECHNUNG Q-0007',
      amount: 1826412,
    },
    {
      id: 'b-2',
      date: daysAgo(2),
      payer: 'Kranich Medien GmbH',
      reference: 'Q-0006 TEILZAHLUNG',
      amount: 200000,
    },
    {
      id: 'b-3',
      date: daysAgo(4),
      payer: 'Talbach Werkzeugbau GmbH',
      reference: 'ERSTATTUNG REISEKOSTEN',
      amount: 24900,
    },
  ];

  const LOCALES = { de: 'de-DE', en: 'en-GB' };

  const app = document.getElementById('app');
  const decisions = new Map();

  let state = { locale: 'en', session: { authenticated: false, roles: [] } };
  let openItems = null;
  let failed = false;

  function strings() {
    return STRINGS[state.locale] ?? STRINGS.en;
  }

  function money(cents) {
    return new Intl.NumberFormat(LOCALES[state.locale] ?? LOCALES.en, {
      style: 'currency',
      currency: 'EUR',
    }).format(cents / 100);
  }

  function day(iso) {
    return new Intl.DateTimeFormat(LOCALES[state.locale] ?? LOCALES.en, {
      dateStyle: 'medium',
    }).format(new Date(iso));
  }

  function escapeHtml(text) {
    const holder = document.createElement('div');
    holder.textContent = String(text);
    return holder.innerHTML;
  }

  function matchFor(line) {
    return (openItems ?? []).find((item) => line.reference.includes(item.number));
  }

  function outcomeOf(line) {
    const item = matchFor(line);
    if (!item) {
      return 'unassigned';
    }
    return item.gross === line.amount ? 'confirmed' : 'flagged';
  }

  function settledNumbers() {
    return STATEMENT.filter((line) => decisions.get(line.id) === 'accepted')
      .map((line) => matchFor(line)?.number)
      .filter(Boolean);
  }

  function stillOpen() {
    const settled = settledNumbers();
    return (openItems ?? [])
      .filter((item) => !settled.includes(item.number))
      .reduce((sum, item) => sum + item.gross, 0);
  }

  function badgeFor(line) {
    const decision = decisions.get(line.id);
    if (decision) {
      const tone = decision === 'accepted' ? 'lw-badge--success' : '';
      return (
        '<span class="lw-badge ' +
        tone +
        '" data-testid="outcome-' +
        decision +
        '">' +
        strings().decided[decision] +
        '</span>'
      );
    }
    const outcome = outcomeOf(line);
    const tone =
      outcome === 'confirmed'
        ? 'lw-badge--success'
        : outcome === 'flagged'
          ? 'lw-badge--danger'
          : '';
    return (
      '<span class="lw-badge ' +
      tone +
      '" data-testid="outcome-' +
      outcome +
      '">' +
      strings().outcome[outcome] +
      '</span>'
    );
  }

  function actionsFor(line) {
    const t = strings();
    if (decisions.has(line.id)) {
      return (
        '<lw-button variant="ghost" size="sm" data-undo="' +
        line.id +
        '">' +
        t.action.undo +
        '</lw-button>'
      );
    }
    if (outcomeOf(line) === 'unassigned') {
      return '';
    }
    return (
      '<lw-button variant="primary" size="sm" data-confirm="' +
      line.id +
      '">' +
      t.action.confirm +
      '</lw-button>' +
      '<lw-button variant="ghost" size="sm" data-dismiss="' +
      line.id +
      '">' +
      t.action.dismiss +
      '</lw-button>'
    );
  }

  function statementRow(line) {
    return (
      '<li class="row" data-line="' +
      line.id +
      '"><div class="row-head"><span class="payer">' +
      escapeHtml(line.payer) +
      '</span><span class="amount">' +
      money(line.amount) +
      '</span></div><div class="row-meta"><span>' +
      day(line.date) +
      '</span><span class="reference">' +
      escapeHtml(line.reference) +
      '</span></div><div class="row-foot">' +
      badgeFor(line) +
      '<span class="actions">' +
      actionsFor(line) +
      '</span></div></li>'
    );
  }

  function openItemRow(item) {
    const settled = settledNumbers().includes(item.number);
    return (
      '<li class="row" data-item="' +
      item.number +
      '"><div class="row-head"><span class="payer">' +
      escapeHtml(item.number) +
      '</span><span class="amount">' +
      money(item.gross) +
      '</span></div><div class="row-meta"><span>' +
      escapeHtml(item.customer) +
      '</span>' +
      (settled
        ? '<span class="lw-badge lw-badge--success">' + strings().settled + '</span>'
        : '') +
      '</div></li>'
    );
  }

  function header() {
    const t = strings();
    return (
      '<header class="head"><h1>' +
      t.title +
      '</h1><span class="lw-badge lw-badge--brand" data-testid="payments-badge">' +
      t.badge +
      '<lw-tooltip text="' +
      escapeHtml(t.badgeTip) +
      '" position="bottom"></lw-tooltip></span></header>'
    );
  }

  function notice(message, testid) {
    return header() + '<p class="notice" data-testid="' + testid + '">' + message + '</p>';
  }

  function matchingView() {
    const t = strings();
    return (
      header() +
      '<div class="columns"><section><h2>' +
      t.statement +
      '</h2><ul class="rows" data-testid="statement">' +
      STATEMENT.map(statementRow).join('') +
      '</ul></section><section><h2>' +
      t.openItems +
      '</h2><ul class="rows" data-testid="open-items">' +
      openItems.map(openItemRow).join('') +
      '</ul><p class="total">' +
      t.stillOpen +
      ': <strong data-testid="still-open">' +
      money(stillOpen()) +
      '</strong></p></section></div>'
    );
  }

  function bindActions() {
    app.querySelectorAll('[data-confirm]').forEach((button) => {
      button.addEventListener('click', () => decide(button.dataset.confirm, 'accepted'));
    });
    app.querySelectorAll('[data-dismiss]').forEach((button) => {
      button.addEventListener('click', () => decide(button.dataset.dismiss, 'dismissed'));
    });
    app.querySelectorAll('[data-undo]').forEach((button) => {
      button.addEventListener('click', () => {
        decisions.delete(button.dataset.undo);
        render();
      });
    });
  }

  function decide(lineId, decision) {
    decisions.set(lineId, decision);
    render();
  }

  function render() {
    const t = strings();
    const session = state.session ?? { authenticated: false, roles: [] };
    const roles = session.roles ?? [];

    if (!session.authenticated) {
      app.innerHTML = notice(t.signIn, 'payments-sign-in');
      return;
    }
    if (!roles.includes(ACCOUNTING_ROLE)) {
      const message =
        roles.length === 0
          ? t.noRole
          : t.wrongRole.replace('{{roles}}', escapeHtml(roles.join(', ')));
      app.innerHTML = notice(message, 'payments-wrong-role');
      return;
    }
    if (failed) {
      app.innerHTML = notice(t.failed, 'payments-failed');
      return;
    }
    if (openItems === null) {
      app.innerHTML = notice(t.loading, 'payments-loading');
      return;
    }
    app.innerHTML = matchingView();
    bindActions();
  }

  function loadOpenItems() {
    fetch(OPEN_ITEMS_URL)
      .then((response) => {
        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }
        return response.json();
      })
      .then((items) => {
        openItems = items;
        render();
      })
      .catch((error) => {
        failed = true;
        console.error('[payments] the open items could not be fetched', error);
        render();
      });
  }

  globalThis.Penpal.connect({
    messenger: new globalThis.Penpal.WindowMessenger({
      remoteWindow: globalThis.parent,
      allowedOrigins: ['*'],
    }),
    methods: {
      render(next) {
        state = {
          locale: next.locale,
          session: next.session ?? { authenticated: false, roles: [] },
        };
        globalThis.LwFrame.applySurfaceState(next);
        render();
      },
    },
  }).promise.catch((error) => {
    console.error('[payments view] host connection failed', error);
  });

  render();
  loadOpenItems();
})();
