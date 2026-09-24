import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { of } from 'rxjs';
import { ticketStore } from '../tickets/ticket-store';
import { TicketView } from './ticket-view';

function renderFor(number: string): HTMLElement {
  TestBed.configureTestingModule({
    imports: [
      TicketView,
      TranslocoTestingModule.forRoot({
        langs: { en: {} },
        translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
      }),
    ],
    providers: [
      {
        provide: ActivatedRoute,
        useValue: { paramMap: of(convertToParamMap({ number })) },
      },
    ],
  });
  const fixture = TestBed.createComponent(TicketView);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('TicketView', () => {
  beforeEach(() => ticketStore.reset());

  it('opens the ticket a link names in lower case', () => {
    const view = renderFor('t-1041');

    expect(view.querySelector('h2')?.textContent).toBe(
      ticketStore.get('T-1041').subject,
    );
  });
});
