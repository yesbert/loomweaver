const MS_PER_DAY = 86_400_000;
const DAYS_PER_WEEK = 7;
const DAYS_PER_MONTH = 30;
const DAYS_PER_YEAR = 365;

export function formatCount(locale: string, count: number): string {
  return new Intl.NumberFormat(locale).format(count);
}

export function formatUpdated(locale: string, iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  const relative = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const days = Math.round((date.getTime() - Date.now()) / MS_PER_DAY);
  const elapsed = Math.abs(days);
  if (elapsed < DAYS_PER_WEEK) {
    return relative.format(days, 'day');
  }
  if (elapsed < DAYS_PER_MONTH) {
    return relative.format(Math.round(days / DAYS_PER_WEEK), 'week');
  }
  if (elapsed < DAYS_PER_YEAR) {
    return relative.format(Math.round(days / DAYS_PER_MONTH), 'month');
  }
  return relative.format(Math.round(days / DAYS_PER_YEAR), 'year');
}
