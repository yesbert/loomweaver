import { computed, Service, signal } from '@angular/core';
import { Disposable } from '../plugin/contribution-registry';
import { upsertById } from '../foundation/identified';
import { SettingsSection } from './settings-model';

@Service()
export class SettingsRegistry {
  private readonly requested = signal<string | undefined>(undefined);
  private readonly sections = signal<readonly SettingsSection[]>([]);
  private readonly omitted = signal<ReadonlySet<string>>(new Set());

  readonly requestedSection = this.requested.asReadonly();

  readonly registered = this.sections.asReadonly();

  readonly all = computed(() => {
    const omitted = this.omitted();
    return this.sections()
      .map((section) => visibleSection(section, omitted))
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
): SettingsSection | null {
  if (omitted.has(section.id)) {
    return null;
  }
  const rows = section.rows.filter((row) => !omitted.has(row.id));
  if (rows.length === section.rows.length) {
    return section;
  }
  if (rows.length === 0) {
    return null;
  }
  return { ...section, rows };
}
