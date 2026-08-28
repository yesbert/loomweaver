import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import {
  TranslocoTestingModule,
  TranslocoTestingOptions,
} from '@jsverse/transloco';
import { Shell } from './shell';
import { DEFAULT_BAR_ITEMS } from './regions/bar/default-bar-items';
import { ContributionRegistry } from './plugin/contribution-registry';
import { provideLayout } from './layout/layout';

function translocoTesting(options: TranslocoTestingOptions = {}) {
  return TranslocoTestingModule.forRoot({
    langs: {
      en: {
        shell: { tagline: 'Plugin & UI platform — the loom' },
        theme: {
          label: 'Theme',
          light: 'Light',
          dark: 'Dark',
          system: 'System',
        },
        language: { label: 'Language' },
      },
    },
    translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
    preloadLangs: true,
    ...options,
  });
}

describe('Shell', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Shell, translocoTesting()],
      providers: [provideRouter([])],
    }).compileComponents();

    const registry = TestBed.inject(ContributionRegistry);
    DEFAULT_BAR_ITEMS.forEach((item) => registry.addBarItem(item));
  });

  it('renders the LoomWeaver shell brand', async () => {
    const fixture = TestBed.createComponent(Shell);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('header')?.textContent).toContain(
      'LoomWeaver',
    );
  });
});

describe('Shell sidebar footer', () => {
  it('renders a bar docked to a side as a footer holding its items', async () => {
    await TestBed.configureTestingModule({
      imports: [Shell, translocoTesting()],
      providers: [
        provideRouter([]),
        provideLayout({
          regions: [
            { id: 'primary', type: 'panel', dock: 'left' },
            { id: 'main', type: 'content', dock: 'center' },
            { id: 'left-footer', type: 'bar', dock: 'left' },
          ],
        }),
      ],
    }).compileComponents();

    const registry = TestBed.inject(ContributionRegistry);
    registry.addBarItem({
      id: 'foot.help',
      bar: 'left-footer',
      slot: 'end',
      icon: 'info',
      tooltip: 'help.about',
      run: () => undefined,
    });

    const fixture = TestBed.createComponent(Shell);
    await fixture.whenStable();

    const labels = [...fixture.nativeElement.querySelectorAll('button')].map(
      (b) => (b as HTMLButtonElement).getAttribute('aria-label'),
    );
    expect(labels).toContain('help.about');
  });
});
