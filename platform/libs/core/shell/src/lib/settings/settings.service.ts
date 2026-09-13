import { inject, Service } from '@angular/core';
import { Disposable } from '../plugin/contribution-registry';
import { SettingsDialog } from './settings-dialog';
import { SettingsRegistry } from './settings-registry';
import { DialogRef } from '../dialog/dialog-ref';
import { DialogService } from '../dialog/dialog.service';
import { SettingRow, SettingsSection } from './settings-model';

/**
 * Host registry for settings sections (schema-driven). The shell and
 * plugins contribute sections; the host renders them all in one {@link SettingsDialog}.
 * Storage is deliberately NOT centralised — each section carries its own value accessors,
 * so the owner keeps responsibility for persistence (shell settings in the shell, plugin
 * settings in the plugin, optionally against its owner's backend). This keeps the host domain-pure and
 * fits the per-tenant tenancy model without the host needing to persist foreign data.
 */
@Service()
export class SettingsService {
  private current: DialogRef | null = null;

  private readonly dialogs = inject(DialogService);
  private readonly registry = inject(SettingsRegistry);

  /** The section a caller asked to show; the settings dialog consumes it. */
  readonly requestedSection = this.registry.requestedSection;

  /**
   * Registered sections, ordered by `order` (default 0), then registration order — with any
   * omitted section or row dropped, and a section left with no rows hidden entirely.
   */
  readonly all = this.registry.all;

  /**
   * Every registered section, **including** those {@link omit} hides and with their omitted rows
   * still in place. {@link all} is what the dialog draws; this is what was contributed, which is
   * what a dev-mode report needs to tell an `omit` that hid a row from one that hit nothing.
   */
  readonly registered = this.registry.registered;

  /** The row ids a distribution replaced with {@link replaceRow}, for the composition report. */
  readonly replacedRowIds = this.registry.replacedRowIds;

  /**
   * Contributes a section; dispose to remove it (plugin deactivation). Registering an existing
   * id **overrides** the previous section in place (last contribution wins), like every other
   * contribution.
   */
  register(section: SettingsSection): Disposable {
    return this.registry.register(section);
  }

  /**
   * Hides settings by id — a section id drops the whole section, a row id drops that row. A
   * lasting filter (like {@link ContributionRegistry.omit}), so a section a plugin registers
   * later is covered too.
   */
  omit(ids: readonly string[]): void {
    this.registry.omit(ids);
  }

  /**
   * Replaces a single row by its id, in place: the section it sits in, the other rows and their order
   * stay as they were contributed. A **lasting** instruction like {@link omit}, so a section
   * contributed later, or contributed again, carries the replacement too; an omit of the same id wins.
   * Dispose it to give the contributed row back.
   *
   * This is how a distribution shows a control of its own in place of a built-in row, for example its
   * own language control as `shell.language` in General, while a different control stands in a bar.
   * A plugin contributes whole sections of its own and does not replace rows it did not write.
   */
  replaceRow(row: SettingRow): Disposable {
    return this.registry.replaceRow(row);
  }

  /**
   * Opens the settings dialog — a bare, wide two-column surface owning its own chrome. Pass a
   * `sectionId` to land on (or switch an already-open dialog to) that section — e.g. the plugin
   * store's gear action jumping to an installed plugin's own settings.
   */
  open(sectionId?: string): DialogRef {
    if (sectionId) {
      this.registry.request(sectionId);
    }
    if (this.current) {
      return this.current;
    }
    const ref = this.dialogs.open(SettingsDialog, {
      title: 'settings.title',
      bare: true,
      size: 'xl',
      dismissable: true,
    });
    this.current = ref;
    void ref.closed.then(() => {
      if (this.current === ref) {
        this.current = null;
      }
    });
    return ref;
  }

  consumeRequestedSection(): void {
    this.registry.consumeRequestedSection();
  }
}
