const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;

function formatterFor(locale: string): Intl.RelativeTimeFormat {
  try {
    return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  } catch {
    try {
      return new Intl.RelativeTimeFormat(locale.replace(/_/g, '-'), {
        numeric: 'auto',
      });
    } catch {
      return new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
    }
  }
}

export function formatRelativeTime(
  locale: string,
  epochMs: number,
  now: number,
): string {
  const rtf = formatterFor(locale);
  const seconds = Math.round((epochMs - now) / 1000);
  if (Math.abs(seconds) < SECONDS_PER_MINUTE) {
    return rtf.format(seconds, 'second');
  }
  const minutes = Math.round(seconds / SECONDS_PER_MINUTE);
  if (Math.abs(minutes) < MINUTES_PER_HOUR) {
    return rtf.format(minutes, 'minute');
  }
  const hours = Math.round(minutes / MINUTES_PER_HOUR);
  if (Math.abs(hours) < HOURS_PER_DAY) {
    return rtf.format(hours, 'hour');
  }
  return rtf.format(Math.round(hours / HOURS_PER_DAY), 'day');
}
