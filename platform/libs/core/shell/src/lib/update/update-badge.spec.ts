import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { UpdateBadge } from './update-badge';
import { UpdateService } from './update.service';

function transloco() {
  return TranslocoTestingModule.forRoot({
    langs: {
      en: {
        update: {
          check: 'Check for updates',
          available: 'Update available — reload',
          failed: "Update couldn't be installed — reload to retry",
          broken: "This app's offline cache is broken. Repairing rebuilds it from scratch.",
        },
      },
    },
    translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
    preloadLangs: true,
  });
}

function setup(opts: {
  enabled: boolean;
  available: boolean;
  failed?: boolean;
  broken?: boolean;
}) {
  const fake = {
    enabled: opts.enabled,
    updateAvailable: signal(opts.available),
    updateFailed: signal(opts.failed ?? false),
    updateBroken: signal(opts.broken ?? false),
    checkForUpdate: vi.fn(),
    activateUpdate: vi.fn(),
  };
  TestBed.configureTestingModule({
    imports: [UpdateBadge, transloco()],
    providers: [{ provide: UpdateService, useValue: fake }],
  });
  const fixture = TestBed.createComponent(UpdateBadge);
  fixture.detectChanges();
  return { fixture, host: fixture.nativeElement as HTMLElement, fake };
}

describe('UpdateBadge', () => {
  it('renders nothing when updates are unavailable (no service worker)', () => {
    const { host } = setup({ enabled: false, available: false });
    expect(host.querySelector('button')).toBeNull();
  });

  it('shows a quiet check button and checks for updates on click', () => {
    const { host, fake } = setup({ enabled: true, available: false });
    const button = host.querySelector('button') as HTMLButtonElement;
    expect(button.getAttribute('aria-label')).toBe('Check for updates');

    button.click();

    expect(fake.checkForUpdate).toHaveBeenCalled();
    expect(fake.activateUpdate).not.toHaveBeenCalled();
  });

  it('shows a badge dot and reloads on click when an update is ready', () => {
    const { host, fake } = setup({ enabled: true, available: true });
    const button = host.querySelector('button') as HTMLButtonElement;
    expect(button.getAttribute('aria-label')).toBe('Update available — reload');
    expect(button.querySelector('span[aria-hidden="true"]')).not.toBeNull();

    button.click();

    expect(fake.activateUpdate).toHaveBeenCalled();
    expect(fake.checkForUpdate).not.toHaveBeenCalled();
  });

  it('shows a caution dot and reloads on click when installing an update failed', () => {
    const { host, fake } = setup({
      enabled: true,
      available: false,
      failed: true,
    });
    const button = host.querySelector('button') as HTMLButtonElement;
    expect(button.getAttribute('aria-label')).toBe(
      "Update couldn't be installed — reload to retry",
    );
    const dot = button.querySelector('span[aria-hidden="true"]');
    expect(dot?.classList.contains('bg-caution')).toBe(true);
    expect(dot?.classList.contains('bg-brand')).toBe(false);

    button.click();

    expect(fake.activateUpdate).toHaveBeenCalled();
    expect(fake.checkForUpdate).not.toHaveBeenCalled();
  });

  it('names the broken cache rather than a failed update when the worker is beyond repair', () => {
    const { host } = setup({
      enabled: true,
      available: false,
      failed: true,
      broken: true,
    });
    const button = host.querySelector('button') as HTMLButtonElement;
    expect(button.getAttribute('aria-label')).toBe(
      "This app's offline cache is broken. Repairing rebuilds it from scratch.",
    );
  });
});
