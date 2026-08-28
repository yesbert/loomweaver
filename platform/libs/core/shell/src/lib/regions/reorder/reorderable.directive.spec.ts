import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { Reorderable } from './reorderable.directive';
import type { MockInstance } from 'vitest';

const EN = { reorder: { announce: '{{label}} — {{position}}/{{total}}' } };

@Component({
  imports: [Reorderable],
  template: `
    <div
      [lwReorderable]="'c'"
      [lwReorderableEnabled]="enabled()"
      (reorder)="last.set($event)"
    >
      @for (item of items(); track item.id) {
        <button
          [attr.data-reorder-id]="item.id"
          [attr.data-reorder-band]="item.band"
        >
          {{ item.id }}
        </button>
      }
    </div>
  `,
})
class HostCmp {
  readonly items = signal([
    { id: 'a', band: 'top' },
    { id: 'b', band: 'top' },
    { id: 'c', band: 'top' },
    { id: 'z', band: 'bottom' },
  ]);
  readonly enabled = signal(true);
  readonly last = signal<string[] | null>(null);
}

describe('Reorderable (keyboard)', () => {
  let fixture: ComponentFixture<HostCmp>;
  let host: HostCmp;
  let announce: MockInstance;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HostCmp,
        TranslocoTestingModule.forRoot({
          langs: { en: EN },
          translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
          preloadLangs: true,
        }),
      ],
    });
    fixture = TestBed.createComponent(HostCmp);
    host = fixture.componentInstance;
    announce = vi.spyOn(TestBed.inject(LiveAnnouncer), 'announce');
    fixture.detectChanges();
  });

  function btn(id: string): HTMLElement {
    return fixture.nativeElement.querySelector(`[data-reorder-id="${id}"]`);
  }

  function altArrow(id: string, key: string): void {
    btn(id).focus();
    btn(id).dispatchEvent(
      new KeyboardEvent('keydown', { key, altKey: true, bubbles: true }),
    );
  }

  it('Alt+ArrowRight moves the focused item toward the end within its band', () => {
    altArrow('a', 'ArrowRight');
    expect(host.last()).toEqual(['b', 'a', 'c', 'z']);
  });

  it('announces the new position from the i18n bundle, not a hardcoded string', () => {
    altArrow('a', 'ArrowRight');
    expect(announce).toHaveBeenCalledWith('a — 2/3');
  });

  it('Alt+ArrowLeft moves it toward the start', () => {
    altArrow('c', 'ArrowLeft');
    expect(host.last()).toEqual(['a', 'c', 'b', 'z']);
  });

  it('does not cross a band boundary (item at the band edge stays put)', () => {
    altArrow('c', 'ArrowRight');
    expect(host.last()).toBeNull();
  });

  it('ignores arrows without Alt (leaves normal navigation alone)', () => {
    btn('a').focus();
    btn('a').dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
    );
    expect(host.last()).toBeNull();
  });

  it('does nothing when disabled', () => {
    host.enabled.set(false);
    fixture.detectChanges();
    altArrow('a', 'ArrowRight');
    expect(host.last()).toBeNull();
  });
});
