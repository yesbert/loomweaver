export type Cents = number;

const LOCALES: Readonly<Record<string, string>> = { de: 'de-DE', en: 'en-GB' };

export function localeOf(lang: string): string {
  return LOCALES[lang.split('-')[0]] ?? 'en-GB';
}

export function formatMoney(cents: Cents, lang: string): string {
  return new Intl.NumberFormat(localeOf(lang), {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}

export function formatQuantity(value: number, lang: string): string {
  return new Intl.NumberFormat(localeOf(lang), {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(iso: string, lang: string): string {
  return new Intl.DateTimeFormat(localeOf(lang), { dateStyle: 'medium' }).format(new Date(iso));
}

export function roundCents(value: number): Cents {
  return value < 0 ? -Math.round(-value) : Math.round(value);
}
