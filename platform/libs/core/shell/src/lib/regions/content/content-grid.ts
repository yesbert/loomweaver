import { Component, CUSTOM_ELEMENTS_SCHEMA, computed, effect, inject, untracked } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ContentArea } from './content-area';
import { findLeaf } from '../pane/tree/pane-queries';
import { PaneTreeView } from '../pane/pane-tree-view';
import { PaneChromeService } from '../pane/chrome/pane-chrome.service';
import { CONTENT_DOCK } from '../pane/tree/pane-address';
import { PaneTreeService } from '../pane/tree/pane-tree.service';

@Component({
  selector: 'lw-content-grid',
  imports: [ContentArea, PaneTreeView],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: {
    class: 'flex min-h-0 min-w-0 overflow-hidden',
    '[class.relative]': '!maximized()',
    '[class.fixed]': 'maximized()',
    '[class.inset-0]': 'maximized()',
    '[class.z-40]': 'maximized()',
    '[class.bg-surface]': 'maximized()',
  },
  templateUrl: './content-grid.html',
})
export class ContentGrid {
  private readonly layout = inject(PaneTreeService);
  private readonly chrome = inject(PaneChromeService);

  protected readonly contentDock = CONTENT_DOCK;

  private readonly maximizedPaneId = computed(() =>
    this.chrome.maximizedPaneIn(CONTENT_DOCK),
  );
  protected readonly maximized = computed(
    () => this.maximizedPaneId() !== null,
  );

  protected readonly tree = computed(() => {
    const full = this.layout.tree(CONTENT_DOCK);
    const paneId = this.maximizedPaneId();
    return paneId === null ? full : (findLeaf(full, paneId) ?? full);
  });

  constructor() {
    const document_ = inject(DOCUMENT);
    const onKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        this.chrome.restore();
      }
    };
    effect((onCleanup) => {
      if (!this.maximized()) {
        return;
      }
      document_.addEventListener('keydown', onKeydown);
      onCleanup(() => document_.removeEventListener('keydown', onKeydown));
    });
    effect(() => {
      if (!this.layout.isSplit(CONTENT_DOCK)) {
        untracked(() => this.chrome.clearMinimized(CONTENT_DOCK));
      }
    });
  }
}
