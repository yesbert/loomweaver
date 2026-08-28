import { Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { ThemeMode, ThemeService } from './theme.service';
import { LoomIconName } from '../elements/icon/loom-icons';

@Component({
  selector: 'lw-theme-toggle',
  imports: [TranslocoPipe],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './theme-toggle.html',
})
export class ThemeToggle {
  private readonly theme = inject(ThemeService);
  protected readonly mode = this.theme.mode;
  protected readonly modes: readonly ThemeMode[] = ['light', 'dark', 'system'];

  private readonly icons: Record<ThemeMode, LoomIconName> = {
    light: 'themeLight',
    dark: 'themeDark',
    system: 'themeSystem',
  };

  protected iconFor(mode: ThemeMode): LoomIconName {
    return this.icons[mode];
  }

  protected select(mode: ThemeMode): void {
    this.theme.setMode(mode);
  }
}
