import { Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { CommandService } from '../../commands/command.service';
import { UNUSABLE_WORKSPACES } from '../../foundation/unusable-workspaces';

@Component({
  selector: 'lw-unusable-workspace-notice',
  imports: [TranslocoPipe],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './unusable-workspace-notice.html',
})
export class UnusableWorkspaceNotice {
  private readonly workspaces = inject(UNUSABLE_WORKSPACES);
  private readonly commands = inject(CommandService);

  protected shown(): boolean {
    return this.workspaces.announced();
  }

  protected reset(): void {
    this.commands.execute('shell.workspace.reset');
  }
}
