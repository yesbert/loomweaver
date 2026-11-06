import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { setReferenceDate } from '../accounting/clock';
import { resetStock } from './stock';
import { StockLevelsView } from './stock-levels-view';

function render(): HTMLElement {
  TestBed.configureTestingModule({
    imports: [
      StockLevelsView,
      TranslocoTestingModule.forRoot({
        langs: { en: {} },
        translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
        preloadLangs: true,
      }),
    ],
  });
  const fixture = TestBed.createComponent(StockLevelsView);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('the stock levels', () => {
  beforeEach(() => {
    setReferenceDate(new Date('2026-06-15T12:00:00Z'));
    resetStock();
  });

  afterEach(() => setReferenceDate(null));

  it('marks an item below its reorder point beside a quantity drawn in a text tone', () => {
    const low = render().querySelector('[data-item="W-420"]');

    expect(low?.querySelector('.text-caution')).toBeNull();
    expect(low?.querySelector('.bg-caution, .demo-caution-mark')).not.toBeNull();
  });

  it('marks nothing on an item that is stocked well', () => {
    const stocked = render().querySelector('[data-item="W-410"]');

    expect(stocked?.querySelector('.bg-caution, .demo-caution-mark')).toBeNull();
  });
});
