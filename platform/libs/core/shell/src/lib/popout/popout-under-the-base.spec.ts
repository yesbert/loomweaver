import { APP_BASE_HREF, DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { DialogService } from '../dialog/dialog.service';
import { PopoutService } from './popout.service';

describe('a pop-out of a distribution served under a path', () => {
  let opened: unknown[];

  function servedUnder(base: string, pathname: string): PopoutService {
    opened = [];
    TestBed.configureTestingModule({
      providers: [
        { provide: APP_BASE_HREF, useValue: base },
        {
          provide: DOCUMENT,
          useValue: {
            location: { pathname },
            defaultView: {
              open: (...args: unknown[]) => {
                opened.push(args);
                return {};
              },
            },
          },
        },
        { provide: DialogService, useValue: { confirm: vi.fn() } },
        {
          provide: TranslocoService,
          useValue: { translate: (key: string) => key },
        },
      ],
    });
    return TestBed.inject(PopoutService);
  }

  it('opens under the base', () => {
    servedUnder('/x/', '/x/doc/main').open('doc/main');

    expect(opened).toEqual([['/x/popout/doc/main', '_blank']]);
  });

  it('opens a view under the base', () => {
    servedUnder('/x/', '/x/').open('view:testbed.outline');

    expect(opened).toEqual([['/x/popout/view/testbed.outline', '_blank']]);
  });

  it('knows it is a pop-out below the base', () => {
    expect(servedUnder('/x/', '/x/popout/doc/main').active).toBe(true);
  });

  it('is not a pop-out at an address of the base that merely starts alike', () => {
    expect(servedUnder('/x/', '/x/popouts/doc').active).toBe(false);
  });

  it('opens where it always did at the root', () => {
    servedUnder('/', '/doc/main').open('doc/main');

    expect(opened).toEqual([['/popout/doc/main', '_blank']]);
  });
});
