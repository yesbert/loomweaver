import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  afterRenderEffect,
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { ContributionRegistry } from '../../contributions/contribution-registry';
import { BarItem, BarSlot } from '../../foundation/bar-item';
import { LayoutRegion } from '../../layout/layout';
import { AuthContext } from '../../auth/auth-context';
import { SlotResolution } from '../../menu/slot-resolution.service';
import { ShellBarItem } from './shell-bar-item';
import { barMenuContext, isBarButton } from './bar-context';
import {
  closeOnOutsidePointer,
  entryWidth,
  FOLD_CONTROL_PX,
  foldedIds,
  foldRank,
  sameIds,
} from './bar-fold';

const GAP_PX = 8;

function availableWidth(bar: HTMLElement): number {
  const style = getComputedStyle(bar);
  return (
    bar.clientWidth -
    Number.parseFloat(style.paddingLeft || '0') -
    Number.parseFloat(style.paddingRight || '0')
  );
}

@Component({
  selector: 'lw-shell-bar',
  imports: [ShellBarItem, TranslocoPipe],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './shell-bar.html',
})
export class ShellBar {
  readonly region = input.required<LayoutRegion>();

  private readonly registry = inject(ContributionRegistry);
  private readonly auth = inject(AuthContext);
  private readonly slots = inject(SlotResolution);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);

  private readonly bar = viewChild<ElementRef<HTMLElement>>('bar');
  private readonly tray = viewChild<ElementRef<HTMLElement>>('tray');
  private readonly foldControl =
    viewChild<ElementRef<HTMLButtonElement>>('foldControl');

  private readonly widths = new Map<string, number>();
  private observer?: ResizeObserver;

  private stopOutside?: () => void;
  private controlWidth = FOLD_CONTROL_PX;

  private readonly folded = signal<readonly string[]>([], { equal: sameIds });
  protected readonly trayOpen = signal(false);

  protected readonly dock = computed(() => this.region().dock);

  protected readonly footer = computed(
    () => this.dock() === 'left' || this.dock() === 'right',
  );

  protected readonly anchorName = computed(
    () => `--lw-bar-fold-${this.region().id.replaceAll(/[^a-zA-Z0-9-]/g, '-')}`,
  );

  protected readonly trayId = computed(() => `lw-bar-tray-${this.region().id}`);

  private readonly contributed = computed<readonly BarItem[]>(() => {
    const here = this.registry
      .barItems()
      .filter((item) => item.bar === this.region().id);
    const cells = here.filter(
      (item) => !isBarButton(item) && this.auth.visible(item.access),
    );
    const buttons = this.slots
      .resolve(here.filter((item) => isBarButton(item)), barMenuContext)
      .map((entry) => entry.item);
    return [...cells, ...buttons];
  });

  protected readonly startItems = computed(() => this.inBar('start'));
  protected readonly centerItems = computed(() => this.inBar('center'));
  protected readonly endItems = computed(() => this.inBar('end'));

  protected readonly foldedItems = computed<readonly BarItem[]>(() => {
    const folded = new Set(this.folded());
    return (['start', 'center', 'end'] as const).flatMap((slot) =>
      this.bySlot(slot).filter((item) => folded.has(item.id)),
    );
  });

  constructor() {
    afterRenderEffect(() => {
      this.contributed();
      this.folded();
      this.measure();
    });
    afterNextRender(() => this.observeResize());
    effect(() => {
      if (this.folded().length === 0) {
        untracked(() => this.closeTray());
      }
    });
    afterRenderEffect(() => {
      if (this.trayOpen()) {
        this.tray()
          ?.nativeElement.querySelector<HTMLElement>(
            'a[href], button, [tabindex]',
          )
          ?.focus();
      }
    });
    this.destroyRef.onDestroy(() => this.stopListeningOutside());
  }

  protected toggleTray(): void {
    if (this.trayOpen()) {
      this.closeTray();
    } else {
      this.openTray();
    }
  }

  protected closeTray(): void {
    if (!this.trayOpen()) {
      return;
    }
    this.trayOpen.set(false);
    this.stopListeningOutside();
    this.foldControl()?.nativeElement.focus();
  }

  private openTray(): void {
    this.trayOpen.set(true);
    this.stopOutside = closeOnOutsidePointer(
      this.document,
      (target) =>
        this.tray()?.nativeElement.contains(target) === true ||
        this.foldControl()?.nativeElement.contains(target) === true,
      () => this.closeTray(),
    );
    this.document.addEventListener('keydown', this.onEscape);
  }

  private readonly onEscape = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && !event.defaultPrevented) {
      this.closeTray();
    }
  };

  private stopListeningOutside(): void {
    this.stopOutside?.();
    this.stopOutside = undefined;
    this.document.removeEventListener('keydown', this.onEscape);
  }

  private inBar(slot: BarSlot): BarItem[] {
    const folded = new Set(this.folded());
    return this.bySlot(slot).filter((item) => !folded.has(item.id));
  }

  private bySlot(slot: BarSlot): BarItem[] {
    return this.contributed()
      .filter((item) => item.slot === slot)
      .toSorted((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  private observeResize(): void {
    const element = this.bar()?.nativeElement;
    if (!element || typeof ResizeObserver === 'undefined') {
      return;
    }
    const observer = new ResizeObserver(() => this.measure());
    observer.observe(element);
    this.observer = observer;
    this.destroyRef.onDestroy(() => observer.disconnect());
  }

  private measure(): void {
    const bar = this.bar()?.nativeElement;
    if (!bar) {
      return;
    }
    this.observeEntries(bar);
    this.measureFoldControl();
    const available = availableWidth(bar);
    this.folded.set(
      available > 0
        ? foldedIds(foldRank(this.contributed()), {
            available,
            control: this.controlWidth,
            gap: GAP_PX,
            widthOf: (id) => this.widths.get(id),
          })
        : [],
    );
  }

  private observeEntries(bar: HTMLElement): void {
    for (const host of bar.querySelectorAll<HTMLElement>('[data-bar-entry]')) {
      this.observer?.observe(host);
      this.widths.set(host.dataset['barEntry'] ?? '', entryWidth(host));
    }
  }

  private measureFoldControl(): void {
    const control = this.foldControl()?.nativeElement;
    if (control) {
      this.controlWidth = control.getBoundingClientRect().width;
    }
  }
}
