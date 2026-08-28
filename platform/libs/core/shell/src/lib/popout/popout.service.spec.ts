import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { DialogService } from '../dialog/dialog.service';
import { PopoutService } from './popout.service';
import type { Mock } from 'vitest';

describe('PopoutService', () => {
  let opened: unknown[];
  let openResult: unknown;
  let confirmResult: boolean;
  let confirm: Mock;

  function configure(pathname: string): PopoutService {
    opened = [];
    const document = {
      location: { pathname },
      defaultView: {
        open: (...args: unknown[]) => {
          opened.push(args);
          return openResult;
        },
      },
    };
    confirm = vi.fn(() => Promise.resolve(confirmResult));
    TestBed.configureTestingModule({
      providers: [
        { provide: DOCUMENT, useValue: document },
        { provide: DialogService, useValue: { confirm } },
        {
          provide: TranslocoService,
          useValue: { translate: (key: string) => key },
        },
      ],
    });
    return TestBed.inject(PopoutService);
  }

  beforeEach(() => {
    openResult = {};
    confirmResult = false;
  });

  it('is inactive in a normal window', () => {
    expect(configure('/doc/main').active).toBe(false);
  });

  it('is active when the location carries the pop-out prefix', () => {
    expect(configure('/popout/view/testbed.outline').active).toBe(true);
  });

  it('opens a view target in a new window', () => {
    configure('/').open('view:testbed.outline');

    expect(opened).toEqual([['/popout/view/testbed.outline', '_blank']]);
    expect(confirm).not.toHaveBeenCalled();
  });

  it('offers a retry dialog when the pop-up blocker swallows the window', async () => {
    openResult = null;
    confirmResult = true;
    const popout = configure('/');

    popout.open('doc/main');
    await Promise.resolve();
    await Promise.resolve();

    expect(confirm).toHaveBeenCalledTimes(1);
    expect(opened).toHaveLength(2);
  });

  it('does not retry when the user dismisses the blocker dialog', async () => {
    openResult = null;
    confirmResult = false;
    const popout = configure('/');

    popout.open('doc/main');
    await Promise.resolve();
    await Promise.resolve();

    expect(opened).toHaveLength(1);
  });
});
