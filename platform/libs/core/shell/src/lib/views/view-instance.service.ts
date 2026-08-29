import { computed, inject, Service, signal, Signal, WritableSignal } from '@angular/core';
import { WORKING_STATE_STORE } from '../persistence/working-state-store';
import { ViewStateService } from './view-state.service';
import { hydrateAsync } from '../persistence/hydrate';
import { StateSyncService } from '../persistence/state-sync.service';

const STORAGE_PREFIX = 'lw.shell.view-instances:';

export interface ViewInstance {
  readonly id: string;
  readonly name: string;
}

interface InstanceRecord {
  readonly instances: readonly ViewInstance[];
  readonly activeId: string;
}

function defaultRecord(viewId: string): InstanceRecord {
  return { instances: [{ id: viewId, name: '' }], activeId: viewId };
}

function parseRecord(viewId: string, raw: string | undefined): InstanceRecord {
  if (!raw) {
    return defaultRecord(viewId);
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return defaultRecord(viewId);
    }
    const record = parsed as Partial<InstanceRecord>;
    const instances = Array.isArray(record.instances)
      ? record.instances.filter(
          (index): index is ViewInstance =>
            !!index && typeof index.id === 'string' && typeof index.name === 'string',
        )
      : [];
    const withoutDefault = instances.filter((index) => index.id !== viewId);
    const merged = [{ id: viewId, name: '' }, ...withoutDefault];
    const activeId =
      typeof record.activeId === 'string' &&
      merged.some((index) => index.id === record.activeId)
        ? record.activeId
        : viewId;
    return { instances: merged, activeId };
  } catch {
    return defaultRecord(viewId);
  }
}

@Service()
export class ViewInstanceService {
  private readonly store = inject(WORKING_STATE_STORE);
  private readonly viewStates = inject(ViewStateService);
  private readonly sync = inject(StateSyncService);
  private readonly records = new Map<string, WritableSignal<InstanceRecord>>();
  private readonly instancesSignals = new Map<
    string,
    Signal<readonly ViewInstance[]>
  >();
  private readonly activeIdSignals = new Map<string, Signal<string>>();

  constructor() {
    this.sync.registerPrefix('working-state', STORAGE_PREFIX, (raw, key) => {
      const viewId = key.slice(STORAGE_PREFIX.length);
      this.records.get(viewId)?.set(parseRecord(viewId, raw));
    });
  }

  instances(viewId: string): Signal<readonly ViewInstance[]> {
    return this.derived(
      this.instancesSignals,
      viewId,
      (record) => record.instances,
    );
  }

  activeId(viewId: string): Signal<string> {
    return this.derived(
      this.activeIdSignals,
      viewId,
      (record) => record.activeId,
    );
  }

  isDefault(viewId: string, instanceId: string): boolean {
    return instanceId === viewId;
  }

  setActive(viewId: string, instanceId: string): void {
    const record = this.recordFor(viewId);
    if (record().instances.some((index) => index.id === instanceId)) {
      this.commit(viewId, { ...record(), activeId: instanceId });
    }
  }

  create(viewId: string, name: string): void {
    const id = crypto.randomUUID();
    const record = this.recordFor(viewId);
    this.commit(viewId, {
      instances: [...record().instances, { id, name }],
      activeId: id,
    });
  }

  rename(viewId: string, instanceId: string, name: string): void {
    if (this.isDefault(viewId, instanceId)) {
      return;
    }
    const record = this.recordFor(viewId);
    this.commit(viewId, {
      ...record(),
      instances: record().instances.map((index) =>
        index.id === instanceId ? { ...index, name } : index,
      ),
    });
  }

  remove(viewId: string, instanceId: string): void {
    if (this.isDefault(viewId, instanceId)) {
      return;
    }
    const record = this.recordFor(viewId);
    const instances = record().instances.filter((index) => index.id !== instanceId);
    const activeId =
      record().activeId === instanceId ? viewId : record().activeId;
    this.commit(viewId, { instances, activeId });
    this.viewStates.clear(instanceId);
  }

  reset(viewId: string): void {
    for (const instance of this.recordFor(viewId)().instances) {
      if (this.isDefault(viewId, instance.id)) {
        this.viewStates.reset(instance.id);
      } else {
        this.viewStates.clear(instance.id);
      }
    }
    this.recordFor(viewId).set(defaultRecord(viewId));
    void this.store.delete(STORAGE_PREFIX + viewId);
  }

  private derived<T>(
    cache: Map<string, Signal<T>>,
    viewId: string,
    select: (record: InstanceRecord) => T,
  ): Signal<T> {
    const existing = cache.get(viewId);
    if (existing) {
      return existing;
    }
    const record = this.recordFor(viewId);
    const derived = computed(() => select(record()));
    cache.set(viewId, derived);
    return derived;
  }

  private recordFor(viewId: string): WritableSignal<InstanceRecord> {
    const existing = this.records.get(viewId);
    if (existing) {
      return existing;
    }
    const key = STORAGE_PREFIX + viewId;
    const record = signal<InstanceRecord>(
      parseRecord(viewId, this.store.peek?.(key)),
    );
    hydrateAsync(this.store, key, (raw) =>
      record.set(parseRecord(viewId, raw)),
    );
    this.records.set(viewId, record);
    return record;
  }

  private commit(viewId: string, next: InstanceRecord): void {
    this.recordFor(viewId).set(next);
    void this.store.set(STORAGE_PREFIX + viewId, JSON.stringify(next));
  }
}
