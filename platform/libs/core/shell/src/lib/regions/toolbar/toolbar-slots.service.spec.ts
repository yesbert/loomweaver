import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { ANONYMOUS, AuthSnapshot, LwButtonVariant, MenuItem, View } from '@loomweaver/plugin-sdk';
import { AUTH_SOURCE } from '../../auth/auth-context';
import { ContributionRegistry } from '../../contributions/contribution-registry';
import { surfaceActionsSlot, ToolbarRegistry } from '../../contributions/toolbar-registry';
import { ToolbarSlots } from './toolbar-slots.service';

describe('ToolbarSlots variants', () => {
  const SLOT = 'acme.records/toolbar';
  let registry: ContributionRegistry;
  let slots: ToolbarSlots;
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslocoTestingModule.forRoot({
          langs: { en: {} },
          translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
          preloadLangs: true,
        }),
      ],
      providers: [{ provide: AUTH_SOURCE, useValue: signal<AuthSnapshot>(ANONYMOUS) }],
    });
    registry = TestBed.inject(ContributionRegistry);
    slots = TestBed.inject(ToolbarSlots);
    TestBed.inject(ToolbarRegistry).addToolbar({ slot: SLOT, title: 'Records' }, 'acme');
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warn.mockRestore();
  });

  function contribute(variant: string, pluginId?: string, menu = SLOT): void {
    registry.addMenuItem(
      { id: `${pluginId ?? 'none'}.${variant}`, menu, title: variant, run: () => undefined, variant } as MenuItem,
      pluginId,
    );
  }

  function variants(slot = SLOT): (LwButtonVariant | undefined)[] {
    return slots.view(slot, {}).entries.map((entry) => entry.variant);
  }

  it('keeps primary for the plugin that registered the toolbar', () => {
    contribute('primary', 'acme');

    expect(variants()).toEqual(['primary']);
    expect(warn).not.toHaveBeenCalled();
  });

  it('draws a contributor asking for primary without a variant, and says so once across redraws', () => {
    contribute('primary', 'scanner');

    expect(variants()).toEqual([undefined]);
    expect(variants()).toEqual([undefined]);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain('plugin "scanner"');
    expect(String(warn.mock.calls[0][0])).toContain('plugin "acme"');
  });

  it('keeps every other variant for a contributor', () => {
    contribute('danger', 'scanner');

    expect(variants()).toEqual(['danger']);
    expect(warn).not.toHaveBeenCalled();
  });

  it('gives no primary to an entry no plugin contributed', () => {
    contribute('primary');

    expect(variants()).toEqual([undefined]);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('draws a name outside the vocabulary as no variant, and says so', () => {
    contribute('loud', 'acme');

    expect(variants()).toEqual([undefined]);
    expect(String(warn.mock.calls[0][0])).toContain("'loud'");
  });

  it('keeps primary on a surface’s actions for the plugin that owns the surface', () => {
    registry.addView(
      { id: 'acme.list', region: 'primary', title: 'List', component: class {} } as unknown as View,
      'acme',
    );
    const actions = surfaceActionsSlot('acme.list');
    contribute('primary', 'acme', actions);
    contribute('primary', 'scanner', actions);

    expect(variants(actions)).toEqual(['primary', undefined]);
  });
});
