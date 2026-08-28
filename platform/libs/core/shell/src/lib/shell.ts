import { Component, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  SHELL_LAYOUT,
  DockPosition,
  LayoutRegion,
  RegionType,
} from './layout/layout';
import { ShellBar } from './regions/bar/shell-bar';
import { ShellRail } from './regions/rail/shell-rail';
import { ShellPanel } from './regions/panel/shell-panel';
import { ShellSidebarHeader } from './regions/panel/shell-sidebar-header';
import { ContentGrid } from './regions/content/content-grid';
import { ToastOutlet } from './notifications/toast-outlet';
import { DialogOutlet } from './dialog/dialog-outlet';
import { ThemeService } from './theme/theme.service';
import { FontScaleService } from './text-size/font-scale.service';
import { ViewportService } from './layout/viewport.service';
import { PanelState } from './regions/panel/panel-state';
import { PopoutService } from './popout/popout.service';

/** Layout host: renders the declared regions into the border topology. */
@Component({
  selector: 'lw-shell',
  imports: [
    ShellBar,
    ShellRail,
    ShellPanel,
    ShellSidebarHeader,
    ContentGrid,
    ToastOutlet,
    DialogOutlet,
    TranslocoPipe,
    RouterOutlet,
  ],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
})
export class Shell {
  private readonly layout = inject(SHELL_LAYOUT);
  private readonly panels = inject(PanelState);
  protected readonly viewport = inject(ViewportService);
  protected readonly popout = inject(PopoutService);

  protected readonly topBars = this.regionsAt('top', 'bar');
  protected readonly bottomBars = this.regionsAt('bottom', 'bar');
  protected readonly leftRails = this.regionsAt('left', 'rail');
  protected readonly leftPanels = this.regionsAt('left', 'panel');
  protected readonly rightPanels = this.regionsAt('right', 'panel');
  protected readonly rightRails = this.regionsAt('right', 'rail');
  protected readonly hasContent = this.layout.regions.some(
    (r) => r.dock === 'center',
  );

  protected readonly leftFloating = computed(() =>
    this.floating(this.leftPanels),
  );
  protected readonly rightFloating = computed(() =>
    this.floating(this.rightPanels),
  );
  protected readonly leftEdgeBorder = computed(() =>
    this.edgeHasBody(this.leftPanels, this.leftRails),
  );
  protected readonly rightEdgeBorder = computed(() =>
    this.edgeHasBody(this.rightPanels, this.rightRails),
  );
  protected readonly leftRailDivider = computed(() =>
    this.railDivider(this.leftPanels, this.leftRails),
  );
  protected readonly rightRailDivider = computed(() =>
    this.railDivider(this.rightPanels, this.rightRails),
  );

  private readonly theme = inject(ThemeService);
  private readonly fontScale = inject(FontScaleService);

  protected panelCollapsed(panel: LayoutRegion): boolean {
    return !this.viewport.compact() && this.panels.isCollapsed(panel.id);
  }

  protected isOverlayOpen(regionId: string): boolean {
    return this.panels.isOverlayOpen(regionId);
  }

  protected anyOverlayOpen(): boolean {
    return this.panels.anyOverlayOpen();
  }

  protected closeOverlay(): void {
    this.panels.closeOverlay();
  }

  private floating(panels: LayoutRegion[]): LayoutRegion[] {
    if (this.viewport.compact()) {
      return [];
    }
    return panels.filter((panel) => this.panels.isCollapsed(panel.id));
  }

  private railDivider(panels: LayoutRegion[], rails: LayoutRegion[]): boolean {
    return (
      rails.length > 0 &&
      panels.some((panel) => !this.panels.isCollapsed(panel.id))
    );
  }

  private edgeHasBody(panels: LayoutRegion[], rails: LayoutRegion[]): boolean {
    return (
      this.viewport.compact() ||
      rails.length > 0 ||
      panels.some((panel) => !this.panels.isCollapsed(panel.id))
    );
  }

  private regionsAt(dock: DockPosition, type: RegionType): LayoutRegion[] {
    return this.layout.regions.filter(
      (region) => region.dock === dock && region.type === type,
    );
  }
}
