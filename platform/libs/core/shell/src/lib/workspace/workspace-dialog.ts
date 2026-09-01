import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, signal } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { DialogRef } from '../dialog/dialog-ref';
import { DialogService } from '../dialog/dialog.service';
import { DEFAULT_WORKSPACE_ID } from './active-workspace.service';
import { WorkspaceService } from './workspace.service';
import { UnusableWorkspacesService } from './usability/unusable-workspaces.service';
import { CommandService } from '../commands/command.service';

@Component({
  selector: 'lw-workspace-dialog',
  imports: [TranslocoPipe],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './workspace-dialog.html',
})
export class WorkspaceDialog {
  private readonly ws = inject(WorkspaceService);
  private readonly unusableWorkspaces = inject(UnusableWorkspacesService);
  private readonly ref = inject<DialogRef>(DialogRef);
  private readonly dialogs = inject(DialogService);
  private readonly transloco = inject(TranslocoService);
  private readonly commands = inject(CommandService);

  protected readonly workspaces = this.ws.workspaces;
  protected readonly initials = this.ws.initials;
  protected readonly definitions = this.ws.definitions;
  protected readonly activeId = this.ws.activeId;
  protected readonly hasChanges = this.ws.hasChanges;
  protected readonly defaultId = DEFAULT_WORKSPACE_ID;
  protected readonly name = signal('');

  protected readonly tab = signal<'mine' | 'provided'>(
    this.definitions.some((definition) => definition.id === this.ws.activeId())
      ? 'provided'
      : 'mine',
  );

  protected originName(id: string): string | null {
    const origin = this.ws.originOf(id);
    const definition = this.definitions.find(
      (candidate) => candidate.id === origin,
    );
    return definition ? this.transloco.translate(definition.title) : null;
  }

  protected changed(id: string): boolean {
    return this.ws.changedIds().has(id);
  }

  protected unusable(id: string): boolean {
    return this.unusableWorkspaces.ids().has(id);
  }

  protected resettable(id: string): boolean {
    return this.changed(id) || this.unusable(id);
  }

  protected save(): void {
    const name = this.name().trim();
    if (!name) {
      return;
    }
    void this.ws.saveCurrent(name).then(() => this.name.set(''));
  }

  protected applyChanges(): void {
    void this.dialogs
      .confirm({
        title: this.transloco.translate('workspace.saveBaseline'),
        message: this.transloco.translate('workspace.applyConfirm'),
      })
      .then((ok) => {
        if (ok) {
          void this.ws.saveBaseline();
        }
      });
  }

  protected switchTo(id: string): void {
    void this.ws.switchTo(id);
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
      .then((name) => name?.trim() && this.ws.rename(id, name.trim()));
  }

  protected resetLayout(id: string): void {
    this.ref.close();
    this.commands.execute('shell.workspace.reset', { workspace: id });
  }

  protected remove(id: string, name: string): void {
    void this.dialogs
      .confirm({
        title: this.transloco.translate('workspace.delete'),
        message: this.transloco.translate('workspace.deleteConfirm', { name }),
        tone: 'danger',
      })
      .then((ok) => ok && this.ws.remove(id));
  }
}
