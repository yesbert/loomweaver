import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { ToastOutlet } from './toast-outlet';
import { NotificationService } from './notification.service';
import { TOAST_POSITION, ToastPosition } from './toast-options';

function transloco() {
  return TranslocoTestingModule.forRoot({
    langs: {
      en: {
        notification: {
          dismiss: 'Dismiss',
          region: 'Notifications',
          repeated: 'Raised {{count}} times',
        },
      },
    },
    translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
    preloadLangs: true,
  });
}

function setup(position?: ToastPosition) {
  TestBed.configureTestingModule({
    imports: [ToastOutlet, transloco()],
    providers: position
      ? [{ provide: TOAST_POSITION, useValue: position }]
      : [],
  });
  const service = TestBed.inject(NotificationService);
  const fixture = TestBed.createComponent(ToastOutlet);
  const render = () => {
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };
  const region = () => render().querySelector('section') as HTMLElement;
  const cards = () =>
    [...render().querySelectorAll<HTMLElement>('[role]')];
  const movePointerOn = (card: HTMLElement) =>
    card.dispatchEvent(new Event('pointermove'));
  return { service, fixture, render, region, cards, movePointerOn };
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

  it('announces a warning assertively too', () => {
    const { service, render } = setup();
    service.show({ message: 'Careful', kind: 'warning' });
    expect(render().querySelector('[role="alert"]')).not.toBeNull();
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

  it('dismisses from a real button, which the keyboard reaches', () => {
    const { service, render } = setup();
    service.show({ message: 'Saved' });
    const dismiss = render().querySelector(
      'button[aria-label="Dismiss"]',
    ) as HTMLButtonElement;

    expect(dismiss.type).toBe('button');
    dismiss.click();
    expect(service.notifications()).toHaveLength(0);
  });

  describe('kind', () => {
    it.each([
      ['info', 'info', 'text-info', 'bg-info/10', 'border-info/40'],
      [
        'success',
        'success',
        'text-positive',
        'bg-positive/10',
        'border-positive/40',
      ],
      [
        'warning',
        'warning',
        'text-caution',
        'bg-caution/10',
        'border-caution/40',
      ],
      [
        'error',
        'error',
        'text-negative',
        'bg-negative/10',
        'border-negative/40',
      ],
    ] as const)(
      'shows a %s by its icon and by the colour of the card',
      (kind, icon, text, tint, edge) => {
        const { service, cards } = setup();
        service.show({ message: 'm', kind });
        const card = cards()[0];
        const symbol = card.querySelector('lw-icon') as HTMLElement & {
          name: string;
        };

        expect(symbol.name).toBe(icon);
        expect(symbol.className).toContain(text);
        expect(card.className).toContain(edge);
        expect(card.firstElementChild?.className).toContain(tint);
      },
    );

    it("shows a named icon in the kind's colour and keeps the kind's role", () => {
      const { service, cards } = setup();
      service.show({ message: 'Synced', kind: 'warning', icon: 'refresh' });
      const card = cards()[0];
      const symbol = card.querySelector('lw-icon') as HTMLElement & {
        name: string;
      };

      expect(symbol.name).toBe('refresh');
      expect(symbol.className).toContain('text-caution');
      expect(card.getAttribute('role')).toBe('alert');
    });
  });

  describe('count', () => {
    it('shows no count on a toast raised once', () => {
      const { service, cards } = setup();
      service.show({ message: 'Saved' });
      expect(cards()[0].textContent).not.toContain('×');
    });

    it('shows how often a repeated toast was raised, worded for a screen reader', () => {
      const { service, cards } = setup();
      service.show({ message: 'Saving failed', kind: 'error' });
      service.show({ message: 'Saving failed', kind: 'error' });
      service.show({ message: 'Saving failed', kind: 'error' });
      const card = cards()[0];

      expect(card.querySelector('span[aria-hidden="true"]')?.textContent).toBe(
        '×3',
      );
      expect(card.querySelector('.sr-only')?.textContent).toBe(
        'Raised 3 times',
      );
    });
  });

  describe('position', () => {
    it('sits at the bottom right where the distribution chose nothing', () => {
      const { service, region } = setup();
      service.show({ message: 'm' });
      const classes = region().className;

      expect(classes).toContain('bottom-0');
      expect(classes).toContain('md:items-end');
    });

    it.each([
      ['top-left', 'top-0', 'md:items-start'],
      ['top-right', 'top-0', 'md:items-end'],
      ['bottom-left', 'bottom-0', 'md:items-start'],
      ['bottom-right', 'bottom-0', 'md:items-end'],
    ] as const)('places %s at the edge and the side', (position, edge, side) => {
      const { service, region } = setup(position);
      service.show({ message: 'm' });
      const classes = region().className.split(' ');

      expect(classes).toContain(edge);
      expect(classes).toContain(side);
    });

    it.each(['top-center', 'bottom-center'] as const)(
      'centres %s on every width',
      (position) => {
        const { service, region } = setup(position);
        service.show({ message: 'm' });
        const classes = region().className.split(' ');

        expect(classes).toContain('items-center');
        expect(classes).not.toContain('md:items-start');
        expect(classes).not.toContain('md:items-end');
      },
    );

    it('centres the toasts across the width until the viewport is wide', () => {
      const { service, region } = setup('top-left');
      service.show({ message: 'm' });
      const classes = region().className.split(' ');

      expect(classes).toContain('inset-x-0');
      expect(classes).toContain('items-center');
    });

    it('puts the newest toast last at the bottom edge, nearest the edge', () => {
      const { service, cards } = setup('bottom-right');
      service.show({ message: 'older' });
      service.show({ message: 'newer' });

      expect(cards().map((card) => card.textContent?.trim())).toEqual([
        'older',
        'newer',
      ]);
    });

    it('puts the newest toast first at the top edge, nearest the edge', () => {
      const { service, cards } = setup('top-right');
      service.show({ message: 'older' });
      service.show({ message: 'newer' });

      expect(cards().map((card) => card.textContent?.trim())).toEqual([
        'newer',
        'older',
      ]);
    });

    it('lets a toast enter from the edge it sits at', () => {
      const top = setup('top-center');
      top.service.show({ message: 'm' });
      expect(top.cards()[0].className).toContain('starting:-translate-y-2');
    });
  });

  describe('hold', () => {
    const dismissButtonsIn = (region: HTMLElement) => [
      ...region.querySelectorAll<HTMLButtonElement>(
        'button[aria-label="Dismiss"]',
      ),
    ];

    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('holds the toasts once the pointer moves on one', () => {
      const { service, cards, movePointerOn } = setup();
      service.show({ message: 'read me', timeoutMs: 1000 });
      service.show({ message: 'me too', timeoutMs: 1000 });

      movePointerOn(cards()[0]);
      vi.advanceTimersByTime(60_000);

      expect(service.notifications()).toHaveLength(2);
    });

    it('lets them leave a moment after the pointer has left', () => {
      const { service, region, cards, movePointerOn } = setup();
      service.show({ message: 'read me', timeoutMs: 1000 });

      movePointerOn(cards()[0]);
      vi.advanceTimersByTime(60_000);
      region().dispatchEvent(new Event('pointerleave'));

      vi.advanceTimersByTime(999);
      expect(service.notifications()).toHaveLength(1);
      vi.advanceTimersByTime(1);
      expect(service.notifications()).toHaveLength(0);
    });

    it('holds the toasts while keyboard focus is in one', () => {
      const { service, region } = setup();
      service.show({ message: 'read me', timeoutMs: 1000 });

      dismissButtonsIn(region())[0].focus();
      vi.advanceTimersByTime(60_000);

      expect(service.notifications()).toHaveLength(1);
    });

    it('lets them leave once focus has moved out of the toasts', () => {
      const { service, region } = setup();
      service.show({ message: 'read me', timeoutMs: 1000 });
      const [button] = dismissButtonsIn(region());

      button.focus();
      vi.advanceTimersByTime(60_000);
      button.blur();
      vi.advanceTimersByTime(1000);

      expect(service.notifications()).toHaveLength(0);
    });

    it('keeps holding while focus moves between two toasts', () => {
      const { service, region } = setup();
      service.show({ message: 'one', timeoutMs: 1000 });
      service.show({ message: 'two', timeoutMs: 1000 });
      const [first, second] = dismissButtonsIn(region());

      first.focus();
      second.focus();
      vi.advanceTimersByTime(60_000);

      expect(service.notifications()).toHaveLength(2);
    });

    it('keeps holding when the pointer leaves while focus is still inside', () => {
      const { service, region, cards, movePointerOn } = setup();
      service.show({ message: 'read me', timeoutMs: 1000 });

      dismissButtonsIn(region())[0].focus();
      movePointerOn(cards()[0]);
      region().dispatchEvent(new Event('pointerleave'));
      vi.advanceTimersByTime(60_000);

      expect(service.notifications()).toHaveLength(1);
    });

    it('keeps holding when focus leaves while the pointer is on a toast', () => {
      const { service, region, cards, movePointerOn } = setup();
      service.show({ message: 'read me', timeoutMs: 1000 });
      const [button] = dismissButtonsIn(region());

      movePointerOn(cards()[0]);
      button.focus();
      button.blur();
      vi.advanceTimersByTime(60_000);

      expect(service.notifications()).toHaveLength(1);
    });

    it('ends the pointer\'s attention when the toast under it is dismissed by pointer, with no leave event', () => {
      const { service, region, cards, movePointerOn, render } = setup();
      service.show({ message: 'one', timeoutMs: 1000 });
      service.show({ message: 'two', timeoutMs: 1000 });
      const [dismissOne] = dismissButtonsIn(region());

      movePointerOn(cards()[0]);
      dismissOne.focus();
      vi.advanceTimersByTime(60_000);
      dismissOne.dispatchEvent(new MouseEvent('click', { detail: 1 }));
      render();

      vi.advanceTimersByTime(1000);
      expect(service.notifications()).toHaveLength(0);
    });

    it('ends the pointer\'s attention when the application dismisses the toast under it', () => {
      const { service, cards, movePointerOn, render } = setup();
      const one = service.show({ message: 'one', timeoutMs: 0 });
      service.show({ message: 'two', timeoutMs: 1000 });

      movePointerOn(cards()[0]);
      vi.advanceTimersByTime(60_000);
      service.dismiss(one);
      render();

      vi.advanceTimersByTime(1000);
      expect(service.notifications()).toHaveLength(0);
    });

    it('ends the pointer\'s attention when the toast under it is dismissed from the keyboard and focus then leaves', () => {
      const { service, region, cards, movePointerOn, render } = setup();
      service.show({ message: 'one', timeoutMs: 0 });
      service.show({ message: 'two', timeoutMs: 1000 });
      const [dismissOne, dismissTwo] = dismissButtonsIn(region());

      movePointerOn(cards()[0]);
      dismissOne.focus();
      dismissOne.click();
      render();
      vi.advanceTimersByTime(60_000);
      expect(service.notifications()).toHaveLength(1);

      dismissTwo.blur();
      vi.advanceTimersByTime(1000);
      expect(service.notifications()).toHaveLength(0);
    });

    it('holds again when the pointer moves on a remaining toast after a dismissal by pointer', () => {
      const { service, region, cards, movePointerOn, render } = setup();
      service.show({ message: 'one', timeoutMs: 1000 });
      service.show({ message: 'two', timeoutMs: 1000 });

      movePointerOn(cards()[0]);
      dismissButtonsIn(region())[0].dispatchEvent(
        new MouseEvent('click', { detail: 1 }),
      );
      render();
      movePointerOn(cards()[0]);
      vi.advanceTimersByTime(60_000);

      expect(service.notifications()).toHaveLength(1);
    });

    it('forgets the pointer when the toasts were gone in between', () => {
      const { service, region, cards, movePointerOn, render } = setup();
      const first = service.show({ message: 'first', timeoutMs: 0 });
      movePointerOn(cards()[0]);
      service.dismiss(first);
      render();

      service.show({ message: 'second', timeoutMs: 1000 });
      const [button] = dismissButtonsIn(region());
      button.focus();
      button.blur();
      vi.advanceTimersByTime(1000);

      expect(service.notifications()).toHaveLength(0);
    });

    it('moves focus to the toast that follows the one dismissed from the keyboard, and keeps holding', () => {
      const { service, region, render } = setup();
      for (const message of ['one', 'two', 'three']) {
        service.show({ message, timeoutMs: 1000 });
      }
      const buttons = dismissButtonsIn(region());

      buttons[1].focus();
      buttons[1].click();
      render();
      vi.advanceTimersByTime(60_000);

      expect(document.activeElement).toBe(buttons[2]);
      expect(service.notifications().map((toast) => toast.message)).toEqual([
        'one',
        'three',
      ]);
    });

    it('moves focus to the toast before when the last one on screen is dismissed from the keyboard', () => {
      const { service, region, render } = setup();
      for (const message of ['one', 'two', 'three']) {
        service.show({ message, timeoutMs: 0 });
      }
      const buttons = dismissButtonsIn(region());

      buttons[2].focus();
      buttons[2].click();
      render();

      expect(document.activeElement).toBe(buttons[1]);
    });

    it('hands the focus on before it runs the action of a toast', () => {
      const { service, region } = setup();
      const focusedWhenRun: (Element | null)[] = [];
      service.show({
        message: 'with action',
        timeoutMs: 0,
        action: {
          label: 'Go',
          run: () => {
            focusedWhenRun.push(document.activeElement);
          },
        },
      });
      service.show({ message: 'neighbour', timeoutMs: 0 });
      const section = region();
      const action = section.querySelector(
        'button:not([aria-label])',
      ) as HTMLButtonElement;

      action.focus();
      action.click();

      expect(focusedWhenRun).toEqual([dismissButtonsIn(section)[1]]);
    });

    it('ends the hold when the last toast is dismissed from the keyboard', () => {
      const { service, region, render } = setup();
      service.show({ message: 'only', timeoutMs: 1000 });
      const [dismiss] = dismissButtonsIn(region());

      dismiss.focus();
      dismiss.click();
      render();
      service.show({ message: 'next', timeoutMs: 1000 });
      vi.advanceTimersByTime(1000);

      expect(service.notifications()).toHaveLength(0);
    });
  });
});
