import { computed, signal } from '@angular/core';
import { isoDaysFromToday } from '../accounting';

export type ContactChannel = 'call' | 'email' | 'visit';

export interface Contact {
  readonly id: string;
  readonly customerId: string;
  readonly on: string;
  readonly channel: ContactChannel;
  readonly subjectKey: string;
}

interface ContactSeed {
  readonly id: string;
  readonly customerId: string;
  readonly daysAgo: number;
  readonly channel: ContactChannel;
  readonly subjectKey: string;
}

const SEEDS: readonly ContactSeed[] = [
  { id: 'ct-1', customerId: 'c-nordwind', daysAgo: 2, channel: 'call', subjectKey: 'product.contact.subject.quoteFollowUp' },
  { id: 'ct-2', customerId: 'c-auerbach', daysAgo: 4, channel: 'email', subjectKey: 'product.contact.subject.priceRequest' },
  { id: 'ct-3', customerId: 'c-vitalis', daysAgo: 6, channel: 'visit', subjectKey: 'product.contact.subject.onSite' },
  { id: 'ct-4', customerId: 'c-nordwind', daysAgo: 11, channel: 'email', subjectKey: 'product.contact.subject.deliveryDate' },
  { id: 'ct-5', customerId: 'c-steinweg', daysAgo: 14, channel: 'call', subjectKey: 'product.contact.subject.complaint' },
  { id: 'ct-6', customerId: 'c-kranich', daysAgo: 19, channel: 'email', subjectKey: 'product.contact.subject.renewal' },
  { id: 'ct-7', customerId: 'c-talbach', daysAgo: 23, channel: 'call', subjectKey: 'product.contact.subject.priceRequest' },
  { id: 'ct-8', customerId: 'c-auerbach', daysAgo: 27, channel: 'visit', subjectKey: 'product.contact.subject.onSite' },
];

const store = signal<readonly Contact[]>(
  SEEDS.map((seed) => ({
    id: seed.id,
    customerId: seed.customerId,
    on: isoDaysFromToday(-seed.daysAgo),
    channel: seed.channel,
    subjectKey: seed.subjectKey,
  })),
);

export const contacts = store.asReadonly();

export const contactsByCustomer = computed(() => {
  const grouped = new Map<string, Contact[]>();
  for (const contact of store()) {
    const existing = grouped.get(contact.customerId);
    if (existing) {
      existing.push(contact);
    } else {
      grouped.set(contact.customerId, [contact]);
    }
  }
  return grouped;
});
