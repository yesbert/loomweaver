import { computed, Service, signal } from '@angular/core';
import { Disposable } from '../plugin/contribution-registry';
import { upsertById } from '../foundation/identified';
import { SettingRow, SettingsSection } from './settings-model';

@Service()
export class SettingsRegistry {
  private readonly requested = signal<string | undefined>(undefined);
  private readonly sections = signal<readonly SettingsSection[]>([]);
  private readonly omitted = signal<ReadonlySet<string>>(new Set());
  private readonly replacements = signal<ReadonlyMap<string, SettingRow>>(
    new Map(),
  );

  readonly requestedSection = this.requested.asReadonly();

  readonly registered = this.sections.asReadonly();

  readonly replacedRowIds = computed(() => [...this.replacements().keys()]);

  readonly all = computed(() => {
    const omitted = this.omitted();
    const replacements = this.replacements();
    return this.sections()
      .map((section) => visibleSection(section, omitted, replacements))
      .filter((section): section is SettingsSection => section !== null)
      .toSorted((a, b) => (a.order ?? 0) - (b.order ?? 0));
  });

  register(section: SettingsSection): Disposable {
    this.sections.update((list) => upsertById(list, section));
    return {
      dispose: () =>
        this.sections.update((list) =>
          list.filter((entry) => entry !== section),
        ),
    };
  }

  omit(ids: readonly string[]): void {
    if (ids.length === 0) {
      return;
    }
    this.omitted.update((current) => new Set([...current, ...ids]));
  }

  replaceRow(row: SettingRow): Disposable {
    this.replacements.update((current) => new Map(current).set(row.id, row));
    return {
      dispose: () =>
        this.replacements.update((current) => {
          if (current.get(row.id) !== row) {
            return current;
          }
          const next = new Map(current);
          next.delete(row.id);
          return next;
        }),
    };
  }

  request(sectionId: string): void {
    this.requested.set(sectionId);
  }

  consumeRequestedSection(): void {
    this.requested.set(undefined);
  }
}

function visibleSection(
  section: SettingsSection,
  omitted: ReadonlySet<string>,
  replacements: ReadonlyMap<string, SettingRow>,
): SettingsSection | null {
  if (omitted.has(section.id)) {
    return null;
  }
  const rows = section.rows
    .filter((row) => !omitted.has(row.id))
    .map((row) => replacements.get(row.id) ?? row);
  const unchanged =
    rows.length === section.rows.length &&
    rows.every((row, index) => row === section.rows[index]);
  if (unchanged) {
    return section;
  }
  return rows.length === 0 ? null : { ...section, rows };
}
