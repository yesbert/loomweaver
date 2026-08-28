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
  return date.toISOString().slice(0, 10);
}
