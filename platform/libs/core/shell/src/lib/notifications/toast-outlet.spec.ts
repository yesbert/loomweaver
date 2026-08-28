import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { ToastOutlet } from './toast-outlet';
import { NotificationService } from './notification.service';

function transloco() {
  return TranslocoTestingModule.forRoot({
    langs: {
      en: { notification: { dismiss: 'Dismiss', region: 'Notifications' } },
    },
    translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
    preloadLangs: true,
  });
}

function setup() {
  TestBed.configureTestingModule({
    imports: [ToastOutlet, transloco()],
    providers: [],
  });
  const service = TestBed.inject(NotificationService);
  const fixture = TestBed.createComponent(ToastOutlet);
  const render = () => {
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };
  return { service, fixture, render };
}

describe('ToastOutlet', () => {
  it('renders nothing while there are no notifications', () => {
    const { render } = setup();
    expect(render().querySelector('[role="status"]')).toBeNull();
  });

  it('renders a toast message', () => {
    const { service, render } = setup();
    service.show({ message: 'Saved' });
    expect(render().querySelector('[role="status"]')?.textContent).toContain(
      'Saved',
    );
  });

  it('announces error toasts assertively (role=alert) with a severity colour', () => {
    const { service, render } = setup();
    service.show({ message: 'Boom', kind: 'error' });
    const host = render();

    expect(host.querySelector('[role="alert"]')).not.toBeNull();
    expect(host.querySelector('[role="status"]')).toBeNull();
    expect(host.querySelector('lw-icon')?.className).toContain('text-negative');
  });

  it('keeps info toasts polite (role=status)', () => {
    const { service, render } = setup();
    service.show({ message: 'FYI', kind: 'info' });
    const host = render();

    expect(host.querySelector('[role="status"]')).not.toBeNull();
    expect(host.querySelector('[role="alert"]')).toBeNull();
  });

  it('runs the action then dismisses the toast', () => {
    const { service, render } = setup();
    let ran = 0;
    service.show({
      id: 't',
      message: 'Update',
      action: { label: 'Reload', run: () => (ran += 1) },
    });
    const host = render();
    const actionButton = host.querySelector(
      '[role="status"] button',
    ) as HTMLButtonElement;

    actionButton.click();

    expect(ran).toBe(1);
    expect(service.notifications()).toHaveLength(0);
  });
});
