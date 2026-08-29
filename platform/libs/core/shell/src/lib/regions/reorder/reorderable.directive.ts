import { Directive, ElementRef, inject, input, output } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { TranslocoService } from '@jsverse/transloco';

@Directive({
  selector: '[lwReorderable]',
  host: { '(keydown)': 'onKeydown($event)' },
})
export class Reorderable {
  readonly containerId = input.required<string>({ alias: 'lwReorderable' });
  readonly enabled = input(true, { alias: 'lwReorderableEnabled' });

  readonly reorder = output<string[]>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);
  private readonly announcer = inject(LiveAnnouncer);
  private readonly transloco = inject(TranslocoService);

  protected onKeydown(event: KeyboardEvent): void {
    if (!this.enabled() || !event.altKey || event.shiftKey) {
      return;
    }
    let direction = 0;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      direction = 1;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      direction = -1;
    }
    if (direction === 0) {
      return;
    }
    const active = this.document.activeElement as HTMLElement | null;
    const item = active?.closest<HTMLElement>('[data-reorder-id]');
    if (!item || !this.host.nativeElement.contains(item)) {
      return;
    }
    if (this.moveByKeyboard(item, direction)) {
      event.preventDefault();
      const id = item.dataset['reorderId'] ?? '';
      setTimeout(() => this.focusItem(id), 0);
    }
  }

  private items(): HTMLElement[] {
    return [
      ...this.host.nativeElement.querySelectorAll<HTMLElement>(
        '[data-reorder-id]',
      ),
    ];
  }

  private moveByKeyboard(item: HTMLElement, direction: number): boolean {
    const id = item.dataset['reorderId'] ?? '';
    const band = item.dataset['reorderBand'] ?? '';
    const inBand = this.items().filter(
      (element) => (element.dataset['reorderBand'] ?? '') === band,
    );
    const bandIds = inBand.map((element) => element.dataset['reorderId'] ?? '');
    const target = bandIds.indexOf(id) + direction;
    if (target < 0 || target >= bandIds.length) {
      return false;
    }
    const neighbourId = bandIds[target];
    const without = this.items()
      .map((element) => element.dataset['reorderId'] ?? '')
      .filter((x) => x !== id);
    const insertAt = without.indexOf(neighbourId) + (direction > 0 ? 1 : 0);
    without.splice(insertAt, 0, id);
    this.reorder.emit(without);
    const label =
      item.getAttribute('aria-label') ?? item.textContent?.trim() ?? id;
    void this.announcer.announce(
      this.transloco.translate('reorder.announce', {
        label,
        position: target + 1,
        total: bandIds.length,
      }),
    );
    return true;
  }

  private focusItem(id: string): void {
    this.items()
      .find((element) => (element.dataset['reorderId'] ?? '') === id)
      ?.focus();
  }
}
