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
