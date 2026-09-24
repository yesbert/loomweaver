import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  signal,
} from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { DialogRef } from '../dialog/dialog-ref';
import { DialogService } from '../dialog/dialog.service';
import { DEFAULT_WORKSPACE_ID } from './active-workspace.service';
import { defaultWorkspaceId } from './workspace-definition';
import { WorkspaceService } from './workspace.service';
import { UnusableWorkspacesService } from './usability/unusable-workspaces.service';
import { CommandService } from '../commands/command.service';
import { WORKSPACE_RESET_COMMAND_ID } from '../commands/host-command-ids';

@Component({
  selector: 'lw-workspace-dialog',
  imports: [TranslocoPipe],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './workspace-dialog.html',
})
export class WorkspaceDialog {
  private readonly workspaceService = inject(WorkspaceService);
  private readonly unusableWorkspaces = inject(UnusableWorkspacesService);
  private readonly ref = inject<DialogRef>(DialogRef);
  private readonly dialogs = inject(DialogService);
  private readonly transloco = inject(TranslocoService);
  private readonly commands = inject(CommandService);

  protected readonly workspaces = this.workspaceService.workspaces;
  protected readonly initials = this.workspaceService.initials;
  protected readonly definitions = this.workspaceService.definitions;
  protected readonly activeId = this.workspaceService.activeId;
  protected readonly hasChanges = this.workspaceService.hasChanges;
  protected readonly defaultId = DEFAULT_WORKSPACE_ID;
  protected readonly offersBuiltIn =
    defaultWorkspaceId(this.definitions) === DEFAULT_WORKSPACE_ID;
  protected readonly name = signal('');

  protected readonly tab = signal<'mine' | 'provided'>(
    this.definitions.some(
      (definition) => definition.id === this.workspaceService.activeId(),
    )
      ? 'provided'
      : 'mine',
  );

  protected originName(id: string): string | null {
    const origin = this.workspaceService.originOf(id);
    const definition = this.definitions.find(
      (candidate) => candidate.id === origin,
    );
    return definition ? this.transloco.translate(definition.title) : null;
  }

  protected changed(id: string): boolean {
    return this.workspaceService.changedIds().has(id);
  }

  protected unusable(id: string): boolean {
    return this.unusableWorkspaces.ids().has(id);
  }

  protected resetTestId(id: string): string {
    return this.activeId() === id ? 'workspace-reset' : `workspace-reset-${id}`;
  }

  protected resettable(id: string): boolean {
    return this.changed(id) || this.unusable(id);
  }

  protected save(): void {
    const name = this.name().trim();
    if (!name) {
      return;
    }
    void this.workspaceService.saveCurrent(name).then(() => this.name.set(''));
  }

  protected applyChanges(): void {
    void this.dialogs
      .confirm({
        title: this.transloco.translate('workspace.saveBaseline'),
        message: this.transloco.translate('workspace.applyConfirm'),
      })
      .then((ok) => {
        if (ok) {
          void this.workspaceService.saveBaseline();
        }
      });
  }

  protected switchTo(id: string): void {
    void this.workspaceService.switchTo(id);
    this.ref.close();
  }

  protected rename(id: string, current: string): void {
    void this.dialogs
      .prompt({
        title: this.transloco.translate('workspace.rename'),
        message: '',
        initial: current,
        placeholder: this.transloco.translate('workspace.namePlaceholder'),
      })
      .then(
        (name) => name?.trim() && this.workspaceService.rename(id, name.trim()),
      );
  }

  protected resetLayout(id: string): void {
    this.ref.close();
    this.commands.execute(WORKSPACE_RESET_COMMAND_ID, { workspace: id });
  }

  protected remove(id: string, name: string): void {
    void this.dialogs
      .confirm({
        title: this.transloco.translate('workspace.delete'),
        message: this.transloco.translate('workspace.deleteConfirm', { name }),
        tone: 'danger',
      })
      .then((ok) => ok && this.workspaceService.remove(id));
  }
}
