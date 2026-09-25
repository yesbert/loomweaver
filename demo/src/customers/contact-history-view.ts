import { Component, computed } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { customerById, formatDate } from '../accounting';
import { type Contact, contacts } from './contacts';
import { activeLanguage } from '../i18n/active-language';

interface ContactRow {
  readonly contact: Contact;
  readonly customer: string;
  readonly on: string;
}

@Component({
  selector: 'lw-contact-history-view',
  imports: [TranslocoPipe],
  templateUrl: './contact-history-view.html',
})
export class ContactHistoryView {
  private readonly lang = activeLanguage();

  protected readonly rows = computed<readonly ContactRow[]>(() => {
    const lang = this.lang();
    return [...contacts()]
      .sort((a, b) => b.on.localeCompare(a.on))
      .map((contact) => ({
        contact,
        customer: customerById(contact.customerId)?.name ?? contact.customerId,
        on: formatDate(contact.on, lang),
      }));
  });
}
