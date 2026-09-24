import { Service } from '@angular/core';
import { persistedSetting } from '../../persistence/stored-values/persisted-setting';
import {
  FlagRecord,
  isTrue,
  parseRecord,
  toggledFlag,
} from '../../persistence/stored-values/persisted-record';

const STORAGE_KEY = 'lw.shell.rail-labels';

@Service()
export class RailLabelsService {
  private readonly stored = persistedSetting<FlagRecord>(STORAGE_KEY, {
    parse: (raw) => parseRecord(raw, isTrue),
    serialize: (labels) => JSON.stringify(labels),
  });

  isLabelled(railId: string): boolean {
    return this.stored.value()[railId] === true;
  }

  setLabelled(railId: string, labelled: boolean): void {
    this.stored.set(toggledFlag(this.stored.value(), railId, labelled));
  }
}
