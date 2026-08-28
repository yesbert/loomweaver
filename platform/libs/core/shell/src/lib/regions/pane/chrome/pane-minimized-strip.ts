import { Component, CUSTOM_ELEMENTS_SCHEMA, computed, inject, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { PaneLeaf, activeTab } from '../tree/pane-node';
import { PaneChromeService } from './pane-chrome.service';
import { PaneLabel, paneLabelOf } from '../drag/pane-label';
import { ContributionRegistry } from '../../../plugin/contribution-registry';

@Component({
  selector: 'lw-pane-minimized-strip',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [TranslocoPipe],
  host: { class: 'flex shrink-0' },
  templateUrl: './pane-minimized-strip.html',
})
export class PaneMinimizedStrip {
  readonly dock = input.required<string>();
  readonly leaf = input.required<PaneLeaf>();
  readonly orientation = input<'row' | 'column' | null>(null);

  private readonly registry = inject(ContributionRegistry);
  private readonly chrome = inject(PaneChromeService);

  protected readonly vertical = computed(() => this.orientation() === 'row');

  protected readonly label = computed<
    Pick<PaneLabel, 'title' | 'literalTitle'>
  >(() => {
    const tab = activeTab(this.leaf());
    if (tab?.title !== undefined) {
      return { title: tab.title, literalTitle: tab.literalTitle ?? false };
    }
    const base = paneLabelOf(this.registry, tab?.path ?? '');
    return { title: base.title, literalTitle: base.literalTitle };
  });

  protected readonly icon = computed(() => {
    const tab = activeTab(this.leaf());
    return tab?.icon ?? paneLabelOf(this.registry, tab?.path ?? '').icon;
  });

  protected readonly tabCount = computed(() => this.leaf().tabs.length);
  protected readonly extraTabs = computed(() => this.tabCount() - 1);

  protected readonly restoreKey = computed(() =>
    this.tabCount() > 1
      ? 'content.split.restoreMinimizedCount'
      : 'content.split.restoreMinimized',
  );

  protected restore(): void {
    this.chrome.toggleMinimize(this.dock(), this.leaf().id);
  }
}
