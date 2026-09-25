import { Component, CUSTOM_ELEMENTS_SCHEMA, computed, effect, inject, signal } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { TranslocoPipe } from '@jsverse/transloco';
import { SettingsRegistry } from './settings-registry';
import { SettingButton, SettingRow, SettingsSection } from './settings-model';
import { CommandService } from '../commands/command.service';
import { DialogRef } from '../dialog/dialog-ref';
import { WideDialogFrame } from '../dialog/wide-dialog-frame';
import { LwButton } from '../elements/button/lw-button';
import { LwSettingRow } from './lw-setting-row';

interface SettingsGroup {
  readonly key: string;
  readonly label?: string;
  readonly sections: readonly SettingsSection[];
}

@Component({
  selector: 'lw-settings-dialog',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    NgComponentOutlet,
    TranslocoPipe,
    LwButton,
    LwSettingRow,
    WideDialogFrame,
  ],
  templateUrl: './settings-dialog.html',
})
export class SettingsDialog {
  private readonly registry = inject(SettingsRegistry);

  private readonly commands = inject(CommandService);

  private readonly ref = inject(DialogRef);

  protected readonly sections = computed<readonly SettingsSection[]>(() =>
    this.registry
      .all()
      .map((section) => ({
        ...section,
        rows: section.rows.filter((row) => this.live(row)),
      }))
      .filter((section) => section.rows.length > 0),
  );

  protected readonly activeId = signal('');

  protected readonly active = computed<SettingsSection | undefined>(
    () =>
      this.sections().find((section) => section.id === this.activeId()) ??
      this.sections()[0],
  );

  protected readonly groups = computed<readonly SettingsGroup[]>(() => {
    const byKey = new Map<string, SettingsSection[]>();
    for (const section of this.sections()) {
      const key = section.group ?? '';
      byKey.set(key, [...(byKey.get(key) ?? []), section]);
    }
    return [...byKey].map(([key, sections]) => ({
      key,
      label: sections[0].group,
      sections,
    }));
  });

  constructor() {
    effect(() => {
      const requested = this.registry.requestedSection();
      if (!requested) {
        return;
      }
      this.activeId.set(requested);
      this.registry.consumeRequestedSection();
    });
  }

  protected runButton(control: SettingButton): void {
    this.commands.trigger(control);
  }

  protected close(): void {
    this.ref.close();
  }

  private live(row: SettingRow): boolean {
    return (
      row.control.kind !== 'button' || this.commands.triggerable(row.control)
    );
  }
}
