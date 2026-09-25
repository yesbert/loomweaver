import { Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { CommandService, VersionService } from '@loomweaver/shell';
import { ABOUT_COMMAND } from './about-command';

@Component({
  selector: 'demo-about-badge',
  imports: [TranslocoPipe],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './about-badge.html',
})
export class AboutBadge {
  private readonly commands = inject(CommandService);
  protected readonly version = inject(VersionService).version;

  protected open(): void {
    this.commands.execute(ABOUT_COMMAND);
  }
}
