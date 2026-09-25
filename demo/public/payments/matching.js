globalThis.PaymentsMatching = (function () {
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
      reference: 'RECHNUNG RE-2043',
      amount: 1826412,
    },
    {
      id: 'b-2',
      date: daysAgo(2),
      payer: 'Kranich Medien GmbH',
      reference: 'RE-2044 ABZUEGL. SKONTO',
      amount: 442200,
    },
    {
      id: 'b-3',
      date: daysAgo(4),
      payer: 'Talbach Werkzeugbau GmbH',
      reference: 'ERSTATTUNG REISEKOSTEN',
      amount: 24900,
    },
    {
      id: 'b-4',
      date: daysAgo(5),
      payer: 'Steinweg Architekten PartG',
      reference: 'RE-2045',
      amount: 738990,
    },
    {
      id: 'b-5',
      date: daysAgo(6),
      payer: 'Talbach Werkzeugbau GmbH',
      reference: 'RECHNUNG RE-2047 VOM 21.',
      amount: 1192500,
    },
  ];

  function matchFor(line, items) {
    return (items ?? []).find((item) => line.reference.includes(item.number));
  }

  function withinTolerance(open, amount, tolerance) {
    const allowed = (open * tolerance) / 100;
    return Math.abs(open - amount) <= allowed;
  }

  function outcomeOf(line, items, settings) {
    const item = matchFor(line, items);
    if (!item) {
      return 'unassigned';
    }
    return withinTolerance(item.open, line.amount, settings.tolerance) ? 'confirmed' : 'flagged';
  }

  function isExact(line, items) {
    const item = matchFor(line, items);
    return Boolean(item) && item.open === line.amount;
  }

  function shownStatement(settings) {
    const cutoff = Date.now() - Number(settings.period) * 86400000;
    const shown = STATEMENT.filter((line) => new Date(line.date).getTime() >= cutoff);
    return settings.sort === 'largest'
      ? [...shown].sort((a, b) => b.amount - a.amount)
      : [...shown].sort((a, b) => b.date.localeCompare(a.date));
  }

  function settledNumbers(items, decisions) {
    return STATEMENT.filter((line) => decisions.get(line.id) === 'accepted')
      .map((line) => matchFor(line, items)?.number)
      .filter(Boolean);
  }

  function stillOpen(items, decisions) {
    const settled = settledNumbers(items, decisions);
    return (items ?? [])
      .filter((item) => !settled.includes(item.number))
      .reduce((sum, item) => sum + item.open, 0);
  }

  function openCount(items, decisions) {
    const settled = settledNumbers(items, decisions);
    return (items ?? []).filter((item) => !settled.includes(item.number)).length;
  }

  function applyAutoConfirm(items, settings, decisions) {
    if (!settings.autoConfirm) {
      return;
    }
    for (const line of shownStatement(settings)) {
      if (!decisions.has(line.id) && isExact(line, items)) {
        decisions.set(line.id, 'accepted');
      }
    }
  }

  return Object.freeze({
    outcomeOf,
    shownStatement,
    settledNumbers,
    stillOpen,
    openCount,
    applyAutoConfirm,
  });
})();
