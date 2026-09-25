import { computed, inject, Service, signal, Signal, WritableSignal } from '@angular/core';
import { WORKING_STATE_STORE } from '../persistence/working-state-store';
import { ViewStateService } from './view-state.service';
import { hydrateAsync, readStoredValue } from '../persistence/stored-values/hydrate';
import { StateSyncService } from '../persistence/cross-tab/state-sync.service';

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
          (instance): instance is ViewInstance =>
            !!instance && typeof instance.id === 'string' && typeof instance.name === 'string',
        )
      : [];
    const withoutDefault = instances.filter((instance) => instance.id !== viewId);
    const merged = [{ id: viewId, name: '' }, ...withoutDefault];
    const activeId =
      typeof record.activeId === 'string' &&
      merged.some((instance) => instance.id === record.activeId)
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
    this.sync.onNamespaceAdopted(() => this.rereadRecords());
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

  activeInstance(viewId: string): ViewInstance | undefined {
    const activeId = this.activeId(viewId)();
    return this.instances(viewId)().find(
      (instance) => instance.id === activeId,
    );
  }

  isDefault(viewId: string, instanceId: string): boolean {
    return instanceId === viewId;
  }

  setActive(viewId: string, instanceId: string): void {
    const record = this.recordFor(viewId);
    if (record().instances.some((instance) => instance.id === instanceId)) {
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
      instances: record().instances.map((instance) =>
        instance.id === instanceId ? { ...instance, name } : instance,
      ),
    });
  }

  remove(viewId: string, instanceId: string): void {
    if (this.isDefault(viewId, instanceId)) {
      return;
    }
    const record = this.recordFor(viewId);
    const instances = record().instances.filter((instance) => instance.id !== instanceId);
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

  private async rereadRecords(): Promise<void> {
    for (const [viewId, record] of this.records) {
      const raw = await readStoredValue(this.store, STORAGE_PREFIX + viewId);
      record.set(parseRecord(viewId, raw));
    }
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
