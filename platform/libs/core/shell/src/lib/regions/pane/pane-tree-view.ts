import { Component, TemplateRef, computed, forwardRef, inject, input, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { PaneNode, PaneSplit, leafPath } from './tree/pane-node';
import { PaneTreeService } from './tree/pane-tree.service';
import { PaneChromeService } from './chrome/pane-chrome.service';
import { PaneView } from './pane-view';
import { CONTENT_PANE_OPTIONS, PaneViewOptions } from './pane-view-options';
import { PaneDropZones } from './drag/pane-drop-zones';
import { PaneMinimizedStrip } from './chrome/pane-minimized-strip';
import { PaneSplitHandle } from './chrome/pane-split-handle';
import { RetainedTemplate } from './retention/retained-template';
import { PRIMARY_RETENTION_PREFIX } from './retention/retention-policy';

@Component({
  selector: 'lw-pane-tree-view',
  imports: [
    PaneView,
    PaneDropZones,
    PaneMinimizedStrip,
    PaneSplitHandle,
    RetainedTemplate,
    TranslocoPipe,
    forwardRef(() => PaneTreeView),
  ],
  host: { class: 'flex min-h-0 min-w-0' },
  templateUrl: './pane-tree-view.html',
})
export class PaneTreeView {
  readonly dock = input.required<string>();
  readonly node = input.required<PaneNode>();
  readonly primary = input<TemplateRef<unknown> | null>(null);
  readonly paneOptions = input<PaneViewOptions>(CONTENT_PANE_OPTIONS);
  readonly parentOrientation = input<'row' | 'column' | null>(null);

  private readonly paneTree = inject(PaneTreeService);
  private readonly chrome = inject(PaneChromeService);

  protected readonly primaryPaneId = computed(() =>
    this.paneTree.primaryId(this.dock()),
  );

  protected readonly resizing = signal(false);

  protected readonly split = computed<PaneSplit | null>(() => {
    const node = this.node();
    return node.kind === 'split' ? node : null;
  });

  protected readonly leaf = computed(() => {
    const node = this.node();
    return node.kind === 'leaf' ? node : null;
  });

  protected readonly primaryRetentionKey = computed(
    () => PRIMARY_RETENTION_PREFIX + this.dock(),
  );

  protected readonly primaryLeafPath = computed(() => {
    const l = this.leaf();
    return l ? (leafPath(l) ?? '') : '';
  });

  protected readonly minimized = computed(() => {
    const node = this.node();
    return this.isMinimizedLeaf(node);
  });

  protected readonly primaryMinimized = computed(
    () =>
      this.parentOrientation() !== null &&
      this.chrome.isMinimized(this.dock(), this.primaryPaneId()),
  );

  protected readonly firstMinimized = computed(() => {
    const s = this.split();
    return s !== null && this.isMinimizedLeaf(s.first);
  });

  protected readonly secondMinimized = computed(() => {
    const s = this.split();
    return s !== null && this.isMinimizedLeaf(s.second);
  });

  protected flexFor(
    minimized: boolean,
    siblingMinimized: boolean,
    ratio: number,
    orientation: 'row' | 'column',
  ): string {
    if (minimized) {
      return orientation === 'row' ? '0 0 2.25rem' : '0 0 2rem';
    }
    return siblingMinimized ? '1 1 0' : `${ratio} 1 0`;
  }

  protected onRatio(splitId: string, ratio: number): void {
    this.resizing.set(true);
    this.paneTree.resizeStream(this.dock(), splitId, ratio);
  }

  protected onRatioCommit(): void {
    this.resizing.set(false);
    this.paneTree.resizeCommit();
  }

  private isMinimizedLeaf(node: PaneNode): boolean {
    return (
      node.kind === 'leaf' && this.chrome.isMinimized(this.dock(), node.id)
    );
  }
}
