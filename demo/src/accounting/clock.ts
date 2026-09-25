const DAY_MS = 86_400_000;

let reference: Date | null = null;

export function setReferenceDate(date: Date | null): void {
  reference = date;
}

export function today(): Date {
  return reference ? new Date(reference) : new Date();
}

export function isoDaysFromToday(offset: number): string {
  const date = today();
  date.setDate(date.getDate() + offset);
  return localIsoDate(date);
}

export function localIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function daysSince(iso: string): number {
  return Math.round((startOfDay(today()) - calendarDay(iso)) / DAY_MS);
}

export function daysUntil(iso: string): number {
  return -daysSince(iso);
}

export function recentMonths(count: number): readonly string[] {
  const now = today();
  return Array.from({ length: count }, (_, back) =>
    localIsoDate(new Date(now.getFullYear(), now.getMonth() - back, 1)).slice(0, 7),
  );
}

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function calendarDay(iso: string): number {
  const [year, month, day] = iso.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day).getTime();
}
