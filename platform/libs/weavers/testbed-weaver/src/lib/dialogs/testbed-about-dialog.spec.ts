import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { DialogRef, PluginHost, provideProductIdentity } from '@loomweaver/plugin-sdk';
import { TestbedAboutDialog } from './testbed-about-dialog';

function transloco() {
  return TranslocoTestingModule.forRoot({
    langs: { en: { product: { tagline: 'A tree editor' }, update: { check: 'Check', reload: 'Reload' } } },
    translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
    preloadLangs: true,
  });
}

function hostStub(overrides: Partial<PluginHost> = {}): PluginHost {
  return {
    version: () => '1.2.3',
    isPreview: () => false,
    updateAvailable: () => false,
    updatesEnabled: true,
    checkForUpdate: () => Promise.resolve(),
    activateUpdate: () => Promise.resolve(),
    ...overrides,
  };
}

function render(host: PluginHost) {
  TestBed.configureTestingModule({
    imports: [TestbedAboutDialog, transloco()],
    providers: [
      provideProductIdentity({ name: 'TestbedWeaver', tagline: 'product.tagline', logoUrl: 'testbed.png' }),
      { provide: DialogRef, useValue: new DialogRef(host) },
    ],
  });
  const fixture = TestBed.createComponent(TestbedAboutDialog);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('TestbedAboutDialog', () => {
  it('shows the product identity and the running version from ctx.host', () => {
    const host = render(hostStub());
    expect(host.querySelector('h2')?.textContent?.trim()).toBe('TestbedWeaver');
    expect(host.textContent).toContain('A tree editor');
    expect(host.textContent).toContain('v1.2.3');
  });

  it('hides the update button when updates are unavailable', () => {
    const host = render(hostStub({ updatesEnabled: false }));
    expect(host.querySelector('lw-button')).toBeNull();
  });

  it('checks for an update when none is downloaded yet', () => {
    const check = vi.fn(() => Promise.resolve());
    const host = render(hostStub({ updateAvailable: () => false, checkForUpdate: check }));
    const button = host.querySelector('lw-button') as HTMLElement;
    expect(button.textContent?.trim()).toBe('Check');
    button.click();
    expect(check).toHaveBeenCalledTimes(1);
  });

  it('activates the downloaded update when one is ready', () => {
    const activate = vi.fn(() => Promise.resolve());
    const host = render(hostStub({ updateAvailable: () => true, activateUpdate: activate }));
    const button = host.querySelector('lw-button') as HTMLElement;
    expect(button.textContent?.trim()).toBe('Reload');
    button.click();
    expect(activate).toHaveBeenCalledTimes(1);
  });
});
