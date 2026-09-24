import { Component, computed, inject, input } from '@angular/core';
import { SHELL_LAYOUT, LayoutRegion } from './layout/layout';
import { regionsAt } from './layout/layout-queries';
import { ViewportService } from './layout/viewport.service';
import { PanelState } from './regions/panel/panel-state';
import { ShellPanel } from './regions/panel/shell-panel';
import { ShellSidebarHeader } from './regions/panel/shell-sidebar-header';
import { ShellRail } from './regions/rail/shell-rail';

@Component({
  selector: 'lw-shell-edge',
  imports: [ShellRail, ShellPanel, ShellSidebarHeader],
  templateUrl: './shell-edge.html',
  host: {
    class: 'flex flex-col overflow-hidden border-border',
    '[class.border-r]': "side() === 'left' && hasBody()",
    '[class.border-l]': "side() === 'right' && hasBody()",
  },
})
export class ShellEdge {
  readonly side = input.required<'left' | 'right'>();

  private readonly layout = inject(SHELL_LAYOUT);
  private readonly panelState = inject(PanelState);
  protected readonly viewport = inject(ViewportService);

  protected readonly rails = computed(() =>
    regionsAt(this.layout, this.side(), 'rail'),
  );
  protected readonly panels = computed(() =>
    regionsAt(this.layout, this.side(), 'panel'),
  );

  private readonly anyPanelOpen = computed(() =>
    this.panels().some((panel) => !this.panelState.isCollapsed(panel.id)),
  );

  protected readonly hasBody = computed(
    () =>
      this.viewport.compact() || this.rails().length > 0 || this.anyPanelOpen(),
  );

  protected readonly railDivider = computed(
    () => this.rails().length > 0 && this.anyPanelOpen(),
  );

  protected panelCollapsed(panel: LayoutRegion): boolean {
    return !this.viewport.compact() && this.panelState.isCollapsed(panel.id);
  }
}
