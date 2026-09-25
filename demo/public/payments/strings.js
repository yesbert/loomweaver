globalThis.PaymentsStrings = Object.freeze({
  en: {
    badge: 'isolated plugin',
    badgeTip:
      'This area is not part of the application: it runs in its own sandboxed frame and fetched the open items from /api/open-items.json like any other client.',
    title: 'Payment matching',
    statement: 'Bank statement',
    openItems: 'Open items',
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
});
