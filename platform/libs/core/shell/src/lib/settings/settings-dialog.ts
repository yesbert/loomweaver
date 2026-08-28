import { Component, CUSTOM_ELEMENTS_SCHEMA, computed, effect, inject, signal } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { TranslocoPipe } from '@jsverse/transloco';
import { SettingsRegistry } from './settings-registry';
import { SettingButton, SettingRow, SettingsSection } from './settings-model';
import { CommandService } from '../commands/command.service';
import { DialogRef } from '../dialog/dialog-ref';
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
  imports: [NgComponentOutlet, TranslocoPipe, LwButton, LwSettingRow],
  templateUrl: './settings-dialog.html',
})
export class SettingsDialog {
  private readonly settings = inject(SettingsRegistry);

  private readonly commands = inject(CommandService);

  protected readonly ref = inject(DialogRef);

  protected readonly sections = computed<readonly SettingsSection[]>(() =>
    this.settings
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
      this.sections().find((s) => s.id === this.activeId()) ??
      this.sections()[0],
  );

  protected readonly groups = computed<readonly SettingsGroup[]>(() => {
    const order: SettingsGroup[] = [];
    const byKey = new Map<
      string,
      SettingsGroup & { sections: SettingsSection[] }
    >();
    for (const section of this.sections()) {
      const key = section.group ?? '';
      let group = byKey.get(key);
      if (!group) {
        group = { key, label: section.group, sections: [] };
        byKey.set(key, group);
        order.push(group);
      }
      group.sections.push(section);
    }
    return order;
  });

  constructor() {
    effect(() => {
      const requested = this.settings.requestedSection();
      if (!requested) {
        return;
      }
      this.activeId.set(requested);
      this.settings.consumeRequestedSection();
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
