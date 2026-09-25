import { InjectionToken } from '@angular/core';
import {
  DEFAULT_ISOLATION_LEVEL,
  PluginIsolationLevel,
} from '../../foundation/plugin-isolation-level';

export const CATALOG_MAX_ISOLATION_LEVEL =
  new InjectionToken<PluginIsolationLevel>('lw.catalog-max-isolation-level', {
    providedIn: 'root',
    factory: () => DEFAULT_ISOLATION_LEVEL,
  });
