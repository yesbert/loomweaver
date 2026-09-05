import { Component, CUSTOM_ELEMENTS_SCHEMA, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { customerById, formatDate } from '../accounting';
import { type Contact, contacts } from './contacts';

export interface ContactRow {
  readonly contact: Contact;
  readonly customer: string;
  readonly on: string;
}

@Component({
  selector: 'lw-contact-history-view',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [TranslocoPipe],
  templateUrl: './contact-history-view.html',
})
export class ContactHistoryView {
  private readonly transloco = inject(TranslocoService);
  private readonly lang = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang(),
  });

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
