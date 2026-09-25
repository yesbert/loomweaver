import {
  FrameSettingsSection,
  SettingText,
  SettingToggle,
} from '@loomweaver/plugin-sdk';
import { LocalStorageStore } from '../../persistence/key-value-store';
import {
  ApplySyncedState,
  StateSyncService,
  SyncSource,
} from '../../persistence/state-sync.service';
import { buildFrameSection } from './frame-settings-section';
import { sanitizeRpcSettingsSection } from './rpc/sanitize-settings';

function asSection(raw: unknown): FrameSettingsSection {
  return raw as FrameSettingsSection;
}

function validSection(
  overrides: Record<string, unknown> = {},
): FrameSettingsSection {
  return asSection({
    id: 'prefs',
    title: 'My plugin',
    rows: [
      {
        id: 'greeting',
        label: 'Greeting',
        control: { kind: 'text', value: 'Hello' },
      },
      { id: 'loud', label: 'Shout', control: { kind: 'toggle', value: false } },
    ],
    ...overrides,
  });
}

describe('buildFrameSection', () => {
  afterEach(() => localStorage.clear());

  let registered: ApplySyncedState | undefined;

  function syncStub(): StateSyncService {
    return {
      register: (
        _source: SyncSource,
        _key: string,
        apply: ApplySyncedState,
      ) => {
        registered = apply;
        return () => {
          if (registered === apply) {
            registered = undefined;
          }
        };
      },
    } as unknown as StateSyncService;
  }

  function build(notify = vi.fn()) {
    const { section, disposeSync } = buildFrameSection({
      pluginId: 'p1',
      wire: sanitizeRpcSettingsSection('p1', validSection()),
      group: 'settings.group.community',
      store: new LocalStorageStore(),
      sync: syncStub(),
      notify,
    });
    return { section, disposeSync, notify };
  }

  it('namespaces the section and row ids with the plugin id and stamps the group', () => {
    const { section } = build();

    expect(section.id).toBe('p1.prefs');
    expect(section.group).toBe('settings.group.community');
    expect(section.rows.map((row) => row.id)).toEqual([
      'p1.prefs.greeting',
      'p1.prefs.loud',
    ]);
  });

  it('notifies the plugin once with the initial values and again on every change', () => {
    const { section, notify } = build();

    expect(notify).toHaveBeenCalledWith('prefs', {
      greeting: 'Hello',
      loud: false,
    });

    const text = section.rows[0].control as SettingText;
    text.set('Moin');

    expect(notify).toHaveBeenLastCalledWith('prefs', {
      greeting: 'Moin',
      loud: false,
    });
    expect(text.value()).toBe('Moin');
  });

  it('persists changes and restores them for the next build, dropping type-mismatched junk', () => {
    const { section } = build();
    (section.rows[0].control as SettingText).set('Moin');
    (section.rows[1].control as SettingToggle).set(true);

    const raw = localStorage.getItem('lw.plugin-settings:p1:prefs');
    localStorage.setItem(
      'lw.plugin-settings:p1:prefs',
      JSON.stringify({ ...JSON.parse(raw ?? '{}'), greeting: 42, alien: true }),
    );

    const { section: restored, notify } = build();
    expect((restored.rows[0].control as SettingText).value()).toBe('Hello');
    expect((restored.rows[1].control as SettingToggle).value()).toBe(true);
    expect(notify).toHaveBeenCalledWith('prefs', {
      greeting: 'Hello',
      loud: true,
    });
  });

  it('hydrates from a peek-less store and notifies with the restored values', async () => {
    const notify = vi.fn();
    buildFrameSection({
      pluginId: 'p1',
      wire: sanitizeRpcSettingsSection('p1', validSection()),
      group: 'settings.group.community',
      store: {
        get: () => Promise.resolve(JSON.stringify({ loud: true })),
        set: () => Promise.resolve(),
        delete: () => Promise.resolve(),
      },
      sync: syncStub(),
      notify,
    });
    await Promise.resolve();
    await Promise.resolve();

    expect(notify).toHaveBeenCalledWith('prefs', {
      greeting: 'Hello',
      loud: true,
    });
  });

  it('disposeSync unregisters the cross-tab applier (deactivate no longer leaks it)', () => {
    const { disposeSync } = build();
    expect(registered).toBeDefined();

    disposeSync();

    expect(registered).toBeUndefined();
  });

  it('applies a change another window made and pushes it on to the plugin', () => {
    const { section, notify } = build();
    notify.mockClear();

    registered?.(JSON.stringify({ greeting: 'Hallo' }), 'irrelevant');

    expect((section.rows[0].control as SettingText).value()).toBe('Hallo');
    expect(notify).toHaveBeenCalledWith('prefs', {
      greeting: 'Hallo',
      loud: false,
    });
  });
});
