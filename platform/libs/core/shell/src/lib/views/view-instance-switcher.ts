import { Component, CUSTOM_ELEMENTS_SCHEMA, computed, inject, input, output } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { View } from './view';
import { DialogService } from '../dialog/dialog.service';
import { MenuListEntry, MenuService } from '../menu/menu.service';
import { MENU_ANCHOR_GAP } from '../elements/menu/lw-menu.element';
import { MenuTriggerDirective } from '../menu/menu-trigger.directive';
import { ViewInstanceService } from './view-instance.service';

@Component({
  selector: 'lw-view-instance-switcher',
  imports: [TranslocoPipe, MenuTriggerDirective],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { class: 'flex min-w-0 flex-1' },
  templateUrl: './view-instance-switcher.html',
})
export class ViewInstanceSwitcher {
  readonly view = input.required<View>();

  readonly beforeSwitch = output<void>();

  private readonly viewInstances = inject(ViewInstanceService);

  private readonly menu = inject(MenuService);

  private readonly dialogs = inject(DialogService);

  private readonly transloco = inject(TranslocoService);

  protected readonly activeName = computed(() => {
    const viewId = this.view().id;
    const active = this.viewInstances.activeInstance(viewId);
    if (!active || this.viewInstances.isDefault(viewId, active.id)) {
      return '';
    }
    return active.name;
  });

  protected openSwitcher(event: MouseEvent): void {
    const viewId = this.view().id;
    const activeId = this.viewInstances.activeId(viewId)();
    const entries: MenuListEntry[] = this.viewInstances
      .instances(viewId)()
      .map((instance) => ({
        key: `switch:${instance.id}`,
        label: this.viewInstances.isDefault(viewId, instance.id)
          ? 'viewInstance.default'
          : () => instance.name,
        active: instance.id === activeId,
      }));
    entries.push({ key: 'new', label: 'viewInstance.new', icon: 'add' });
    if (!this.viewInstances.isDefault(viewId, activeId)) {
      entries.push(
        { key: 'rename', label: 'viewInstance.rename' },
        { key: 'delete', label: 'viewInstance.delete' },
      );
    }
    const control = event.currentTarget as HTMLElement;
    const rect = control.getBoundingClientRect();
    this.menu.openList(
      entries,
      { x: rect.left, y: rect.bottom + MENU_ANCHOR_GAP },
      (key) => this.onPick(key),
      control,
    );
  }

  private onPick(key: string): void {
    const viewId = this.view().id;
    if (key.startsWith('switch:')) {
      this.switchTo(viewId, key.slice('switch:'.length));
      return;
    }
    if (key === 'new') {
      this.createInstance(viewId);
      return;
    }
    if (key === 'rename') {
      this.renameActiveInstance(viewId);
      return;
    }
    if (key === 'delete') {
      this.deleteActiveInstance(viewId);
    }
  }

  private switchTo(viewId: string, instanceId: string): void {
    this.beforeSwitch.emit();
    this.viewInstances.setActive(viewId, instanceId);
  }

  private createInstance(viewId: string): void {
    void this.dialogs
      .prompt({
        title: this.transloco.translate('viewInstance.newTitle'),
        message: '',
        placeholder: this.transloco.translate('viewInstance.namePlaceholder'),
      })
      .then((name) => {
        if (!name?.trim()) {
          return;
        }
        this.beforeSwitch.emit();
        this.viewInstances.create(viewId, name.trim());
      });
  }

  private renameActiveInstance(viewId: string): void {
    const active = this.viewInstances.activeInstance(viewId);
    if (!active) {
      return;
    }
    void this.dialogs
      .prompt({
        title: this.transloco.translate('viewInstance.renameTitle'),
        message: '',
        initial: active.name,
        placeholder: this.transloco.translate('viewInstance.namePlaceholder'),
      })
      .then((name) => {
        if (name?.trim()) {
          this.viewInstances.rename(viewId, active.id, name.trim());
        }
      });
  }

  private deleteActiveInstance(viewId: string): void {
    const active = this.viewInstances.activeInstance(viewId);
    if (!active) {
      return;
    }
    void this.dialogs
      .confirm({
        title: this.transloco.translate('viewInstance.delete'),
        message: this.transloco.translate('viewInstance.deleteConfirm', {
          name: active.name,
        }),
        tone: 'danger',
      })
      .then((ok) => {
        if (ok) {
          this.viewInstances.remove(viewId, active.id);
        }
      });
  }
}
