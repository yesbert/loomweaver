import type { PluginContext, SettingsSection, SettingToggle } from '@loomweaver/plugin-sdk';
import { registerQuoteSettings } from './quotes-settings';

function recorder() {
  const shown: [string, boolean][] = [];
  const sections: SettingsSection[] = [];
  const ctx = {
    setChildShown: (id: string, value: boolean) => shown.push([id, value]),
    registerSettingsSection: (section: SettingsSection) => {
      sections.push(section);
      return { dispose: () => undefined };
    },
  } as unknown as PluginContext;
  const toggle = () => sections[0].rows[0].control as SettingToggle;
  return { ctx, shown, toggle };
}

describe('the margin setting of the quotes plugin', () => {
  beforeEach(() => localStorage.clear());

  it('shows the margin by default, and says so as the plugin starts', () => {
    const { ctx, shown, toggle } = recorder();

    registerQuoteSettings(ctx);

    expect(shown).toEqual([['quotes.margin', true]]);
    expect(toggle().value()).toBe(true);
  });

  it('leaves the margin out when switched off, and brings it back when switched on', () => {
    const { ctx, shown, toggle } = recorder();
    registerQuoteSettings(ctx);

    toggle().set(false);
    toggle().set(true);

    expect(shown.slice(1)).toEqual([
      ['quotes.margin', false],
      ['quotes.margin', true],
    ]);
  });

  it('remembers the choice across a restart', () => {
    const first = recorder();
    registerQuoteSettings(first.ctx);
    first.toggle().set(false);

    const second = recorder();
    registerQuoteSettings(second.ctx);

    expect(second.shown).toEqual([['quotes.margin', false]]);
    expect(second.toggle().value()).toBe(false);
  });

  describe('in a browser that blocks storage', () => {
    const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');

    beforeEach(() =>
      Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        get: () => {
          throw new DOMException('Access is denied for this document.', 'SecurityError');
        },
      }),
    );

    afterEach(() => {
      if (original) {
        Object.defineProperty(globalThis, 'localStorage', original);
      }
    });

    it('starts with the margin shown', () => {
      const { ctx, shown } = recorder();

      registerQuoteSettings(ctx);

      expect(shown).toEqual([['quotes.margin', true]]);
    });

    it('still switches the margin, for this visit', () => {
      const { ctx, shown, toggle } = recorder();
      registerQuoteSettings(ctx);

      toggle().set(false);

      expect(shown.slice(1)).toEqual([['quotes.margin', false]]);
      expect(toggle().value()).toBe(false);
    });
  });
});
